# Rentify System Overview & VIVA Guide

This document is designed to help you completely understand the Rentify project top-to-bottom so you can easily explain it and ace your college VIVA.

---

## 1. High-Level Architecture Overview

Rentify uses a **Modern Serverless Architecture** split into three main layers: the Frontend (Client), the Backend API (Server), and the Database/Storage layer. 

### The Flow of Data
1. **The Client** (Browser) loads the static HTML/JS files.
2. When a user interacts (e.g., clicking "Reserve"), the JavaScript sends a **REST API request** (HTTP POST) to the Backend. If the user is logged in, it attaches a **JWT (JSON Web Token)** in the request header.
3. **The Backend** (FastAPI) receives the request, verifies the JWT to ensure the user is authentic, and runs the business logic.
4. The Backend communicates with **Supabase (PostgreSQL)** to read or write data.
5. For images, the system uses **Direct Uploads via Signed URLs** to save server bandwidth.

---

## 2. Core Components

### A. Frontend (Client Layer)
- **Tech Stack:** Vanilla HTML5, JavaScript (ES6 Modules), and Tailwind CSS (via CDN).
- **Why this stack?** It keeps the project exceptionally lightweight. Without React or heavy build tools (like Webpack/Vite), it loads instantly and is very easy to read and debug.
- **Key Mechanics:** `api.js` acts as the central brain for network requests. It intercepts all API calls and automatically injects the user's Auth Token.

### B. Backend (API Layer)
- **Tech Stack:** Python 3, FastAPI, Pydantic, Uvicorn.
- **Why FastAPI?** It is asynchronous, incredibly fast, and uses Pydantic to automatically validate incoming JSON data.
- **Deployment:** Deployed as "Serverless Functions" on Vercel, meaning the server only spins up exactly when a request is made, saving compute resources.

### C. Database & Storage (Data Layer)
- **Tech Stack:** Supabase (PostgreSQL), Supabase Auth, Supabase Storage.
- **Why Supabase?** It provides a full backend-as-a-service. It handles secure password hashing, issues JWTs, and provides a robust relational database.

---

## 3. Architecture Image Prompts

You can copy and paste the following prompts into any AI Image Generator (like Midjourney, DALL-E 3, or Stable Diffusion) to create diagrams for your presentation:

> **Prompt 1 (System Architecture):**
> "A clean, modern isometric cloud architecture diagram showing three main layers. On the left: a laptop icon representing the Frontend Client. In the middle: a server node representing a Serverless Python FastAPI backend. On the right: a database cylinder representing PostgreSQL and a cloud folder representing Object Storage. Glowing data arrows connect the layers. Minimalist tech-blueprint style, blue and purple neon accents on a dark background."

> **Prompt 2 (Booking & Double-Booking Prevention Flow):**
> "A sleek flowchart diagram illustrating a data flow. Step 1: User selects dates. Step 2: REST API sends JSON payload. Step 3: PostgreSQL Database checks an 'EXCLUDE Constraint'. Step 4: Branching paths showing 'Success' or '409 Conflict Error'. Professional software engineering diagram, flat design, white background, high resolution."

> **Prompt 3 (Direct Image Upload Flow):**
> "A software sequence diagram visualization. A web browser requests a 'Signed URL' from an API server. The server grants the URL. Then, a bold arrow shows the web browser uploading a photograph *directly* to a Cloud Storage Bucket, completely bypassing the API server. Minimalist UI/UX diagram style."

---

## 4. Potential VIVA Questions & Answers

### Q1: "How did you prevent two users from booking the exact same item on the exact same dates?"
**Answer:** "I avoided doing this in the application code (Python) because of **Race Conditions**—if two users click 'book' at the exact same millisecond, Python might approve both. Instead, I pushed the validation down to the database level using PostgreSQL's **EXCLUDE constraint with a GiST index**. The database natively rejects any row where the `start_date` to `end_date` range overlaps with an existing confirmed booking for that specific `listing_id`. This makes the check 100% atomic and fail-proof."

### Q2: "How does your authentication system work?"
**Answer:** "We use a stateless token-based authentication system. When a user logs in, Supabase securely verifies their password and issues a **JWT (JSON Web Token)**. The frontend stores this token in the browser's `localStorage`. For every subsequent request, the frontend attaches the JWT to the `Authorization` HTTP header. FastAPI intercepts the request, decodes the JWT, and extracts the `user_id` before allowing the action."

### Q3: "Why did you use 'Signed URLs' for image uploads instead of sending the image to FastAPI?"
**Answer:** "Sending large image files through a serverless backend is a bottleneck—it consumes backend RAM, increases latency, and costs more money in server execution time. Instead, the frontend asks FastAPI for a secure, temporary **Signed URL**. The frontend then uses that URL to upload the image *directly* from the user's browser to the Supabase Storage bucket. FastAPI acts only as a permission-granting middleman."

### Q4: "What is Row Level Security (RLS) and why is it in your `0001_init.sql` file?"
**Answer:** "Row Level Security is a PostgreSQL feature that acts as our ultimate defense layer. We wrote policies stating that a user can only `UPDATE` or `DELETE` a listing if `auth.uid() = owner_id`. Even if there is a bug in the Python API that accidentally allows a user to try and delete someone else's item, the database itself will intercept and block the query."

### Q5: "What makes FastAPI better than older frameworks like Flask or Django for this project?"
**Answer:** "FastAPI is built on modern Python features like `async/await`, making it much faster at handling simultaneous network requests. It also uses `Pydantic`, which means I just define my data structures (like `ListingCreate`) using Python classes, and FastAPI automatically validates incoming JSON, throws 422 errors for bad data, and automatically generates our Swagger documentation page (`/docs`)."

### Q6: "If you don't have a backend server running 24/7 on Vercel, how does the API work?"
**Answer:** "The Python backend is deployed as **Serverless Functions**. Vercel analyzes `api/index.py` and turns it into an AWS Lambda function. The server code is technically 'asleep' until a user makes an HTTP request. When a request hits the URL, Vercel spins up the Python environment in milliseconds, serves the request, and shuts it down. This is why it is highly scalable and cost-effective."
