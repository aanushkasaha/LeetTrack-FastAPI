from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class TopicProblemRef(BaseModel):
    leetcode_id: int
    title: str
    slug: str
    difficulty: str
    companies: List[str] = []

class TopicInDB(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None
    problems: List[TopicProblemRef] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }

class TopicPublic(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str]
    total_problems: int
    solved_count: int
    problems: List[TopicProblemRef]