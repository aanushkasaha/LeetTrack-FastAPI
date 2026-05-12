from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

class Difficulty(str, Enum):
    easy = "Easy"
    medium = "Medium"
    hard = "Hard"

class Status(str, Enum):
    solved = "Solved"
    attempted = "Attempted"
    revisit = "Revisit"

class ProblemInDB(BaseModel):
    user_id: str
    leetcode_id: int
    title: str
    slug: str
    difficulty: Difficulty
    status: Status = Status.solved
    topics: List[str] = []
    companies: List[str] = []
    notes: Optional[str] = None
    approach: Optional[str] = None
    solved_at: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    revisit_flag: bool = False
    next_revisit: Optional[datetime] = None
    revisit_interval_days: int = 1
    revisit_ease_factor: float = 2.5

    model_config = {
        "populate_by_name": True,
        "arbitrary_types_allowed": True,
    }

class ProblemCreate(BaseModel):
    leetcode_id: int
    title: str
    slug: str
    difficulty: Difficulty
    status: Status = Status.solved
    topics: List[str] = []
    notes: Optional[str] = None
    approach: Optional[str] = None
    revisit_flag: bool = False

class ProblemPublic(BaseModel):
    id: str
    leetcode_id: int
    title: str
    slug: str
    difficulty: Difficulty
    status: Status
    topics: List[str]
    companies: List[str]
    notes: Optional[str]
    approach: Optional[str]
    solved_at: Optional[datetime]
    revisit_flag: bool
    next_revisit: Optional[datetime]