from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import auth, listings, bookings, uploads

app = FastAPI(title="Rentify API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
def health():
    return {"status": "ok"}

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(listings.router, prefix="/api/listings", tags=["Listings"])
app.include_router(bookings.router, prefix="/api/bookings", tags=["Bookings"])
app.include_router(uploads.router, prefix="/api/uploads", tags=["Uploads"])
