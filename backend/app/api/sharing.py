from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Course, Note
from app.schemas import ProfileResponse, CourseResponse, AccessCodeVerify
from app.api.auth import get_current_user
from typing import Optional

router = APIRouter()

@router.post("/u/{username}/verify")
def verify_profile_access(
    username: str,
    body: AccessCodeVerify,
    db: Session = Depends(get_db)
):
    """Profil erişimi için kod doğrulama"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.access_code != body.access_code:
        raise HTTPException(status_code=403, detail="Invalid access code")
    
    return {"message": "Access granted", "username": username}

@router.get("/u/{username}", response_model=ProfileResponse)
def get_user_profile(
    username: str,
    access_code: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Kullanıcı profili - dersler ve notlar"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Owner ise kod gereksiz
    is_owner = current_user and current_user.id == user.id
    
    if not is_owner:
        if not access_code or access_code != user.access_code:
            raise HTTPException(status_code=403, detail="Access code required")
    
    # Dersleri getir
    courses = db.query(Course).filter(Course.user_id == user.id).all()
    
    course_list = []
    for course in courses:
        notes_count = db.query(Note).filter(Note.course_id == course.id).count()
        course_list.append({
            "id": course.id,
            "code": course.code,
            "name": course.name,
            "created_at": course.created_at,
            "notes_count": notes_count
        })
    
    return {
        "username": user.username,
        "courses": course_list
    }

@router.get("/u/{username}/share-info")
def get_share_info(username: str, db: Session = Depends(get_db)):
    """Paylaşım bilgisi - kod göstermeden"""
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "username": username,
        "share_url": f"http://localhost:3000/u/{username}",
        "requires_code": True
    }
