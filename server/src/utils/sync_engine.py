from datetime import datetime
from src.utils.leetcode import fetch_user_solved, fetch_problem_details
from src.config.database import get_database

async def sync_user_problems(user_id: str, leetcode_handle: str):
    db = get_database()
    submissions = await fetch_user_solved(leetcode_handle)

    for sub in submissions:
        slug = sub.get("titleSlug")
        existing = await db.problems.find_one({"user_id": user_id, "slug": slug})
        if existing:
            continue

        details = await fetch_problem_details(slug)
        if not details:
            continue

        problem = {
            "user_id": user_id,
            "leetcode_id": int(details.get("questionId", 0)),
            "title": details.get("title", sub.get("title")),
            "slug": slug,
            "difficulty": details.get("difficulty", "Medium"),
            "status": "Solved",
            "topics": [t["name"] for t in details.get("topicTags", [])],
            "companies": [],
            "notes": None,
            "approach": None,
            "solved_at": datetime.utcfromtimestamp(int(sub.get("timestamp", 0))),
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "revisit_flag": False,
            "next_revisit": None,
            "revisit_interval_days": 1,
            "revisit_ease_factor": 2.5,
        }
        await db.problems.insert_one(problem)

    return {"synced": len(submissions)}