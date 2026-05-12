from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from datetime import datetime, timezone
from bson import ObjectId
from pydantic import BaseModel

from src.middleware.dependencies import get_current_user
from src.config.database import get_database
from src.models.problem import ProblemCreate, Difficulty, Status

router = APIRouter(prefix="/problems", tags=["Problems"])


def serialize_problem(p: dict) -> dict:
    return {
        "id": str(p["_id"]),
        "leetcode_id": p.get("leetcode_id"),
        "title": p.get("title"),
        "slug": p.get("slug"),
        "difficulty": p.get("difficulty"),
        "status": p.get("status"),
        "topics": p.get("topics", []),
        "companies": p.get("companies", []),
        "notes": p.get("notes"),
        "approach": p.get("approach"),
        "solved_at": p.get("solved_at"),
        "revisit_flag": p.get("revisit_flag", False),
        "next_revisit": p.get("next_revisit"),
        "revisit_interval_days": p.get("revisit_interval_days", 1),
        "revisit_ease_factor": p.get("revisit_ease_factor", 2.5),
        "created_at": p.get("created_at"),
        "updated_at": p.get("updated_at"),
    }


@router.get("/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = str(current_user["_id"])

    pipeline = [
        {"$match": {"user_id": user_id, "status": "Solved"}},
        {
            "$group": {
                "_id": "$difficulty",
                "count": {"$sum": 1},
            }
        },
    ]

    results = await db.problems.aggregate(pipeline).to_list(length=10)

    counts = {"Easy": 0, "Medium": 0, "Hard": 0}
    for r in results:
        if r["_id"] in counts:
            counts[r["_id"]] = r["count"]

    total = sum(counts.values())

    attempted = await db.problems.count_documents({"user_id": user_id, "status": "Attempted"})
    revisit = await db.problems.count_documents({"user_id": user_id, "revisit_flag": True})

    return {
        "total_solved": total,
        "easy": counts["Easy"],
        "medium": counts["Medium"],
        "hard": counts["Hard"],
        "attempted": attempted,
        "revisit_flagged": revisit,
    }


@router.get("/heatmap")
async def get_heatmap(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = str(current_user["_id"])

    pipeline = [
        {
            "$match": {
                "user_id": user_id,
                "solved_at": {"$ne": None},
            }
        },
        {
            "$group": {
                "_id": {
                    "$dateToString": {
                        "format": "%Y-%m-%d",
                        "date": "$solved_at",
                    }
                },
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ]

    results = await db.problems.aggregate(pipeline).to_list(length=1000)

    return [{"date": r["_id"], "count": r["count"]} for r in results]

@router.get("")
async def get_problems(
    difficulty: Optional[str] = Query(None, description="Easy | Medium | Hard"),
    status: Optional[str] = Query(None, description="Solved | Attempted | Revisit"),
    topic: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    revisit_flag: Optional[bool] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    user_id = str(current_user["_id"])

    query: dict = {"user_id": user_id}

    if difficulty:
        query["difficulty"] = difficulty
    if status:
        query["status"] = status
    if topic:
        query["topics"] = {"$in": [topic]}
    if revisit_flag is not None:
        query["revisit_flag"] = revisit_flag
    if search:
        query["title"] = {"$regex": search, "$options": "i"}

    skip = (page - 1) * limit
    total = await db.problems.count_documents(query)

    cursor = db.problems.find(query).sort("created_at", -1).skip(skip).limit(limit)
    problems = await cursor.to_list(length=limit)

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "pages": (total + limit - 1) // limit,
        "problems": [serialize_problem(p) for p in problems],
    }


@router.post("", status_code=201)
async def add_problem(
    body: ProblemCreate,
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    user_id = str(current_user["_id"])

    existing = await db.problems.find_one({"user_id": user_id, "slug": body.slug})
    if existing:
        raise HTTPException(status_code=409, detail="Problem already exists in your list")

    now = datetime.now(timezone.utc)
    problem = {
        "user_id": user_id,
        "leetcode_id": body.leetcode_id,
        "title": body.title,
        "slug": body.slug,
        "difficulty": body.difficulty.value,
        "status": body.status.value,
        "topics": body.topics,
        "companies": [],
        "notes": body.notes,
        "approach": body.approach,
        "solved_at": now if body.status == Status.solved else None,
        "created_at": now,
        "updated_at": now,
        "revisit_flag": body.revisit_flag,
        "next_revisit": None,
        "revisit_interval_days": 1,
        "revisit_ease_factor": 2.5,
    }

    result = await db.problems.insert_one(problem)
    problem["_id"] = result.inserted_id
    return serialize_problem(problem)


class ProblemUpdate(BaseModel):
    notes: Optional[str] = None
    approach: Optional[str] = None
    status: Optional[Status] = None
    revisit_flag: Optional[bool] = None
    difficulty: Optional[Difficulty] = None


@router.patch("/{problem_id}")
async def update_problem(
    problem_id: str,
    body: ProblemUpdate,
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    user_id = str(current_user["_id"])

    try:
        oid = ObjectId(problem_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid problem ID")

    problem = await db.problems.find_one({"_id": oid, "user_id": user_id})
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")

    updates: dict = {"updated_at": datetime.now(timezone.utc)}

    if body.notes is not None:
        updates["notes"] = body.notes
    if body.approach is not None:
        updates["approach"] = body.approach
    if body.status is not None:
        updates["status"] = body.status.value
        if body.status == Status.solved and not problem.get("solved_at"):
            updates["solved_at"] = datetime.now(timezone.utc)
    if body.revisit_flag is not None:
        updates["revisit_flag"] = body.revisit_flag
    if body.difficulty is not None:
        updates["difficulty"] = body.difficulty.value

    await db.problems.update_one({"_id": oid}, {"$set": updates})

    updated = await db.problems.find_one({"_id": oid})
    return serialize_problem(updated)

@router.delete("/{problem_id}", status_code=200)
async def delete_problem(
    problem_id: str,
    current_user: dict = Depends(get_current_user),
):
    db = get_database()
    user_id = str(current_user["_id"])

    try:
        oid = ObjectId(problem_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid problem ID")

    result = await db.problems.delete_one({"_id": oid, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Problem not found")

    return {"message": "Problem deleted"}