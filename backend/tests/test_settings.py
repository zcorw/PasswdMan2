from app.settings import Settings


def test_cors_origins_are_split_and_trimmed() -> None:
    settings = Settings(backend_cors_origins="http://a.test, http://b.test ,,")

    assert settings.cors_origins == ["http://a.test", "http://b.test"]


def test_production_disables_cors_origins() -> None:
    settings = Settings(app_env="production", backend_cors_origins="http://a.test")

    assert settings.cors_origins == []


def test_production_env_check_is_case_insensitive() -> None:
    settings = Settings(app_env=" Production ", backend_cors_origins="http://a.test")

    assert settings.cors_origins == []
