from fastapi import APIRouter, HTTPException, Depends, Query, Header
from typing import List, Optional
from api.core.supabase_client import service, user_client
from api.schemas import ListingCreate, ListingUpdate, ListingResponse, AuthUser
from api.core.auth_deps import get_current_user

router = APIRouter()

@router.get("", response_model=List[ListingResponse])
def get_listings(category: Optional[str] = None, q: Optional[str] = None):
    query = service().table("listings").select("*, profiles!inner(display_name, city)").eq("is_active", True)
    if category and category != "All":
        query = query.eq("category", category)
    if q:
        query = query.ilike("title", f"%{q}%")
    
    resp = query.execute()
    results = []
    for row in resp.data:
        row["owner_name"] = row["profiles"]["display_name"]
        row["owner_city"] = row["profiles"]["city"]
        results.append(row)
    return results

@router.get("/mine/all", response_model=List[ListingResponse])
def get_my_listings(user: AuthUser = Depends(get_current_user)):
    resp = service().table("listings").select("*, profiles!inner(display_name, city)").eq("owner_id", str(user.id)).execute()
    results = []
    for row in resp.data:
        row["owner_name"] = row["profiles"]["display_name"]
        row["owner_city"] = row["profiles"]["city"]
        results.append(row)
    return results

@router.get("/{id}", response_model=ListingResponse)
def get_listing(id: str):
    resp = service().table("listings").select("*, profiles!inner(display_name, city)").eq("id", id).execute()
    if not resp.data:
        raise HTTPException(404, "Listing not found")
    row = resp.data[0]
    row["owner_name"] = row["profiles"]["display_name"]
    row["owner_city"] = row["profiles"]["city"]
    return row

@router.post("", response_model=ListingResponse)
def create_listing(req: ListingCreate, user: AuthUser = Depends(get_current_user), authorization: str = Header(None)):
    token = authorization.removeprefix("Bearer ").strip()
    client = user_client(token)
    data = req.model_dump()
    data["owner_id"] = str(user.id)
    resp = client.table("listings").insert(data).execute()
    if not resp.data:
        raise HTTPException(400, "Failed to create listing")
    
    # fetch with profile to match schema
    return get_listing(resp.data[0]["id"])

@router.patch("/{id}", response_model=ListingResponse)
def update_listing(id: str, req: ListingUpdate, user: AuthUser = Depends(get_current_user), authorization: str = Header(None)):
    token = authorization.removeprefix("Bearer ").strip()
    client = user_client(token)
    data = req.model_dump(exclude_unset=True)
    if not data:
        return get_listing(id)
        
    resp = client.table("listings").update(data).eq("id", id).execute()
    if not resp.data:
        raise HTTPException(400, "Failed to update or not owner")
    return get_listing(id)

@router.delete("/{id}")
def delete_listing(id: str, user: AuthUser = Depends(get_current_user), authorization: str = Header(None)):
    token = authorization.removeprefix("Bearer ").strip()
    client = user_client(token)
    # Soft delete
    resp = client.table("listings").update({"is_active": False}).eq("id", id).execute()
    if not resp.data:
        raise HTTPException(400, "Failed to delete or not owner")
    return {"status": "deleted"}
