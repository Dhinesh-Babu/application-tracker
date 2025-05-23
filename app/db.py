import os
from motor.motor_asyncio import AsyncIOMotorClient

# Get MongoDB URI from environment variable, default to localhost for local dev outside Docker
# When running in Docker Compose, the DATABASE_URL environment variable will be set.
MONGO_URI = os.getenv("DATABASE_URL", "mongodb://localhost:27017/job_tracker")

# Extract database name from URI for clarity if needed, or keep it in the URI
# For example, if your URI is "mongodb://user:pass@host:port/dbname", you can parse it.
# For simplicity, we'll assume the db name is part of the URI or explicitly set.
DB_NAME = "job_tracker" # Explicitly define your database name

# Create client
client = AsyncIOMotorClient(MONGO_URI)

# Select your database and collection
db = client[DB_NAME]
jobs_collection = db["jobs"]

# Optional: Add a function to close the MongoDB connection when the app shuts down
# This is good practice for FastAPI applications.
async def connect_to_mongo():
    logging.info(f"Connecting to MongoDB at: {MONGO_URI}")
    try:
        await client.admin.command('ping') # Test connection
        logging.info("MongoDB connection successful!")
    except Exception as e:
        logging.error(f"MongoDB connection failed: {e}")
        # Depending on your app, you might want to exit or retry here

async def close_mongo_connection():
    logging.info("Closing MongoDB connection...")
    client.close()
    logging.info("MongoDB connection closed.")
