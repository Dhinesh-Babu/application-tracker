# app/main.py - Updated with Jinja2 template support

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse, JSONResponse
from typing import List, Optional
from datetime import date, datetime
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os
import json
import tempfile
import shutil
from pathlib import Path

from bson import ObjectId
from models import (
    JobIn, JobOut, JobUpdate, 
    InterviewQuestionsResponse, InterviewQuestion,
    GenerateQuestionsRequest, SubmitAnswerRequest, GetFeedbackRequest,
    InterviewPrepSession, InterviewPrepSessionOut, AnswerFeedback,
    ResumeUploadResponse, ResumeCustomizationRequest, ResumeCustomizationResponse
)
from db import jobs_collection, db, resumes_collection
import PyPDF2
import io

# PDF generation imports
import pdfkit
from jinja2 import Environment, FileSystemLoader

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
resumes_collection = db["resumes"]

# Create uploads directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Create templates directory
TEMPLATES_DIR = Path(__file__).parent / "templates"
TEMPLATES_DIR.mkdir(exist_ok=True)

# Initialize Jinja2 environment
jinja_env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)))

# Available resume templates
AVAILABLE_TEMPLATES = {
    "modern": {
        "name": "Modern Professional",
        "description": "Clean, modern design with blue accents and two-column layout",
        "template": "modern_resume.html"
    },
    "classic": {
        "name": "Classic Traditional",
        "description": "Traditional serif font layout, perfect for conservative industries",
        "template": "classic_resume.html"
    },
    "creative": {
        "name": "Creative Sidebar",
        "description": "Eye-catching sidebar design with gradient background",
        "template": "creative_resume.html"
    },
    "minimal": {
        "name": "Minimal Clean",
        "description": "Ultra-clean minimal design focusing on content",
        "template": "minimal_resume.html"
    }
}

@app.get("/")
def read_root():
    return {"Hello": "World"}

# Resume Management Endpoints

@app.get("/resume/templates")
async def get_available_templates():
    """Get list of available resume templates"""
    return {"templates": AVAILABLE_TEMPLATES}

@app.post("/resume/upload", response_model=ResumeUploadResponse)
async def upload_resume(file: UploadFile = File(...)):
    """Upload and parse a PDF resume"""
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")
    
    try:
        # Read PDF content
        content = await file.read()
        pdf_reader = PyPDF2.PdfReader(io.BytesIO(content))
        
        # Extract text from all pages
        text_content = ""
        for page in pdf_reader.pages:
            text_content += page.extract_text() + "\n"
        
        if not text_content.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF")
        
        # Parse resume using LLM
        parsed_resume = await parse_resume_with_llm(text_content)
        
        # Save file
        file_path = UPLOAD_DIR / f"resume_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        
        # Save to database
        resume_data = {
            "filename": file.filename,
            "file_path": str(file_path),
            "original_text": text_content,
            "parsed_data": parsed_resume,
            "uploaded_at": datetime.utcnow(),
            "is_active": True
        }
        
        # Deactivate other resumes
        await resumes_collection.update_many({}, {"$set": {"is_active": False}})
        
        result = await resumes_collection.insert_one(resume_data)
        resume_data["id"] = str(result.inserted_id)
        resume_data.pop("_id")
        
        return ResumeUploadResponse(
            id=resume_data["id"],
            filename=file.filename,
            parsed_data=parsed_resume,
            message="Resume uploaded and parsed successfully"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process resume: {str(e)}")

@app.get("/resume/current")
async def get_current_resume():
    """Get the currently active resume"""
    resume = await resumes_collection.find_one({"is_active": True})
    if not resume:
        raise HTTPException(status_code=404, detail="No active resume found")
    
    resume["id"] = str(resume["_id"])
    resume.pop("_id")
    return resume

@app.post("/resume/customize", response_model=ResumeCustomizationResponse)
async def customize_resume(request: ResumeCustomizationRequest):
    """Customize resume based on job description"""
    try:
        # Get current resume
        resume = await resumes_collection.find_one({"is_active": True})
        if not resume:
            raise HTTPException(status_code=404, detail="No active resume found")
        
        # Get job details
        job = await jobs_collection.find_one({"_id": ObjectId(request.job_id)})
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Customize resume sections using LLM
        customized_resume = await customize_resume_with_llm(
            resume["parsed_data"], 
            job["description"], 
            request.sections_to_update
        )
        
        return ResumeCustomizationResponse(
            customized_data=customized_resume,
            sections_updated=request.sections_to_update,
            job_title=job["title"],
            company=job["company"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to customize resume: {str(e)}")

@app.post("/resume/generate-pdf")
async def generate_resume_pdf(
    job_id: str = Form(...),
    sections_to_update: List[str] = Form(...),
    template: str = Form(default="modern")
):
    """Generate a PDF version of the customized resume using selected template"""
    try:
        # Validate template
        if template not in AVAILABLE_TEMPLATES:
            raise HTTPException(status_code=400, detail="Invalid template selected")
        
        # Get current resume
        resume = await resumes_collection.find_one({"is_active": True})
        if not resume:
            raise HTTPException(status_code=404, detail="No active resume found")
        
        # Get job details
        job = await jobs_collection.find_one({"_id": ObjectId(job_id)})
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        
        # Customize resume sections using LLM
        customized_resume = await customize_resume_with_llm(
            resume["parsed_data"], 
            job["description"], 
            sections_to_update
        )
        
        # Generate PDF using Jinja template
        pdf_path = await create_resume_pdf_from_template(
            customized_resume, 
            job["title"], 
            job["company"],
            template
        )
        
        return FileResponse(
            pdf_path,
            media_type='application/pdf',
            filename=f"resume_{job['company'].replace(' ', '_')}_{job['title'].replace(' ', '_')}.pdf"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate PDF: {str(e)}")

# LLM Helper Functions

async def parse_resume_with_llm(text_content: str) -> dict:
    """Parse resume text into structured data using LLM"""
    try:
        prompt = f"""
        Parse the following resume text into structured JSON format. Extract:
        1. Personal information (name, email, phone, etc.)
        2. Skills (technical skills, tools, technologies)
        3. Experience (jobs with company, role, duration, responsibilities)
        4. Education (degrees, institutions, dates)
        5. Projects (name, description, technologies used)
        6. Certifications (if any)
        
        Return ONLY valid JSON in this format:
        {{
            "personal_info": {{
                "name": "...",
                "email": "...",
                "phone": "...",
                "location": "...",
                "linkedin": "...",
                "github": "..."
            }},
            "skills": {{
                "technical_skills": ["..."],
                "tools": ["..."],
                "languages": ["..."]
            }},
            "experience": [
                {{
                    "company": "...",
                    "role": "...",
                    "duration": "...",
                    "location": "...",
                    "responsibilities": ["..."]
                }}
            ],
            "education": [
                {{
                    "institution": "...",
                    "degree": "...",
                    "duration": "...",
                    "location": "..."
                }}
            ],
            "projects": [
                {{
                    "name": "...",
                    "description": "...",
                    "technologies": ["..."],
                    "duration": "..."
                }}
            ],
            "certifications": ["..."]
        }}
        
        Resume text:
        {text_content}
        """
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        # Clean up the response text to extract JSON
        response_text = response.text.strip()
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0]
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0]
        
        parsed_data = json.loads(response_text.strip())
        return parsed_data
        
    except Exception as e:
        print(f"Error parsing resume: {str(e)}")
        # Return a basic structure if parsing fails
        return {
            "personal_info": {},
            "skills": {"technical_skills": [], "tools": [], "languages": []},
            "experience": [],
            "education": [],
            "projects": [],
            "certifications": []
        }

async def customize_resume_with_llm(resume_data: dict, job_description: str, sections_to_update: List[str]) -> dict:
    """Customize resume sections based on job description"""
    try:
        customized_data = resume_data.copy()
        
        for section in sections_to_update:
            if section == "skills":
                customized_data["skills"] = await customize_skills_section(
                    resume_data["skills"], job_description
                )
            elif section == "experience":
                customized_data["experience"] = await customize_experience_section(
                    resume_data["experience"], job_description
                )
            elif section == "projects":
                customized_data["projects"] = await customize_projects_section(
                    resume_data["projects"], job_description
                )
            elif section == "summary":
                customized_data["summary"] = await generate_summary_section(
                    resume_data, job_description
                )
        
        return customized_data
        
    except Exception as e:
        print(f"Error customizing resume: {str(e)}")
        return resume_data

async def customize_skills_section(skills_data: dict, job_description: str) -> dict:
    """Customize skills section based on job description"""
    try:
        prompt = f"""
        Based on this job description, reorder and optimize the skills section to best match the requirements.
        Prioritize relevant skills and add any missing skills that the candidate should highlight.
        
        Current skills: {json.dumps(skills_data)}
        
        Job description: {job_description}
        
        Return optimized skills in the same JSON format, but reordered by relevance and with any additions.
        """
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        response_text = response.text.strip()
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0]
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0]
        
        return json.loads(response_text.strip())
        
    except Exception as e:
        print(f"Error customizing skills: {str(e)}")
        return skills_data

async def customize_experience_section(experience_data: list, job_description: str) -> list:
    """Customize experience section based on job description"""
    try:
        prompt = f"""
        Optimize the experience section to better match this job description.
        Rewrite responsibilities and achievements to emphasize relevant experience.
        Keep the same companies and roles but improve the descriptions.
        
        Current experience: {json.dumps(experience_data)}
        
        Job description: {job_description}
        
        Return optimized experience in the same JSON format.
        """
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        response_text = response.text.strip()
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0]
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0]
        
        return json.loads(response_text.strip())
        
    except Exception as e:
        print(f"Error customizing experience: {str(e)}")
        return experience_data

async def customize_projects_section(projects_data: list, job_description: str) -> list:
    """Customize projects section based on job description"""
    try:
        prompt = f"""
        Select and optimize the most relevant projects for this job description.
        Rewrite project descriptions to emphasize relevant technologies and achievements.
        
        Current projects: {json.dumps(projects_data)}
        
        Job description: {job_description}
        
        Return the 3-4 most relevant projects, optimized for this role.
        """
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        response_text = response.text.strip()
        if '```json' in response_text:
            response_text = response_text.split('```json')[1].split('```')[0]
        elif '```' in response_text:
            response_text = response_text.split('```')[1].split('```')[0]
        
        return json.loads(response_text.strip())
        
    except Exception as e:
        print(f"Error customizing projects: {str(e)}")
        return projects_data

async def generate_summary_section(resume_data: dict, job_description: str) -> str:
    """Generate a professional summary based on the job description"""
    try:
        prompt = f"""
        Write a compelling professional summary (2-3 sentences) for this candidate based on their background and the job they're applying for.
        
        Candidate background: {json.dumps(resume_data)}
        
        Job description: {job_description}
        
        Return only the summary text, no formatting.
        """
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt)
        
        return response.text.strip()
        
    except Exception as e:
        print(f"Error generating summary: {str(e)}")
        return "Experienced professional with a strong background in technology and innovation."

async def create_resume_pdf_from_template(resume_data: dict, job_title: str, company: str, template: str) -> str:
    """Create a PDF resume using Jinja2 template"""
    try:
        # Get template info
        template_info = AVAILABLE_TEMPLATES.get(template, AVAILABLE_TEMPLATES["modern"])
        template_file = template_info["template"]
        
        # Load and render template
        template = jinja_env.get_template(template_file)
        html_content = template.render(**resume_data)
        
        # Create temporary HTML file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as tmp_html:
            tmp_html.write(html_content)
            tmp_html_path = tmp_html.name
        
        # Create temporary PDF file
        tmp_pdf_path = tmp_html_path.replace('.html', '.pdf')
        
        # PDF generation options for better single-page formatting
        options = {
            'page-size': 'Letter',
            'margin-top': '0.5in',
            'margin-right': '0.5in',
            'margin-bottom': '0.5in',
            'margin-left': '0.5in',
            'encoding': "UTF-8",
            'no-outline': None,
            'enable-local-file-access': None,
            'print-media-type': None,
            'disable-smart-shrinking': None,
            'zoom': 0.95  # Slight zoom out to fit more content
        }
        
        # Generate PDF
        pdfkit.from_file(tmp_html_path, tmp_pdf_path, options=options)
        
        # Clean up temporary HTML file
        os.unlink(tmp_html_path)
        
        return tmp_pdf_path
        
    except Exception as e:
        print(f"Error creating PDF: {str(e)}")
        raise e

# Job Management Functions (existing - keeping the same)
async def generate_job_description_from_url(url: str, title: str, company: str) -> str:
    """Use LLM to generate job description by analyzing the URL"""
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

# Job CRUD Endpoints (keeping existing endpoints...)

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

# Interview Prep Endpoints (keeping existing...)

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