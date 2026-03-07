from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .api import auth, notes, sharing

app = FastAPI(title="Notlar Burada API")

# CORS settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(notes.router, prefix="/api", tags=["notes"])
app.include_router(sharing.router, prefix="/api/sharing", tags=["sharing"])

@app.get("/")
async def root():
    return {"message": "Notlar Burada API is running"}
