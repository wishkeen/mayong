from typing import Optional


INDIC_LANGUAGES = {
    "hi": "hin_Deva",
    "sa": "san_Deva",
    "ta": "tam_Taml",
    "te": "tel_Telu",
    "bn": "ben_Beng",
    "mr": "mar_Deva",
    "gu": "guj_Gujr",
    "kn": "kan_Knda",
    "ml": "mal_Mlym",
    "pa": "pan_Guru",
    "ur": "urd_Arab",
}

ARGOS_LANGUAGES = {
    "ar": "ar",
    "es": "es",
    "fr": "fr",
    "de": "de",
}

SUPPORTED_LANGUAGES = frozenset({"en", *INDIC_LANGUAGES, *ARGOS_LANGUAGES})


def engine_for_language(language: str) -> Optional[str]:
    if language in INDIC_LANGUAGES:
        return "indictrans"
    if language in ARGOS_LANGUAGES:
        return "argos"
    return None
