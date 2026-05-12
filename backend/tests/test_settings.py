from app.settings import Settings


def test_cors_origins_are_split_and_trimmed() -> None:
    settings = Settings(backend_cors_origins="http://a.test, http://b.test ,,")

    assert settings.cors_origins == ["http://a.test", "http://b.test"]
