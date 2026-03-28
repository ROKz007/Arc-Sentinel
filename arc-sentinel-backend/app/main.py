from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import sensor, anomaly, health, argus

settings = get_settings()

app = FastAPI(title="Arc-Sentinel API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in settings.cors_origins.split(",")],
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
