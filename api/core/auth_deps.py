from fastapi import Header, HTTPException
from api.core.supabase_client import service
from api.schemas import AuthUser

def get_current_user(authorization: str = Header(None)) -> AuthUser:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = authorization.removeprefix("Bearer ").strip()
    resp = service().auth.get_user(token)
    if not resp or not resp.user:
        raise HTTPException(401, "Invalid token")
    return AuthUser(id=resp.user.id, email=resp.user.email)
