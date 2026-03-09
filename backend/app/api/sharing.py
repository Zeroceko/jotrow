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
    course_id: Optional[int] = None

class VerifyResponse(BaseModel):
    access_token: str
    token_type: str

@router.get("/search", response_model=List[PublicUserResponse])
def search_users(
    q: str = Query("", min_length=1),
    limit: int = 50,
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
    limit: int = 50,
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
def get_public_profile(
    username: str, 
    db: Session = Depends(deps.get_db),
    current_user: Optional[models.User] = Depends(deps.get_optional_current_user)
) -> Any:
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

    is_owner = current_user and current_user.id == user.id
    is_public = getattr(user, "is_profile_public", True)

    return {
        "username": user.username,
        "display_name": user.display_name if (is_public or is_owner) else None,
        "bio": user.bio if (is_public or is_owner) else None,
        "university": user.university if (is_public or is_owner) else None,
        "department": user.department if (is_public or is_owner) else None,
        "note_count": note_count if (is_public or is_owner) else 0,
        "is_profile_public": is_public,
        "message": "Enter 4-digit code to access" if not is_public and not is_owner else "Public Profile",
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
    Save a public note into the authenticated user's library.
    If course_id is provided, saves into that course.
    If course_id is None, saves to the root library (no course).
    """
    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    target_course_id = None
    if request.course_id:
        course = db.query(models.Course).filter(
            models.Course.id == request.course_id,
            models.Course.owner_id == current_user.id
        ).first()
        if not course:
            raise HTTPException(status_code=403, detail="Not authorized to save to this course")
        target_course_id = course.id

    # Get original author
    original_author_name = note.original_author
    if not original_author_name:
        original_author_user = db.query(models.User).filter(models.User.id == note.owner_id).first()
        original_author_name = original_author_user.username if original_author_user else "unknown"

    new_note = models.Note(
        title=note.title,
        content=note.content,
        course_id=target_course_id,
        owner_id=current_user.id,
        original_author=original_author_name
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
def get_public_courses(
    username: str, 
    db: Session = Depends(deps.get_db),
    current_user: Optional[models.User] = Depends(deps.get_optional_current_user)
) -> Any:
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    is_owner = current_user and current_user.id == user.id
    is_public = getattr(user, "is_profile_public", True)
    if not is_public and not is_owner:
        return []
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

@router.get("/{username}/purchases")
def get_user_purchases(
    username: str, 
    db: Session = Depends(deps.get_db),
    current_user: Optional[models.User] = Depends(deps.get_optional_current_user)
) -> Any:
    """
    Get notes that the user has unlocked.
    """
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    is_owner = current_user and current_user.id == user.id
    is_public = getattr(user, "is_profile_public", True)
    if not is_public and not is_owner:
        return []
        
    unlocked = db.query(models.UnlockedNote).filter(models.UnlockedNote.user_id == user.id).all()
    if not unlocked:
        return []
        
    note_ids = [u.note_id for u in unlocked]
    notes = db.query(models.Note).filter(models.Note.id.in_(note_ids)).all()
    
    # When viewing own profile, all purchased notes are accessible
    # When viewing someone else's profile, check if the viewer also unlocked each note
    viewer_unlocked_ids = set()
    if current_user and not is_owner:
        viewer_unlocked = db.query(models.UnlockedNote.note_id).filter(
            models.UnlockedNote.user_id == current_user.id
        ).all()
        viewer_unlocked_ids = {u[0] for u in viewer_unlocked}

    result = []
    for n in notes:
        owner = db.query(models.User).filter(models.User.id == n.owner_id).first()
        
        # Owner always has full access to their own purchased list
        # Viewer has access if they also unlocked the note, or they own the note
        is_note_owner = current_user and current_user.id == n.owner_id
        has_access = is_owner or is_note_owner or (n.id in viewer_unlocked_ids)
            
        # Generate presigned URLs for images
        image_urls = []
        if has_access:
            image_urls = [
                storage.get_presigned_url(img.minio_key)
                for img in n.images
                if img.minio_key
            ]
            
        nt_dict = {
            "id": n.id,
            "title": n.title,
            "content": n.content if has_access else None,
            "paps_price": n.paps_price,
            "requires_pin": n.requires_pin,
            "created_at": n.created_at,
            "owner_username": owner.username if owner else "unknown",
            "images": image_urls,
            "is_locked": not has_access,
            "praise_count": n.praise_count or 0
        }
        result.append(nt_dict)
    
    # Sort by created_at desc (or could sort by unlock time if we had it)
    result.sort(key=lambda x: x["created_at"], reverse=True)
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
            
        # Did the requester unlock it via PAPS or PIN previously?
        if current_user and is_locked:
            try:
                # If current_user is a real User, it has 'id'. If it's a guest dict/model it might not.
                user_id = getattr(current_user, 'id', None)
                if user_id:
                    has_unlocked = db.query(models.UnlockedNote).filter(
                        models.UnlockedNote.note_id == note.id,
                        models.UnlockedNote.user_id == user_id
                    ).first()
                    if has_unlocked:
                        is_locked = False
            except Exception:
                pass
                
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


@router.get("/notes/{note_id}/download")
def download_note(
    note_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """
    Download a note as a ZIP file containing images + summary text.
    Only for note owners or users who have unlocked the note.
    """
    import io
    import zipfile
    import requests
    from fastapi.responses import StreamingResponse

    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    # Check access: owner or unlocked
    is_owner = note.owner_id == current_user.id
    has_unlocked = db.query(models.UnlockedNote).filter(
        models.UnlockedNote.note_id == note_id,
        models.UnlockedNote.user_id == current_user.id,
    ).first()
    is_free = note.paps_price <= 0 and not note.requires_pin

    if not is_owner and not has_unlocked and not is_free:
        raise HTTPException(status_code=403, detail="You must unlock this note first")

    # Get note owner info
    owner = db.query(models.User).filter(models.User.id == note.owner_id).first()
    course = db.query(models.Course).filter(models.Course.id == note.course_id).first() if note.course_id else None

    # Build ZIP in memory
    zip_buf = io.BytesIO()
    with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
        # Summary text file
        summary_lines = [
            f"JOTROW — Not Detayı",
            f"{'=' * 40}",
            f"",
            f"Başlık: {note.title}",
            f"Yazar: @{owner.username if owner else 'bilinmiyor'}",
        ]
        if owner and owner.display_name:
            summary_lines.append(f"Yazar Adı: {owner.display_name}")
        if course:
            summary_lines.append(f"Klasör: {course.title}")
            if course.description:
                summary_lines.append(f"Klasör Açıklama: {course.description}")
        summary_lines.append(f"Oluşturulma: {note.created_at}")
        summary_lines.append(f"PAPS Fiyat: {note.paps_price}")
        summary_lines.append(f"")
        summary_lines.append(f"{'=' * 40}")
        summary_lines.append(f"Açıklama:")
        summary_lines.append(f"{'=' * 40}")
        summary_lines.append(note.content or "(Açıklama yok)")

        zf.writestr("not_bilgisi.txt", "\n".join(summary_lines))

        # Download and add images
        for i, img in enumerate(note.images):
            if img.minio_key:
                try:
                    url = storage.get_presigned_url(img.minio_key)
                    if url:
                        resp = requests.get(url, timeout=15)
                        if resp.status_code == 200:
                            ext = img.minio_key.rsplit(".", 1)[-1] if "." in img.minio_key else "jpg"
                            zf.writestr(f"dosya_{i + 1}.{ext}", resp.content)
                except Exception as e:
                    print(f"[DOWNLOAD] Failed to fetch image {img.minio_key}: {e}")

    zip_buf.seek(0)
    safe_title = "".join(c if c.isalnum() or c in " _-" else "_" for c in note.title)
    return StreamingResponse(
        zip_buf,
        media_type="application/zip",
        headers={"Content-Disposition": f'attachment; filename="{safe_title}.zip"'},
    )
