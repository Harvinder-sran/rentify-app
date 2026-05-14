from fastapi import APIRouter, HTTPException, Depends, Header
from datetime import date
from api.core.supabase_client import service, user_client
from api.schemas import BookingCreate, BookingResponse, BookingsMeResponse, AuthUser
from api.core.auth_deps import get_current_user

router = APIRouter()

@router.post("", response_model=BookingResponse)
def create_booking(req: BookingCreate, user: AuthUser = Depends(get_current_user), authorization: str = Header(None)):
    token = authorization.removeprefix("Bearer ").strip()
    client = user_client(token)
    data = req.model_dump(mode='json')
    data["renter_id"] = str(user.id)
    
    try:
        resp = client.table("bookings").insert(data).execute()
        return get_booking_with_listing(resp.data[0]["id"])
    except Exception as e:
        msg = str(e).lower()
        if "no_double_booking" in msg or "exclude" in msg or "overlap" in msg:
            raise HTTPException(409, "These dates are already booked.")
        raise HTTPException(400, str(e))

def get_booking_with_listing(booking_id: str):
    resp = service().table("bookings").select("*, listings!inner(title, image_urls, price_per_day)").eq("id", booking_id).execute()
    if not resp.data:
        raise HTTPException(404, "Booking not found")
    row = resp.data[0]
    return format_booking(row)

def format_booking(row):
    start_date = date.fromisoformat(row["start_date"])
    end_date = date.fromisoformat(row["end_date"])
    days = (end_date - start_date).days
    # fix 0 day bookings (same day)
    if days == 0:
        days = 1
    price = row["listings"]["price_per_day"]
    row["total_price"] = days * price
    row["listing_title"] = row["listings"]["title"]
    if row["listings"]["image_urls"]:
        row["listing_image"] = row["listings"]["image_urls"][0]
    else:
        row["listing_image"] = None
    return row

@router.get("/me", response_model=BookingsMeResponse)
def get_my_bookings(user: AuthUser = Depends(get_current_user)):
    resp = service().table("bookings").select("*, listings!inner(title, image_urls, price_per_day)").eq("renter_id", str(user.id)).execute()
    
    current = []
    scheduled = []
    past = []
    cancelled = []
    today = date.today()
    
    for row in resp.data:
        formatted = format_booking(row)
        start_date = date.fromisoformat(formatted["start_date"])
        end_date = date.fromisoformat(formatted["end_date"])
            
        if formatted["status"] == "cancelled":
            cancelled.append(formatted)
        else:
            if start_date <= today <= end_date:
                current.append(formatted)
            elif start_date > today:
                scheduled.append(formatted)
            elif end_date < today:
                past.append(formatted)
    
    return BookingsMeResponse(
        current=current,
        scheduled=scheduled,
        past=past,
        cancelled=cancelled
    )

@router.post("/{id}/cancel")
def cancel_booking(id: str, user: AuthUser = Depends(get_current_user), authorization: str = Header(None)):
    token = authorization.removeprefix("Bearer ").strip()
    client = user_client(token)
    resp = client.table("bookings").update({"status": "cancelled"}).eq("id", id).execute()
    if not resp.data:
        raise HTTPException(400, "Failed to cancel or not renter")
    return {"status": "cancelled"}
