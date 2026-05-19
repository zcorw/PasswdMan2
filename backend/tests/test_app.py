from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health_uses_response_envelope_and_request_id() -> None:
    response = client.get("/api/health", headers={"X-Request-ID": "req_test"})

    assert response.status_code == 200
    assert response.headers["X-Request-ID"] == "req_test"
    assert response.headers["Cache-Control"] == "no-store"
    assert response.json() == {
        "data": {"status": "ok", "service": "passwdman2-api"},
        "error": None,
        "requestId": "req_test",
    }


def test_404_uses_error_envelope() -> None:
    response = client.get("/api/missing", headers={"X-Request-ID": "req_missing"})

    assert response.status_code == 404
    body = response.json()
    assert body["data"] is None
    assert body["error"]["code"] == "HTTP_ERROR"
    assert body["requestId"] == "req_missing"


def test_request_validation_errors_use_error_envelope() -> None:
    response = client.get("/api/items", params={"pageSize": 0}, headers={"X-Request-ID": "req_validation"})

    assert response.status_code == 422
    body = response.json()
    assert body == {
        "data": None,
        "error": {"code": "VALIDATION_ERROR", "message": "Invalid request"},
        "requestId": "req_validation",
    }
    assert response.headers["X-Request-ID"] == "req_validation"
