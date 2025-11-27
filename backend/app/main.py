# backend/app/main.py
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time, os
from .db import Base, engine
from .routers import auth_router, vendor_router, user_router
from fastapi.staticfiles import StaticFiles

app = FastAPI()

# Allow only your dev frontend origin(s)
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000"
]

# static uploads dir
uploads_dir = os.path.join(os.getcwd(), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,      # required for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# very small middleware to log every request
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    client = request.client.host if request.client else "unknown"
    print(f"--> {request.method} {request.url.path} from {client}")
    try:
        response = await call_next(request)
    except Exception as e:
        print(f"!!! exception handling {request.method} {request.url.path}: {e}")
        raise
    duration = (time.time() - start) * 1000
    print(f"<-- {request.method} {request.url.path} completed_in={duration:.2f}ms status={response.status_code}")
    return response

# create tables (dev only)
Base.metadata.create_all(bind=engine)

# include routers (only once each)
app.include_router(auth_router.router)
app.include_router(vendor_router.router)
app.include_router(user_router.router)