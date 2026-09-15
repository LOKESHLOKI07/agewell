from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import api_router
from app.modules.emergency.escalation import start_escalation_worker, stop_escalation_worker


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await start_escalation_worker()
    try:
        yield
    finally:
        await stop_escalation_worker()


app = FastAPI(title=settings.PROJECT_NAME, lifespan=lifespan)

if settings.ENVIRONMENT == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(api_router, prefix="/api/v1")

@app.get("/health")
async def health_check():
    return {"status": "ok", "environment": settings.ENVIRONMENT}
