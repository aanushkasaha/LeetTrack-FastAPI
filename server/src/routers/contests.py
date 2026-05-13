from fastapi import APIRouter, Depends, HTTPException
from src.middleware.dependencies import get_current_user
from src.utils.contest import fetch_contest_history, fetch_upcoming_contests
from src.utils.cache import cache_get, cache_set, cache_delete

router = APIRouter(prefix="/contests", tags=["Contests"])

HISTORY_TTL = 600
UPCOMING_TTL = 1800


@router.get("/history")
async def contest_history(current_user: dict = Depends(get_current_user)):
    handle = current_user.get("leetcode_handle")
    if not handle:
        raise HTTPException(status_code=400, detail="No LeetCode handle on your account")

    cache_key = f"lc:contests:{handle}"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    try:
        data = await fetch_contest_history(handle)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LeetCode API error: {str(e)}")

    history = data.get("history", [])
    attended = [c for c in history if c.get("attended")]

    rating_graph = [
        {"contest": c["contest"]["title"], "rating": c["rating"], "timestamp": c["contest"]["startTime"]}
        for c in attended
    ]

    result = {
        "ranking": data.get("ranking"),
        "attended_count": len(attended),
        "rating_graph": rating_graph,
        "history": attended,
    }

    await cache_set(cache_key, result, ttl=HISTORY_TTL)
    return result


@router.get("/upcoming")
async def upcoming_contests(current_user: dict = Depends(get_current_user)):
    cache_key = "lc:upcoming_contests"
    cached = await cache_get(cache_key)
    if cached:
        return cached

    try:
        contests = await fetch_upcoming_contests()
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LeetCode API error: {str(e)}")

    await cache_set(cache_key, contests, ttl=UPCOMING_TTL)
    return contests