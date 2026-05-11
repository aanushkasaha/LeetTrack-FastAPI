from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from src.config.database import connect_db, close_db, settings
from src.routers.auth import router as auth_router
from src.routers.sync import router as sync_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()

app = FastAPI(
    title="LeetTrack API",
    description="Backend for the LeetTrack SDE interview preparation tracker",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CLIENT_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(sync_router)

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "message": "LeetTrack API is running"}