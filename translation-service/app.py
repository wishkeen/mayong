import asyncio
import hmac
import logging
import os
from contextlib import asynccontextmanager
from typing import Annotated

import torch
from argostranslate import translate as argos_translate
from fastapi import FastAPI, Header, HTTPException, Request, Response
from pydantic import BaseModel, ConfigDict, Field, model_validator
from starlette.concurrency import run_in_threadpool
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from IndicTransToolkit import IndicProcessor

from languages import ARGOS_LANGUAGES, INDIC_LANGUAGES, SUPPORTED_LANGUAGES, engine_for_language


logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO"))
logger = logging.getLogger("translation-service")
MAX_TEXTS = 25
MAX_TEXT_LENGTH = 1000
MAX_TOTAL_LENGTH = 10000
MODEL_PATH = "/models/indictrans"

indic_model = None
indic_tokenizer = None
indic_processor = None
indic_lock = asyncio.Lock()
argos_lock = asyncio.Lock()


class TranslationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    targetLanguage: str
    texts: list[str] = Field(min_length=1, max_length=MAX_TEXTS)

    @model_validator(mode="after")
    def validate_request(self):
        if self.targetLanguage not in SUPPORTED_LANGUAGES or self.targetLanguage == "en":
            raise ValueError("Unsupported target language.")
        if any(len(text) > MAX_TEXT_LENGTH for text in self.texts):
            raise ValueError("A text exceeds the maximum length.")
        if sum(len(text) for text in self.texts) > MAX_TOTAL_LENGTH:
            raise ValueError("The request exceeds the maximum total length.")
        return self


class TranslationResponse(BaseModel):
    translations: list[str] = Field(min_length=1, max_length=MAX_TEXTS)


def translate_indic(texts: list[str], language: str) -> list[str]:
    if indic_model is None or indic_tokenizer is None or indic_processor is None:
        raise RuntimeError("Indic translation model is not initialized.")

    model_language = INDIC_LANGUAGES[language]
    normalized = indic_processor.preprocess_batch(
        texts,
        src_lang="eng_Latn",
        tgt_lang=model_language,
    )
    inputs = indic_tokenizer(
        normalized,
        truncation=True,
        max_length=512,
        padding="longest",
        return_tensors="pt",
        return_attention_mask=True,
    ).to(indic_model.device)
    with torch.inference_mode():
        generated = indic_model.generate(
            **inputs,
            use_cache=True,
            max_new_tokens=256,
            num_beams=4,
            num_return_sequences=1,
        )
    decoded = indic_tokenizer.batch_decode(
        generated,
        skip_special_tokens=True,
        clean_up_tokenization_spaces=True,
    )
    return indic_processor.postprocess_batch(decoded, lang=model_language)


def translate_argos(texts: list[str], language: str) -> list[str]:
    target = ARGOS_LANGUAGES[language]
    translation = argos_translate.get_translation_from_codes("en", target)
    if translation is None:
        raise RuntimeError(f"Argos model for target {language} is not installed.")
    return [translation.translate(text) if text.strip() else text for text in texts]


@asynccontextmanager
async def lifespan(_: FastAPI):
    global indic_model, indic_tokenizer, indic_processor

    torch.set_num_threads(max(1, int(os.environ.get("TORCH_NUM_THREADS", "2"))))
    indic_tokenizer = AutoTokenizer.from_pretrained(
        MODEL_PATH,
        trust_remote_code=True,
        local_files_only=True,
    )
    indic_model = AutoModelForSeq2SeqLM.from_pretrained(
        MODEL_PATH,
        trust_remote_code=True,
        local_files_only=True,
    )
    device = "cuda" if torch.cuda.is_available() else "cpu"
    indic_model.to(device)
    indic_model.eval()
    indic_processor = IndicProcessor(inference=True)

    for language, target in ARGOS_LANGUAGES.items():
        if argos_translate.get_translation_from_codes("en", target) is None:
            raise RuntimeError(f"Argos model for target {language} is not installed.")

    logger.info("Translation models initialized on %s.", device)
    yield
    indic_model = None
    indic_tokenizer = None
    indic_processor = None


app = FastAPI(
    title="RitualOS Open Translation Service",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
    lifespan=lifespan,
)


@app.middleware("http")
async def limit_request_body(request: Request, call_next):
    content_length = request.headers.get("content-length")
    if content_length:
        try:
            if int(content_length) > 64_000:
                return Response(status_code=413)
        except ValueError:
            return Response(status_code=400)
    return await call_next(request)


@app.get("/healthz")
async def health_check():
    return {"status": "ok", "ready": indic_model is not None}


@app.post("/v1/translate", response_model=TranslationResponse)
async def translate(
    body: TranslationRequest,
    authorization: Annotated[str | None, Header()] = None,
):
    expected_key = os.environ.get("TRANSLATION_SERVICE_API_KEY", "")
    supplied_key = authorization.removeprefix("Bearer ").strip() if authorization else ""
    if not expected_key or not supplied_key or not hmac.compare_digest(supplied_key, expected_key):
        raise HTTPException(status_code=401, detail="Unauthorized.")

    engine = engine_for_language(body.targetLanguage)
    if engine is None:
        raise HTTPException(status_code=400, detail="Unsupported target language.")

    text_indexes = [index for index, text in enumerate(body.texts) if text.strip()]
    translations = list(body.texts)
    if not text_indexes:
        return TranslationResponse(translations=translations)
    texts = [body.texts[index] for index in text_indexes]

    try:
        lock = indic_lock if engine == "indictrans" else argos_lock
        async with lock:
            if engine == "indictrans":
                translated = await run_in_threadpool(translate_indic, texts, body.targetLanguage)
            else:
                translated = await run_in_threadpool(translate_argos, texts, body.targetLanguage)
    except Exception:
        logger.exception("Translation inference failed for target %s.", body.targetLanguage)
        raise HTTPException(status_code=503, detail="Translation is temporarily unavailable.")

    if (
        len(translated) != len(texts)
        or any(not isinstance(text, str) or not text.strip() or len(text) > 4000 for text in translated)
        or sum(len(text) for text in translated if isinstance(text, str)) > 40_000
    ):
        logger.error("Translation model returned an invalid batch for target %s.", body.targetLanguage)
        raise HTTPException(status_code=503, detail="Translation is temporarily unavailable.")

    for index, value in zip(text_indexes, translated):
        translations[index] = value
    return TranslationResponse(translations=translations)
