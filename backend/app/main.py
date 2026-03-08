from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import auth, notes, sharing, settings

app = FastAPI(title="JOTROW API")

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "https://jotrow-mu.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(notes.router, prefix="/api", tags=["notes"])
app.include_router(sharing.router, prefix="/api/sharing", tags=["sharing"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])

@app.get("/")
async def root():
    return {"message": "JOTROW API is running"}

@app.get("/debug/minio")
async def debug_minio():
    """Temporary debug endpoint to test MinIO connectivity."""
    import io
    from app.services import storage
    from app.core.config import settings
    try:
        storage.ensure_bucket_exists()
        # Try a small test upload
        test_buf = io.BytesIO(b"test")
        key = storage.upload_file_to_minio(test_buf, "debug_test.txt", "text/plain")
        # Try to get the URL
        url = storage.get_presigned_url(key)
        # Clean up
        storage.delete_file_from_minio(key)
        return {
            "status": "ok",
            "endpoint": settings.MINIO_ENDPOINT,
            "bucket": settings.MINIO_BUCKET_NAME,
            "secure": storage.secure_conn,
            "test_url_generated": bool(url),
        }
    except Exception as e:
        return {
            "status": "error",
            "endpoint": settings.MINIO_ENDPOINT,
            "bucket": settings.MINIO_BUCKET_NAME,
            "secure": storage.secure_conn,
            "error": str(e),
            "error_type": type(e).__name__,
        }
