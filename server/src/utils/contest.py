import httpx

LEETCODE_GRAPHQL = "https://leetcode.com/graphql"

CONTEST_HISTORY_QUERY = """
query userContestRankingInfo($username: String!) {
  userContestRanking(username: $username) {
    attendedContestsCount
    rating
    globalRanking
    totalParticipants
    topPercentage
  }
  userContestRankingHistory(username: $username) {
    attended
    trendDirection
    problemsSolved
    totalProblems
    finishTimeInSeconds
    rating
    ranking
    contest {
      title
      startTime
    }
  }
}
"""

UPCOMING_CONTESTS_QUERY = """
query {
  allContests {
    title
    titleSlug
    startTime
    duration
    originStartTime
    isVirtual
  }
}
"""


async def fetch_contest_history(username: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            LEETCODE_GRAPHQL,
            json={"query": CONTEST_HISTORY_QUERY, "variables": {"username": username}},
            headers={"Content-Type": "application/json", "Referer": "https://leetcode.com"},
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json().get("data", {})
        return {
            "ranking": data.get("userContestRanking"),
            "history": data.get("userContestRankingHistory", []),
        }


async def fetch_upcoming_contests() -> list:
    import time
    now = int(time.time())
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            LEETCODE_GRAPHQL,
            json={"query": UPCOMING_CONTESTS_QUERY},
            headers={"Content-Type": "application/json", "Referer": "https://leetcode.com"},
            timeout=15,
        )
        resp.raise_for_status()
        contests = resp.json().get("data", {}).get("allContests", [])
        return [c for c in contests if c.get("startTime", 0) > now]