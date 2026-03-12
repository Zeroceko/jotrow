from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    access_code: str
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class NoteImageResponse(BaseModel):
    id: int
    object_key: str
    order: int
    url: str  # Presigned URL

class NoteCreate(BaseModel):
    title: str
    course_id: int
    description: Optional[str] = None

class NoteResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    course_id: int
    created_at: datetime
    images: List[NoteImageResponse] = []

class CourseCreate(BaseModel):
    code: str
    name: str

class CourseResponse(BaseModel):
    id: int
    code: str
    name: str
    created_at: datetime
    notes_count: int = 0

class ProfileResponse(BaseModel):
    username: str
    courses: List[CourseResponse]

class AccessCodeVerify(BaseModel):
    access_code: str
