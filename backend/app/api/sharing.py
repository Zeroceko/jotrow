from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, ConfigDict
from datetime import datetime, timedelta
from jose import jwt

from app import models
from app.api import deps
from app.core import security
from app.core.config import settings

router = APIRouter()

class PublicUserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    username: str
    display_name: Optional[str] = None
    bio: Optional[str] = None
    university: Optional[str] = None
    department: Optional[str] = None
    course_count: int = 0

class VerifyCodeRequest(BaseModel):
    share_code: str

class SaveNoteRequest(BaseModel):
    course_id: int

class VerifyResponse(BaseModel):
    access_token: str
    token_type: str

@router.get("/search", response_model=List[PublicUserResponse])
def search_users(
    q: str = Query("", min_length=1),
    limit: int = 20,
    db: Session = Depends(deps.get_db)
) -> Any:
    """
    Search for public profiles by username or display name.
    """
    users = db.query(
        models.User,
        func.count(models.Course.id).label('course_count')
    ).outerjoin(models.Course, models.User.id == models.Course.owner_id)\
     .filter(
        models.User.username.ilike(f"%{q}%") |
        models.User.display_name.ilike(f"%{q}%")
     )\
     .group_by(models.User.id)\
     .order_by(models.User.username)\
     .limit(limit).all()

    return [{
        "username": u.username,
        "display_name": u.display_name,
        "bio": u.bio,
        "university": u.university,
        "department": u.department,
        "course_count": c,
    } for u, c in users]

@router.get("/featured", response_model=List[PublicUserResponse])
def get_featured_users(
    limit: int = 10,
    db: Session = Depends(deps.get_db)
) -> Any:
    """
    Get top users with the most courses for default explore page.
    """
    users = db.query(
        models.User,
        func.count(models.Course.id).label('course_count')
    ).outerjoin(models.Course, models.User.id == models.Course.owner_id)\
     .filter(models.User.show_on_explore == True)\
     .group_by(models.User.id)\
     .order_by(func.count(models.Course.id).desc())\
     .limit(limit).all()

    return [{
        "username": u.username,
        "display_name": u.display_name,
        "bio": u.bio,
        "university": u.university,
        "department": u.department,
        "course_count": c,
    } for u, c in users]

@router.get("/{username}")
def get_public_profile(username: str, db: Session = Depends(deps.get_db)) -> Any:
    """
    Check if a public profile exists and return its public metadata.
    Frontend will use this to show the code entry screen.
    """
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    note_count = db.query(func.count(models.Note.id))\
        .join(models.Course, models.Note.course_id == models.Course.id)\
        .filter(models.Course.owner_id == user.id)\
        .scalar() or 0

    return {
        "username": user.username,
        "display_name": user.display_name,
        "bio": user.bio,
        "university": user.university,
        "department": user.department,
        "note_count": note_count,
        "message": "Enter 4-digit code to access",
    }

@router.post("/{username}/verify", response_model=VerifyResponse)
def verify_share_code(
    username: str, 
    request: VerifyCodeRequest,
    db: Session = Depends(deps.get_db)
) -> Any:
    """
    Verify 4 digit code to get read-only access token for this user's content.
    """
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.share_code != request.share_code:
        raise HTTPException(status_code=403, detail="Invalid share code")
        
    # Create a special token that is only valid for viewing this user's public content
    # For simplicity, we just create a normal token but we could add scopes/claims
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # We prefix sub with "guest:" to easily distunguish later if needed
    # But for now, returning a normal token where the guest can act as the user 
    # MIGHT be dangerous. Let's just create a read-only concept or custom claim.
    
    to_encode = {"exp": datetime.utcnow() + access_token_expires, "sub": f"guest:{user.id}"}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

    return {
        "access_token": encoded_jwt,
        "token_type": "bearer",
    }

@router.post("/notes/{note_id}/praise")
def praise_note(
    note_id: int,
    db: Session = Depends(deps.get_db)
) -> Any:
    """
    Increment praise count for a specific note.
    Does not require authentication (guests can praise).
    """
    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    if note.praise_count is None:
        note.praise_count = 0
    note.praise_count += 1
    db.commit()
    db.refresh(note)
    
    return {"message": "Praise added", "praise_count": note.praise_count}


@router.post("/notes/{note_id}/save")
def save_note(
    note_id: int,
    request: SaveNoteRequest,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
) -> Any:
    """
    Save a public note into the authenticated user's selected course.
    """
    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    course = db.query(models.Course).filter(
        models.Course.id == request.course_id,
        models.Course.owner_id == current_user.id
    ).first()
    if not course:
        raise HTTPException(status_code=403, detail="Not authorized to save to this course")
        
    original_course = db.query(models.Course).filter(models.Course.id == note.course_id).first()
    original_author_user = db.query(models.User).filter(models.User.id == original_course.owner_id).first()
    
    new_note = models.Note(
        title=note.title,
        content=note.content,
        course_id=request.course_id,
        original_author=note.original_author or original_author_user.username
    )
    db.add(new_note)
    db.commit()
    db.refresh(new_note)
    
    for img in note.images:
        new_img = models.NoteImage(
            note_id=new_note.id,
            minio_key=img.minio_key
        )
        db.add(new_img)
    db.commit()
    
    return {"message": "Note saved successfully", "note_id": new_note.id}
