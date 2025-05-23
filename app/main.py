from fastapi import FastAPI, HTTPException
from typing import List
from datetime import date, datetime
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os
import json

from bson import ObjectId
from models import (
    JobIn, JobOut, JobUpdate, 
    InterviewQuestionsResponse, InterviewQuestion,
    GenerateQuestionsRequest, SubmitAnswerRequest, GetFeedbackRequest,
    InterviewPrepSession, InterviewPrepSessionOut, AnswerFeedback
)
from db import jobs_collection, db

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini
try:
    genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))
except:
    print("Warning: GOOGLE_API_KEY not set. LLM features will not work.")

# MongoDB collections
interview_sessions_collection = db["interview_sessions"]

@app.get("/")
def read_root():
    return {"Hello": "World"}


async def generate_job_description_from_url(url: str, title: str, company: str) -> str:
    """
    Use LLM to generate job description by analyzing the URL
    """
    try:
        prompt = f"""
        Based on this job posting URL and the provided details, generate a comprehensive job description.
        
        URL: {url}
        Job Title: {title}
        Company: {company}
        
        Please create a detailed job description that includes:
        - Job responsibilities and duties
        - Required qualifications and skills
        - Preferred/nice-to-have qualifications
        - Company information (if you know about this company)
        - Work environment details
        - Any other relevant job details
        
        Make it realistic and comprehensive for interview preparation purposes.
        Focus on what would typically be expected for a {title} role at {company}.
        """
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        return response.text.strip()
        
    except Exception as e:
        print(f"Error generating description: {str(e)}")
        # Fallback description
        return f"""
        {title} position at {company}.
        
        Responsibilities:
        - Contribute to software development and engineering projects
        - Collaborate with cross-functional teams
        - Participate in code reviews and technical discussions
        - Help maintain and improve existing systems
        
        Requirements:
        - Relevant experience in software development
        - Strong problem-solving skills
        - Ability to work in a team environment
        - Excellent communication skills
        
        URL: {url}
        """


# Job endpoints with auto-generated descriptions
@app.post("/jobs")
async def create_job(job: JobIn):
    job_dict = job.model_dump(mode="json")
    job_dict["created_at"] = datetime.utcnow()
    
    # Generate description from URL using LLM
    description = await generate_job_description_from_url(
        str(job.url), 
        job.title, 
        job.company
    )
    job_dict["description"] = description
    
    result = await jobs_collection.insert_one(job_dict)
    job_dict["id"] = str(result.inserted_id)
    job_dict.pop("_id")
    return job_dict


@app.get("/jobs", response_model=List[JobOut])
async def get_jobs():
    jobs = []
    jobs_cursor = jobs_collection.find()
    async for job in jobs_cursor:
        job["id"] = str(job["_id"])
        job.pop("_id")
        
        # Ensure description exists (for backwards compatibility)
        if "description" not in job or not job["description"]:
            job["description"] = await generate_job_description_from_url(
                job["url"], 
                job["title"], 
                job["company"]
            )
            # Update the database with generated description
            await jobs_collection.update_one(
                {"_id": ObjectId(job["id"])},
                {"$set": {"description": job["description"]}}
            )
        
        jobs.append(job)
    return jobs


@app.get("/jobs/{job_id}", response_model=JobOut)
async def get_job(job_id: str):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")

    job = await jobs_collection.find_one({"_id": ObjectId(job_id)})
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job["id"] = str(job["_id"])
    job.pop("_id", None)
    
    # Ensure description exists
    if "description" not in job or not job["description"]:
        job["description"] = await generate_job_description_from_url(
            job["url"], 
            job["title"], 
            job["company"]
        )
        # Update the database with generated description
        await jobs_collection.update_one(
            {"_id": ObjectId(job_id)},
            {"$set": {"description": job["description"]}}
        )
    
    return job


@app.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")

    # Also delete any interview sessions for this job
    await interview_sessions_collection.delete_many({"job_id": job_id})
    
    result = await jobs_collection.delete_one({"_id": ObjectId(job_id)})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Job not found")

    return {"detail": "Job deleted successfully"}


@app.put("/jobs/{job_id}", response_model=JobOut)
async def update_job(job_id: str, job: JobIn):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")
        
    job_dict = job.model_dump(mode="json")
    job_dict["updated_at"] = datetime.utcnow()
    
    # Regenerate description if URL changed
    existing_job = await jobs_collection.find_one({"_id": ObjectId(job_id)})
    if existing_job and str(existing_job.get("url")) != str(job.url):
        job_dict["description"] = await generate_job_description_from_url(
            str(job.url), 
            job.title, 
            job.company
        )

    result = await jobs_collection.find_one_and_update(
        {"_id": ObjectId(job_id)},
        {"$set": job_dict},
        return_document=True
    )

    if not result:
        raise HTTPException(status_code=404, detail="Job not found")
    
    result["id"] = str(result["_id"])
    result.pop("_id", None)
    return result


@app.patch("/jobs/{job_id}", response_model=JobOut)
async def partial_update_job(job_id: str, job: JobUpdate):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")

    job_dict = job.model_dump(exclude_unset=True, mode="json")
    job_dict["updated_at"] = datetime.utcnow()

    if not job_dict:
        raise HTTPException(status_code=400, detail="No fields to update")

    # Regenerate description if URL changed
    if "url" in job_dict:
        existing_job = await jobs_collection.find_one({"_id": ObjectId(job_id)})
        if existing_job:
            title = job_dict.get("title", existing_job.get("title"))
            company = job_dict.get("company", existing_job.get("company"))
            job_dict["description"] = await generate_job_description_from_url(
                str(job_dict["url"]), 
                title, 
                company
            )

    result = await jobs_collection.find_one_and_update(
        {"_id": ObjectId(job_id)},
        {"$set": job_dict},
        return_document=True
    )

    if not result:
        raise HTTPException(status_code=404, detail="Job not found")

    result["id"] = str(result["_id"])
    result.pop("_id", None)
    return result


# Interview Prep Endpoints
@app.post("/interview/generate-questions", response_model=InterviewQuestionsResponse)
async def generate_interview_questions(request: GenerateQuestionsRequest):
    # Get job details directly from database
    if not ObjectId.is_valid(request.job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")

    job = await jobs_collection.find_one({"_id": ObjectId(request.job_id)})
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Ensure description exists
    if "description" not in job or not job["description"]:
        job["description"] = await generate_job_description_from_url(
            job["url"], 
            job["title"], 
            job["company"]
        )
        # Update the database with generated description
        await jobs_collection.update_one(
            {"_id": ObjectId(request.job_id)},
            {"$set": {"description": job["description"]}}
        )
    
    # Generate questions using Gemini
    prompt = f"""
    Based on this job posting, generate 8-10 interview questions that would be asked for this role.
    
    Job Title: {job["title"]}
    Company: {job["company"]}
    Job Description: {job["description"]}
    
    Please provide a mix of:
    - Technical questions specific to the role
    - Behavioral questions
    - Company/role-specific questions
    
    For each question, categorize it as: "technical", "behavioral", "company-specific", or "general"
    And rate difficulty as: "easy", "medium", or "hard"
    
    Return the response as a JSON object with this structure:
    {{
        "questions": [
            {{
                "question": "Tell me about a time you...",
                "category": "behavioral",
                "difficulty": "medium"
            }}
        ]
    }}
    """
    
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        # Parse the JSON response
        response_text = response.text.strip()
        # Clean up the response text to extract JSON
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0]
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0]
        
        questions_data = json.loads(response_text.strip())
        
        questions = [InterviewQuestion(**q) for q in questions_data["questions"]]
        
        return InterviewQuestionsResponse(
            questions=questions,
            job_title=job["title"],
            company=job["company"]
        )
        
    except Exception as e:
        print(f"Error generating questions: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")


@app.post("/interview/submit-answer")
async def submit_answer(request: SubmitAnswerRequest):
    return {"detail": "Answer submitted successfully"}


@app.post("/interview/get-feedback", response_model=AnswerFeedback)
async def get_answer_feedback(request: GetFeedbackRequest):
    try:
        prompt = f"""
        Analyze this interview answer and provide detailed feedback.
        
        Question Category: {request.question_category}
        Question: {request.question}
        Candidate's Answer: {request.answer}
        
        Please provide:
        1. A score from 1-10 (10 being excellent)
        2. Detailed feedback on the answer
        3. 3-5 specific improvement suggestions
        4. 3-5 ideal points that should be covered in a strong answer
        
        Return as JSON:
        {{
            "score": 7,
            "feedback": "Your answer demonstrates...",
            "improvement_suggestions": ["Be more specific about...", "Add quantifiable results..."],
            "ideal_points": ["Should mention specific technologies...", "Include measurable impact..."]
        }}
        """
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        response_text = response.text.strip()
        # Clean up the response text to extract JSON
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0]
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0]
        
        feedback_data = json.loads(response_text.strip())
        
        feedback = AnswerFeedback(
            question=request.question,
            user_answer=request.answer,
            feedback=feedback_data["feedback"],
            score=feedback_data["score"],
            improvement_suggestions=feedback_data["improvement_suggestions"],
            ideal_points=feedback_data["ideal_points"]
        )
        
        return feedback
        
    except Exception as e:
        print(f"Error generating feedback: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to generate feedback: {str(e)}")


@app.get("/interview/sessions/{job_id}")
async def get_interview_sessions(job_id: str):
    sessions = []
    sessions_cursor = interview_sessions_collection.find({"job_id": job_id})
    async for session in sessions_cursor:
        session["id"] = str(session["_id"])
        session.pop("_id")
        sessions.append(session)
    return sessions


@app.get("/interview/session/{session_id}")
async def get_interview_session(session_id: str):
    if not ObjectId.is_valid(session_id):
        raise HTTPException(status_code=400, detail="Invalid session ID")
    
    session = await interview_sessions_collection.find_one({"_id": ObjectId(session_id)})
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    
    session["id"] = str(session["_id"])
    session.pop("_id")
    return session