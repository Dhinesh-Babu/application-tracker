from motor.motor_asyncio import AsyncIOMotorClient

# MongoDB URI - change this if using Atlas or other host
MONGO_URI = "mongodb://localhost:27017"

# Create client
client = AsyncIOMotorClient(MONGO_URI)

# Select your database and collection
db = client["job_tracker"]             # database name
jobs_collection = db["jobs"]           # collection for storing jobs
interview_sessions_collection = db["interview_sessions"]