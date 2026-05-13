from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from datetime import datetime, timezone
from bson import ObjectId
from typing import Optional

from src.middleware.dependencies import get_current_user
from src.config.database import get_database
from src.utils.seed_data import TOPICS_SEED
from src.utils.sm2 import sm2_next_interval, compute_next_revisit

router = APIRouter(prefix="/topics", tags=["Topics"])


@router.post("/seed", status_code=201)
async def seed_topics(current_user: dict = Depends(get_current_user)):
    db = get_database()
    inserted = 0
    for topic in TOPICS_SEED:
        existing = await db.topics.find_one({"slug": topic["slug"]})
        if not existing:
            await db.topics.insert_one({**topic, "created_at": datetime.now(timezone.utc)})
            inserted += 1
    return {"inserted": inserted, "skipped": len(TOPICS_SEED) - inserted}


@router.get("")
async def get_topics(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = str(current_user["_id"])

    topics = await db.topics.find({}).to_list(length=100)

    user_slugs = set(
        p["slug"]
        for p in await db.problems.find(
            {"user_id": user_id, "status": "Solved"}, {"slug": 1}
        ).to_list(length=10000)
    )

    result = []
    for t in topics:
        problems = t.get("problems", [])
        solved = sum(1 for p in problems if p["slug"] in user_slugs)
        result.append({
            "id": str(t["_id"]),
            "name": t["name"],
            "slug": t["slug"],
            "description": t.get("description"),
            "total_problems": len(problems),
            "solved_count": solved,
            "problems": [
                {**p, "solved": p["slug"] in user_slugs}
                for p in problems
            ],
        })

    return result


@router.get("/revisit")
async def get_revisit_queue(
    current_user: dict = Depends(get_current_user),
    due_only: bool = Query(True),
):
    db = get_database()
    user_id = str(current_user["_id"])

    query: dict = {"user_id": user_id, "revisit_flag": True}
    if due_only:
        query["next_revisit"] = {"$lte": datetime.now(timezone.utc)}

    problems = await db.problems.find(query).sort("next_revisit", 1).to_list(length=200)

    return [
        {
            "id": str(p["_id"]),
            "title": p["title"],
            "slug": p["slug"],
            "difficulty": p["difficulty"],
            "next_revisit": p.get("next_revisit"),
            "revisit_interval_days": p.get("revisit_interval_days", 1),
            "revisit_ease_factor": p.get("revisit_ease_factor", 2.5),
        }
        for p in problems
    ]


class ConfidenceBody(BaseModel):
    confidence: int


@router.post("/revisit/{problem_id}/rate")
async def rate_revisit(
    problem_id: str,
    body: ConfidenceBody,
    current_user: dict = Depends(get_current_user),
):
    if body.confidence < 0 or body.confidence > 5:
        raise HTTPException(status_code=400, detail="Confidence must be 0-5")

    db = get_database()
    user_id = str(current_user["_id"])

    try:
        oid = ObjectId(problem_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid problem ID")

    problem = await db.problems.find_one({"_id": oid, "user_id": user_id})
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    new_interval, new_ease = sm2_next_interval(
        ease_factor=problem.get("revisit_ease_factor", 2.5),
        interval_days=problem.get("revisit_interval_days", 1),
        confidence=body.confidence,
    )

    next_revisit = compute_next_revisit(new_interval)

    await db.problems.update_one(
        {"_id": oid},
        {
            "$set": {
                "revisit_interval_days": new_interval,
                "revisit_ease_factor": new_ease,
                "next_revisit": next_revisit,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )

    return {
        "next_revisit": next_revisit,
        "interval_days": new_interval,
        "ease_factor": new_ease,
    }