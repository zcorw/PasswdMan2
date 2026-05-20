from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


def test_reverse_proxy_has_security_and_cache_headers() -> None:
    config = (ROOT / "nginx" / "conf.d" / "default.conf").read_text(encoding="utf-8")

    assert 'add_header X-Content-Type-Options "nosniff" always;' in config
    assert 'add_header X-Frame-Options "DENY" always;' in config
    assert 'add_header Referrer-Policy "no-referrer" always;' in config
    assert 'add_header Content-Security-Policy' in config
    assert 'add_header Cache-Control "no-store" always;' in config
    assert 'location = /sw.js' in config
    assert 'add_header Cache-Control "no-cache" always;' in config
    assert 'location /assets/' in config
    assert 'max-age=31536000, immutable' in config


def test_compose_database_url_uses_environment_variables() -> None:
    compose = (ROOT / "docker-compose.yml").read_text(encoding="utf-8")

    assert "DATABASE_URL: postgresql+psycopg://${POSTGRES_USER" in compose
    assert "SESSION_COOKIE_SECURE" in compose
    assert "passwdman2_dev_password@postgres" not in compose


def test_compose_only_exposes_nginx_to_host() -> None:
    compose = (ROOT / "docker-compose.yml").read_text(encoding="utf-8")

    assert '- "6084:80"' in compose
    assert '- "5432:5432"' not in compose
    assert '- "8000:8000"' not in compose
    assert '- "5173:80"' not in compose
    assert '- "8080:80"' not in compose
