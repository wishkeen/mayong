import os
from pathlib import Path

from huggingface_hub import snapshot_download

from languages import ARGOS_LANGUAGES


MODEL_ID = "ai4bharat/indictrans2-en-indic-dist-200M"
MODEL_REVISION = "2cfd0a20057756d756bf3e53528f492afc52f91a"
MODEL_PATH = Path("/models/indictrans")
ARGOS_PACKAGES = {
    "ar": "1.0",
    "de": "1.3",
    "es": "1.0",
    "fr": "1.9",
}


def install_indictrans() -> None:
    token_path = Path("/run/secrets/hf_token")
    token = os.environ.get("HF_TOKEN")
    if not token and token_path.is_file():
        token = token_path.read_text(encoding="utf-8").strip()

    snapshot_download(
        repo_id=MODEL_ID,
        revision=MODEL_REVISION,
        local_dir=MODEL_PATH,
        token=token or None,
        allow_patterns=[
            "config.json",
            "configuration_indictrans.py",
            "dict.SRC.json",
            "dict.TGT.json",
            "generation_config.json",
            "model.SRC",
            "model.TGT",
            "model.safetensors",
            "modeling_indictrans.py",
            "special_tokens_map.json",
            "tokenization_indictrans.py",
            "tokenizer_config.json",
        ],
    )


def install_argos() -> None:
    from argostranslate import package

    package.update_package_index()
    available = package.get_available_packages()
    for language, version in ARGOS_PACKAGES.items():
        model = next(
            (
                item
                for item in available
                if item.from_code == "en"
                and item.to_code == ARGOS_LANGUAGES[language]
                and str(item.package_version) == version
            ),
            None,
        )
        if model is None:
            raise RuntimeError(f"No pinned Argos model is available for target {language}.")
        package.install_from_path(model.download())


if __name__ == "__main__":
    install_indictrans()
    install_argos()
