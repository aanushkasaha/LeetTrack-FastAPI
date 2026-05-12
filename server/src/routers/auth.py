from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from datetime import datetime
from src.models.user import UserRegister, UserLogin
from src.utils.security import hash_password, verify_password, create_access_token, create_refresh_token
from src.config.database import get_database
from src.middleware.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Auth"])


class LogoutBody(BaseModel):
    refresh_token: str


@router.post("/register")
async def register(body: UserRegister):
    db = get_database()
    if await db.users.find_one({"email": body.email}):
        raise HTTPException(status_code=400, detail="Email already registered")

    user = {
        "username": body.username,
        "email": body.email,
        "password_hash": hash_password(body.password),
        "leetcode_handle": body.leetcode_handle,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
        "refresh_token": None,
    }
    result = await db.users.insert_one(user)
    access_token = create_access_token({"sub": str(result.inserted_id)})
    refresh_token = create_refresh_token({"sub": str(result.inserted_id)})
    await db.users.update_one({"_id": result.inserted_id}, {"$set": {"refresh_token": refresh_token}})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@router.post("/login")
async def login(body: UserLogin):
    db = get_database()
    user = await db.users.find_one({"email": body.email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"sub": str(user["_id"])})
    refresh_token = create_refresh_token({"sub": str(user["_id"])})
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"refresh_token": refresh_token}})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}


@router.post("/logout")
async def logout(body: LogoutBody):
    db = get_database()
    await db.users.update_one(
        {"refresh_token": body.refresh_token},
        {"$set": {"refresh_token": None}}
    )
    return {"message": "Logged out"}


@router.get("/me")
async def me(current_user: dict = Depends(get_current_user)):
    return {
        "id": str(current_user["_id"]),
        "username": current_user["username"],
        "email": current_user["email"],
        "leetcode_handle": current_user.get("leetcode_handle"),
        "created_at": current_user["created_at"],
    }