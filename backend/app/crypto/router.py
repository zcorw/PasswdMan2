from fastapi import APIRouter, Request

from app.crypto.transport import get_server_key_provider
from app.responses import ok_response

router = APIRouter(prefix="/api/crypto", tags=["crypto"])


@router.get("/server-public-key")
def server_public_key(request: Request):
    return ok_response(request, get_server_key_provider().public_key_response())
