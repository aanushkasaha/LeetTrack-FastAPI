import httpx

LEETCODE_GRAPHQL = "https://leetcode.com/graphql"

SOLVED_PROBLEMS_QUERY = """
query userSolvedProblems($username: String!) {
  matchedUser(username: $username) {
    submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
    }
    problemsSolvedBeatsStats {
      difficulty
    }
  }
  recentAcSubmissionList(username: $username, limit: 50) {
    id
    title
    titleSlug
    timestamp
  }
}
"""

ALL_PROBLEMS_QUERY = """
query problemsetQuestionList($skip: Int!, $limit: Int!) {
  problemsetQuestionList: questionList(
    categorySlug: ""
    limit: $limit
    skip: $skip
    filters: {}
  ) {
    questions: data {
      questionId
      title
      titleSlug
      difficulty
      topicTags {
        name
      }
    }
  }
}
"""

async def fetch_user_solved(username: str) -> list:
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            LEETCODE_GRAPHQL,
            json={"query": SOLVED_PROBLEMS_QUERY, "variables": {"username": username}},
            headers={"Content-Type": "application/json", "Referer": "https://leetcode.com"},
            timeout=15,
        )
        data = resp.json()
        return data.get("data", {}).get("recentAcSubmissionList", [])

async def fetch_problem_details(slug: str) -> dict:
    query = """
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionId
        title
        titleSlug
        difficulty
        topicTags { name }
      }
    }
    """
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            LEETCODE_GRAPHQL,
            json={"query": query, "variables": {"titleSlug": slug}},
            headers={"Content-Type": "application/json", "Referer": "https://leetcode.com"},
            timeout=15,
        )
        return resp.json().get("data", {}).get("question", {})