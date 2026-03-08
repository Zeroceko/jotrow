from typing import Any, List, Optional
from app.services import storage

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
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # We prefix sub with "guest:" and append the verified share_code to bypass paps checks
    to_encode = {"exp": datetime.utcnow() + access_token_expires, "sub": f"guest:{user.id}:{request.share_code}"}
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
        owner_id=current_user.id,
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

@router.get("/{username}/courses")
def get_public_courses(username: str, db: Session = Depends(deps.get_db)) -> Any:
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    courses = db.query(
        models.Course,
        func.count(models.Note.id).label('note_count')
    ).outerjoin(models.Note, models.Course.id == models.Note.course_id) \
     .filter(models.Course.owner_id == user.id) \
     .group_by(models.Course.id) \
     .order_by(models.Course.created_at.desc()) \
     .all()

    result = []
    for course, count in courses:
        result.append({
            "id": course.id,
            "title": course.title,
            "description": course.description,
            "created_at": course.created_at,
            "note_count": count
        })
    return result

@router.get("/{username}/courses/{course_id}/notes")
def get_public_notes(
    username: str, 
    course_id: int, 
    db: Session = Depends(deps.get_db),
    current_user: Optional[models.User] = Depends(deps.get_optional_current_user)
) -> Any:
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    course = db.query(models.Course).filter(
        models.Course.id == course_id,
        models.Course.owner_id == user.id,
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    notes = db.query(models.Note).filter(models.Note.course_id == course_id)\
            .order_by(models.Note.created_at.desc())\
            .all()

    result = []
    
    for note in notes:
        is_locked = False
        
        # Determine tracking
        if note.paps_price > 0 or note.requires_pin:
            is_locked = True
            
        # Is the requester the owner?
        if current_user and current_user.id == user.id and not hasattr(current_user, "guest_share_code"):
            is_locked = False
            
        # Did the requester unlock it via PAPS?
        if current_user and is_locked and not hasattr(current_user, "guest_share_code"):
            has_unlocked = db.query(models.UnlockedNote).filter(
                models.UnlockedNote.note_id == note.id,
                models.UnlockedNote.user_id == current_user.id
            ).first()
            if has_unlocked:
                is_locked = False
                
        # Did the requester provide the profile PIN? (Guest token or just by PIN endpoint previously)
        if current_user and hasattr(current_user, "guest_share_code") and note.requires_pin:
            if current_user.guest_share_code == user.share_code:
                # Assuming if they used the guest link via PIN, they unlocked it
                is_locked = False

        image_urls = []
        content = None
        if not is_locked:
            content = note.content
            image_urls = [
                storage.get_presigned_url(img.minio_key)
                for img in note.images
                if img.minio_key
            ]
            
        result.append({
            "id": note.id,
            "title": note.title,
            "content": content,
            "created_at": note.created_at,
            "images": image_urls,
            "praise_count": note.praise_count or 0,
            "paps_price": note.paps_price,
            "is_locked": is_locked,
        })
    return result

class UnlockNoteRequest(BaseModel):
    method: str = "paps"  # "paps" | "pin"
    code: Optional[str] = None

@router.post("/notes/{note_id}/unlock")
def unlock_note(
    note_id: int,
    request: UnlockNoteRequest,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user)
) -> Any:
    """
    Unlock a specific note using PAPS or PIN code.
    """
    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
        
    if note.owner_id == current_user.id:
        return {"message": "You own this note"}
        
    # Check if already unlocked
    already_unlocked = db.query(models.UnlockedNote).filter(
        models.UnlockedNote.note_id == note_id,
        models.UnlockedNote.user_id == current_user.id
    ).first()
    
    if already_unlocked:
        return {"message": "Already unlocked"}
        
    if request.method == "pin":
        if not note.requires_pin:
             # Wait, does the note require a pin? If yes, check PIN. Otherwise, fail since it's PAPS only
             # Actually, if they try to unlock via PIN, they need the owner's share_code. Let's just check the share_code.
             pass
        owner = db.query(models.User).filter(models.User.id == note.owner_id).first()
        if not owner or owner.share_code != request.code:
             raise HTTPException(status_code=400, detail="Invalid share code / PIN")
    else:
        # Default to PAPS payment
        if note.paps_price <= 0:
            pass # Free, no payment needed
        else:
            if current_user.paps_balance < note.paps_price:
                raise HTTPException(status_code=400, detail="Insufficient PAPS balance")
                
            # Deduct from buyer
            current_user.paps_balance -= note.paps_price
            db.add(models.Transaction(
                user_id=current_user.id,
                type="purchase",
                amount=-note.paps_price,
                description=f"Unlocked note: {note.title}"
            ))
            
            # Add to owner
            owner = db.query(models.User).filter(models.User.id == note.owner_id).first()
            if owner:
                owner.paps_balance += note.paps_price
                db.add(models.Transaction(
                    user_id=owner.id,
                    type="sale",
                    amount=note.paps_price,
                    description=f"Someone unlocked note: {note.title}"
                ))
            
    # Record unlock
    db.add(models.UnlockedNote(user_id=current_user.id, note_id=note.id))
    
    db.commit()
    return {"message": "Note unlocked successfully"}
