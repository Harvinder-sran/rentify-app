from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import date, datetime
from uuid import UUID

class AuthUser(BaseModel):
    id: UUID
    email: str

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    display_name: str
    phone: str
    city: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class ProfileResponse(BaseModel):
    id: UUID
    display_name: str
    phone: str
    city: str
    created_at: datetime

class ListingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str
    price_per_day: float
    image_urls: List[str] = []

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    price_per_day: Optional[float] = None
    image_urls: Optional[List[str]] = None

class ListingResponse(BaseModel):
    id: UUID
    owner_id: UUID
    title: str
    description: Optional[str] = None
    category: str
    price_per_day: float
    image_urls: List[str]
    is_active: bool
    created_at: datetime
    owner_name: Optional[str] = None
    owner_city: Optional[str] = None

class BookingCreate(BaseModel):
    listing_id: UUID
    start_date: date
    end_date: date

class BookingResponse(BaseModel):
    id: UUID
    listing_id: UUID
    renter_id: UUID
    start_date: date
    end_date: date
    status: str
    created_at: datetime
    listing_title: Optional[str] = None
    listing_image: Optional[str] = None
    total_price: Optional[float] = None

class BookingsMeResponse(BaseModel):
    current: List[BookingResponse]
    scheduled: List[BookingResponse]
    past: List[BookingResponse]
    cancelled: List[BookingResponse]

class UploadUrlRequest(BaseModel):
    filename: str
    content_type: str
