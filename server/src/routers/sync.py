from fastapi import APIRouter, Depends, HTTPException
from src.middleware.dependencies import get_current_user
from src.utils.sync_engine import sync_user_problems

router = APIRouter(prefix="/sync", tags=["Sync"])


@router.post("/leetcode")
async def sync_leetcode(current_user: dict = Depends(get_current_user)):
    handle = current_user.get("leetcode_handle")
    if not handle:
        raise HTTPException(status_code=400, detail="No LeetCode handle on your account")

    try:
        result = await sync_user_problems(str(current_user["_id"]), handle)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Sync failed: {str(e)}")

    return result