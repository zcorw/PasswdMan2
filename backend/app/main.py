from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.audit.router import router as audit_router
from app.auth.router import router as auth_router
from app.crypto.router import router as crypto_router
from app.items.router import router as items_router
from app.vault.router import router as vault_router
from app.logging_config import configure_logging
from app.middleware import request_context_middleware
from app.responses import error_response, ok_response
from app.settings import get_settings


configure_logging()
settings = get_settings()

app = FastAPI(
    title="PasswdMan2 API",
    version="0.1.0",
    docs_url="/api/docs",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.middleware("http")(request_context_middleware)
app.include_router(crypto_router)
app.include_router(auth_router)
app.include_router(vault_router)
app.include_router(items_router)
app.include_router(audit_router)


@app.get("/api/health", tags=["system"])
def health(request: Request):
    return ok_response(request, {"status": "ok", "service": "passwdman2-api"})


@app.exception_handler(HTTPException)
def http_exception_handler(request: Request, exc: HTTPException):
    return error_response(
        request,
        code="HTTP_ERROR",
        message=str(exc.detail),
        status_code=exc.status_code,
    )


@app.exception_handler(RequestValidationError)
def request_validation_exception_handler(request: Request, exc: RequestValidationError):
    return error_response(
        request,
        code="VALIDATION_ERROR",
        message="Invalid request",
        status_code=422,
    )


@app.exception_handler(StarletteHTTPException)
def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException):
    return error_response(
        request,
        code="HTTP_ERROR",
        message=str(exc.detail),
        status_code=exc.status_code,
    )


@app.exception_handler(Exception)
def unhandled_exception_handler(request: Request, exc: Exception):
    return error_response(
        request,
        code="INTERNAL_ERROR",
        message="Internal server error",
        status_code=500,
    )
