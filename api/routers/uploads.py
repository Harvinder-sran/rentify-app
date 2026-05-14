from fastapi import APIRouter, HTTPException, Depends
from api.core.supabase_client import service, STORAGE_BUCKET
from api.schemas import AuthUser, UploadUrlRequest
from api.core.auth_deps import get_current_user
import uuid

router = APIRouter()

@router.post("/signed-url")
def get_signed_url(req: UploadUrlRequest, user: AuthUser = Depends(get_current_user)):
    try:
        path = f"{user.id}/{uuid.uuid4()}_{req.filename}"
        
        # In python supabase client, there isn't always a direct create_signed_upload_url depending on version
        # Wait, the prompt says: "(Supabase Storage create_signed_upload_url)".
        # Let's use the provided method.
        resp = service().storage.from_(STORAGE_BUCKET).create_signed_upload_url(path)
        
        public_url = service().storage.from_(STORAGE_BUCKET).get_public_url(path)
        
        return {
            "upload_url": resp["signed_url"],
            "public_url": public_url,
            "path": path,
            "token": resp.get("token")
        }
    except Exception as e:
        raise HTTPException(400, str(e))
