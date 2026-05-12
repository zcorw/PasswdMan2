from typing import Any

from fastapi import Request
from fastapi.responses import JSONResponse


def get_request_id(request: Request) -> str:
    return getattr(request.state, "request_id", "")


def ok_response(request: Request, data: Any, status_code: int = 200) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "data": data,
            "error": None,
            "requestId": get_request_id(request),
        },
    )


def error_response(
    request: Request,
    code: str,
    message: str,
    status_code: int,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "data": None,
            "error": {"code": code, "message": message},
            "requestId": get_request_id(request),
        },
    )
