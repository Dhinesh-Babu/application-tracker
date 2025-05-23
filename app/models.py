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
    url: HttpUrl
    company: str
    status: JobStatus
    date_applied: date
    resume_path: Optional[str] = None
    notes: Optional[str] = None


class JobOut(JobIn):
    id: str
    description: str  # Auto-generated from URL
    created_at: datetime


class JobUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[HttpUrl] = None
    company: Optional[str] = None
    status: Optional[JobStatus] = None
    date_applied: Optional[date] = None
    resume_path: Optional[str] = None
    notes: Optional[str] = None


# Interview Prep Models (unchanged)
class InterviewQuestion(BaseModel):
    question: str
    category: str  # "technical", "behavioral", "company-specific", etc.
    difficulty: str  # "easy", "medium", "hard"


class InterviewQuestionsResponse(BaseModel):
    questions: List[InterviewQuestion]
    job_title: str
    company: str


class UserAnswer(BaseModel):
    question: str
    answer: str
    question_category: str


class AnswerFeedback(BaseModel):
    question: str
    user_answer: str
    feedback: str
    score: int  # 1-10
    improvement_suggestions: List[str]
    ideal_points: List[str]


class InterviewPrepSession(BaseModel):
    job_id: str
    questions: List[InterviewQuestion]
    answers: List[UserAnswer] = []
    feedback: List[AnswerFeedback] = []
    created_at: datetime
    updated_at: datetime


class InterviewPrepSessionOut(InterviewPrepSession):
    id: str


class GenerateQuestionsRequest(BaseModel):
    job_id: str


class SubmitAnswerRequest(BaseModel):
    session_id: str
    question: str
    answer: str
    question_category: str


class GetFeedbackRequest(BaseModel):
    session_id: str
    question: str
    answer: str
    question_category: str