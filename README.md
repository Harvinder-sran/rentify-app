# Rentify

A peer-to-peer rental marketplace web app.

## Local Dev Setup

### Prerequisites
- Python 3.11+
- A Supabase project (free tier)

### Install & run
```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Terminal 1 — backend
.venv\Scripts\uvicorn api.index:app --port 8001 --reload

# Terminal 2 — frontend
python -m http.server 5500 --directory public
```

- Frontend: http://localhost:5500
- Backend: http://localhost:8001
- API docs (Swagger): http://localhost:8001/docs
