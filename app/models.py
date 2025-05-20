from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import date, datetime
from enum import Enum

class JobStatus(str, Enum):
    applied = "Applied"
    rejected = "Rejected"
    interview = "Interview"


class JobIn(BaseModel):
    title: str
    description: str
    url: HttpUrl
    company: str
    status: JobStatus
    date_applied: date
    resume_path: Optional[str] = None
    notes: Optional[str] = None


class JobOut(JobIn):
    id: str
    created_at: datetime


class JobUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    url: Optional[HttpUrl] = None
    company: Optional[str] = None
    status: Optional[JobStatus] = None
    date_applied: Optional[date] = None
    resume_path: Optional[str] = None
    notes: Optional[str] = None