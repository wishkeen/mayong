import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from languages import engine_for_language, SUPPORTED_LANGUAGES


class LanguageRoutingTests(unittest.TestCase):
    def test_all_app_languages_route_to_an_engine(self):
        app_languages = {
            "en", "hi", "sa", "ta", "te", "bn", "mr", "gu",
            "kn", "ml", "pa", "ur", "ar", "es", "fr", "de",
        }
        self.assertEqual(SUPPORTED_LANGUAGES, app_languages)
        for language in app_languages - {"en"}:
            with self.subTest(language=language):
                self.assertIn(engine_for_language(language), {"indictrans", "argos"})

    def test_english_does_not_need_translation(self):
        self.assertIsNone(engine_for_language("en"))

    def test_unknown_language_is_rejected_by_router(self):
        self.assertIsNone(engine_for_language("xx"))


if __name__ == "__main__":
    unittest.main()
