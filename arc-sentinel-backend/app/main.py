from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import sensor, anomaly, health, argus

settings = get_settings()

app = FastAPI(title="Arc-Sentinel API", version="0.1.0")


# Strict CORS for production
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://arc-sentinel-web.vercel.app",
    "https://arc-sentinel-hackolympus.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sensor.router)
app.include_router(anomaly.router)
app.include_router(health.router)
app.include_router(argus.router)



@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "service": "arc-sentinel"}

# Fast health check for frontend wake-up
@app.get("/ping", tags=["health"])
def ping():
    return {"status": "alive", "service": "arc-sentinel-backend"}
