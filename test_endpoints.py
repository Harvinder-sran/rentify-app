import os
import requests
import json
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY")

def run_tests():
    print("=== Testing Supabase Configuration ===")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    # Check Buckets
    print("Listing buckets...")
    try:
        buckets = supabase.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        print(f"Found buckets: {bucket_names}")
        if "listing-images" not in bucket_names:
            print("ERROR: 'listing-images' bucket is MISSING!")
        else:
            print("Bucket 'listing-images' exists.")
    except Exception as e:
        print(f"Error checking buckets: {e}")

    # Start testing API
    BASE_URL = "http://localhost:8001/api"
    print("\n=== Testing API Endpoints ===")
    
    # 1. Signup / Login
    email = "testrunner@example.com"
    password = "password123"
    print(f"Testing /auth/signup with {email}...")
    res = requests.post(f"{BASE_URL}/auth/signup", json={
        "email": email,
        "password": password,
        "display_name": "Test Runner",
        "phone": "1234567890",
        "city": "Test City"
    })
    
    token = None
    if res.status_code == 200:
        print("Signup successful")
        token = res.json().get("access_token")
    elif res.status_code == 400 and "User already registered" in res.text:
        print("User already registered, logging in...")
        res = requests.post(f"{BASE_URL}/auth/login", json={
            "email": email,
            "password": password
        })
        if res.status_code == 200:
            print("Login successful")
            token = res.json().get("access_token")
        else:
            print(f"Login failed: {res.status_code} {res.text}")
    else:
        print(f"Signup failed: {res.status_code} {res.text}")

    if not token:
        print("Cannot continue without token.")
        return

    headers = {"Authorization": f"Bearer {token}"}

    # 2. Uploads Signed URL
    print("\nTesting /uploads/signed-url...")
    res = requests.post(f"{BASE_URL}/uploads/signed-url", json={
        "filename": "test.jpg",
        "content_type": "image/jpeg"
    }, headers=headers)
    if res.status_code == 200:
        print("Uploads endpoint OK:", res.json())
    else:
        print(f"Uploads endpoint failed: {res.status_code} {res.text}")
        
    # 3. Create Listing
    print("\nTesting POST /listings...")
    res = requests.post(f"{BASE_URL}/listings", json={
        "title": "Test Listing",
        "description": "Test Description",
        "category": "Electronics",
        "price_per_day": 100.0,
        "image_urls": []
    }, headers=headers)
    
    listing_id = None
    if res.status_code == 200:
        print("Create listing OK")
        listing_id = res.json().get("id")
    else:
        print(f"Create listing failed: {res.status_code} {res.text}")
        
    # 4. Get Listings
    print("\nTesting GET /listings...")
    res = requests.get(f"{BASE_URL}/listings")
    if res.status_code == 200:
        print(f"Get listings OK, count: {len(res.json())}")
    else:
        print(f"Get listings failed: {res.status_code} {res.text}")
        
    # 5. Create Booking
    print("\nTesting POST /bookings...")
    if listing_id:
        res = requests.post(f"{BASE_URL}/bookings", json={
            "listing_id": listing_id,
            "start_date": "2026-10-01",
            "end_date": "2026-10-05"
        }, headers=headers)
        if res.status_code == 200:
            print("Create booking OK")
            booking_id = res.json().get("id")
        else:
            print(f"Create booking failed: {res.status_code} {res.text}")
            
    # 6. Delete Listing
    print("\nTesting DELETE /listings...")
    if listing_id:
        res = requests.delete(f"{BASE_URL}/listings/{listing_id}", headers=headers)
        if res.status_code == 200:
            print("Delete listing OK")
        else:
            print(f"Delete listing failed: {res.status_code} {res.text}")

if __name__ == "__main__":
    run_tests()
