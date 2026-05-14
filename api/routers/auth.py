from fastapi import APIRouter, HTTPException, Depends
from api.core.supabase_client import anon, service
from api.schemas import SignupRequest, LoginRequest, AuthUser, ProfileResponse
from api.core.auth_deps import get_current_user

router = APIRouter()

@router.post("/signup")
def signup(req: SignupRequest):
    sb_anon = anon()
    try:
        auth_resp = sb_anon.auth.sign_up({"email": req.email, "password": req.password})
        if not auth_resp.user:
            raise HTTPException(400, "Signup failed")
        
        # Insert profile
        service().table("profiles").insert({
            "id": auth_resp.user.id,
            "display_name": req.display_name,
            "phone": req.phone,
            "city": req.city
        }).execute()
        
        if not auth_resp.session:
            return {"message": "User created. Check email to confirm."}
            
        return {"access_token": auth_resp.session.access_token, "user_id": auth_resp.user.id}
    except Exception as e:
        raise HTTPException(400, str(e))

@router.post("/login")
def login(req: LoginRequest):
    sb_anon = anon()
    try:
        auth_resp = sb_anon.auth.sign_in_with_password({"email": req.email, "password": req.password})
        if not auth_resp.session:
            raise HTTPException(401, "Invalid credentials")
        return {"access_token": auth_resp.session.access_token, "user_id": auth_resp.user.id}
    except Exception as e:
        raise HTTPException(401, str(e))

@router.get("/me", response_model=ProfileResponse)
def get_me(user: AuthUser = Depends(get_current_user)):
    try:
        resp = service().table("profiles").select("*").eq("id", str(user.id)).execute()
        if not resp.data:
            raise HTTPException(404, "Profile not found")
        return resp.data[0]
    except Exception as e:
        raise HTTPException(400, str(e))
