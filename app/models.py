# app/models.py - Updated with resume models

from pydantic import BaseModel, HttpUrl
from typing import Optional, List, Dict, Any
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

# Resume Models
class PersonalInfo(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    github: Optional[str] = None

class Skills(BaseModel):
    technical_skills: List[str] = []
    tools: List[str] = []
    languages: List[str] = []

class Experience(BaseModel):
    company: str
    role: str
    duration: str
    location: Optional[str] = None
    responsibilities: List[str] = []

class Education(BaseModel):
    institution: str
    degree: str
    duration: str
    location: Optional[str] = None

class Project(BaseModel):
    name: str
    description: str
    technologies: List[str] = []
    duration: Optional[str] = None

class ParsedResumeData(BaseModel):
    personal_info: PersonalInfo
    skills: Skills
    experience: List[Experience]
    education: List[Education]
    projects: List[Project]
    certifications: List[str] = []
    summary: Optional[str] = None

class ResumeUploadResponse(BaseModel):
    id: str
    filename: str
    parsed_data: ParsedResumeData
    message: str

class ResumeCustomizationRequest(BaseModel):
    job_id: str
    sections_to_update: List[str]  # ["skills", "experience", "projects", "summary"]

class ResumeCustomizationResponse(BaseModel):
    customized_data: ParsedResumeData
    sections_updated: List[str]
    job_title: str
    company: str

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