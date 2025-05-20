from fastapi import FastAPI
from typing import List
from datetime import date, datetime


from bson import ObjectId
from models import JobIn, JobOut, JobUpdate
from db import jobs_collection

app = FastAPI()


@app.get("/")
def read_root():
    return {"Hello": "World"}


@app.post("/jobs")
async def create_job(job: JobIn):
    
    job_dict = job.model_dump(mode="json")
    # Append the current date and time to the job dictionary
    job_dict["created_at"] = datetime.utcnow()
    
    # Send to MongoDB
    result = await jobs_collection.insert_one(job_dict)

    # Convert the inserted ID to a string and remove the MongoDB _id field
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
    job.pop("_id",None)
    return job

@app.delete("/jobs/{job_id}")
async def delete_job(job_id: str):
    if not ObjectId.is_valid(job_id):
        raise HTTPException(status_code=400, detail="Invalid job ID")

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