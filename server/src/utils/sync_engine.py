from datetime import datetime, timezone
from src.utils.leetcode import fetch_user_solved, fetch_problem_details
from src.utils.cache import cache_get, cache_set
from src.config.database import get_database

SOLVED_CACHE_TTL = 300
DETAILS_CACHE_TTL = 86400


async def sync_user_problems(user_id: str, leetcode_handle: str) -> dict:
    db = get_database()

    cache_key = f"lc:solved:{leetcode_handle}"
    submissions = await cache_get(cache_key)
    if not submissions:
        submissions = await fetch_user_solved(leetcode_handle)
        await cache_set(cache_key, submissions, ttl=SOLVED_CACHE_TTL)

    inserted = 0
    skipped = 0

    for sub in submissions:
        slug = sub.get("titleSlug")
        if not slug:
            continue

        existing = await db.problems.find_one({"user_id": user_id, "slug": slug})
        if existing:
            skipped += 1
            continue

        details_key = f"lc:details:{slug}"
        details = await cache_get(details_key)
        if not details:
            details = await fetch_problem_details(slug)
            if details:
                await cache_set(details_key, details, ttl=DETAILS_CACHE_TTL)

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
            "solved_at": datetime.fromtimestamp(int(sub.get("timestamp", 0)), tz=timezone.utc),
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc),
            "revisit_flag": False,
            "next_revisit": None,
            "revisit_interval_days": 1,
            "revisit_ease_factor": 2.5,
        }
        await db.problems.insert_one(problem)
        inserted += 1

    return {
        "synced": inserted,
        "skipped": skipped,
        "total_fetched": len(submissions),
    }