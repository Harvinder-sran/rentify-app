"""service() bypasses RLS (server-side trusted ops);
anon() is used for sign_up and user-scoped operations."""
import os
from functools import lru_cache
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_ANON_KEY = os.environ["SUPABASE_ANON_KEY"]
SUPABASE_SERVICE_KEY = os.environ["SUPABASE_SERVICE_KEY"]
STORAGE_BUCKET = os.environ.get("SUPABASE_STORAGE_BUCKET", "listing-images")

@lru_cache(maxsize=1)
def service() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

@lru_cache(maxsize=1)
def anon() -> Client:
    return create_client(SUPABASE_URL, SUPABASE_ANON_KEY)

def user_client(jwt: str) -> Client:
    c = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
    c.postgrest.auth(jwt)
    return c
