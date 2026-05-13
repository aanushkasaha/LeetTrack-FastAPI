from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from src.config.database import connect_db, close_db, settings
from src.routers.auth import router as auth_router
from src.routers.sync import router as sync_router
from src.routers.problems import router as problems_router
from src.routers.topics import router as topics_router
from src.routers.contests import router as contests_router

limiter = Limiter(key_func=get_remote_address)


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

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.CLIENT_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
app.include_router(sync_router, prefix="/api")
app.include_router(problems_router, prefix="/api")
app.include_router(topics_router, prefix="/api")
app.include_router(contests_router, prefix="/api")


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "message": "LeetTrack API is running"}