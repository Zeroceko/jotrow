import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, Form
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from sqlalchemy import func

from app import models
from app.api import deps
from app.services import storage

router = APIRouter()


# ── Schemas ──────────────────────────────────────────────────────────────────

class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None


class CourseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None


class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None


class NoteMoveRequest(BaseModel):
    course_id: Optional[int] = None  # None = move to library root


class CourseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str]
    created_at: datetime.datetime
    note_count: int = 0


class NoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    content: Optional[str]
    created_at: datetime.datetime
    images: List[str] = []
    praise_count: int = 0
    original_author: Optional[str] = None
    paps_price: int = 0
    is_locked: bool = False


# ── Course Endpoints ──────────────────────────────────────────────────────────

@router.get("/courses", response_model=List[CourseResponse])
def read_courses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    courses = db.query(
        models.Course,
        func.count(models.Note.id).label('note_count')
    ).outerjoin(models.Note, models.Course.id == models.Note.course_id) \
     .filter(models.Course.owner_id == current_user.id) \
     .group_by(models.Course.id) \
     .order_by(models.Course.created_at.desc()) \
     .offset(skip).limit(limit).all()

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


@router.get("/notes", response_model=List[NoteResponse])
def read_library_notes(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    notes = db.query(models.Note).filter(
        models.Note.owner_id == current_user.id,
        models.Note.course_id == None,
        models.Note.original_author == None,  # exclude saved notes from others
    ).join(models.NoteImage, models.Note.id == models.NoteImage.note_id, isouter=True).all()

    # Filter to only notes owned by this user (via course or uncategorized)
    # Since uncategorized notes have no course, we need a different ownership check.
    # For now we mark notes as belonging to the user via a direct owner relationship.
    # As a simple approach, we actually need to tag uncategorized notes.
    # For backwards compatibility: re-query by finding notes whose course owner is current_user
    # OR notes WITHOUT a course that were created in a session (no reliable ownership yet).
    # BEST APPROACH: add owner_id to Note. For now, just return notes where course_id is null.
    # This is safe because existing data all has course_id set.
    result = []
    for note in notes:
        image_urls = [
            storage.get_presigned_url(img.minio_key)
            for img in note.images
            if img.minio_key
        ]
        result.append({
            "id": note.id,
            "title": note.title,
            "content": note.content,
            "created_at": note.created_at,
            "images": image_urls,
            "praise_count": note.praise_count or 0,
            "original_author": note.original_author,
        })
    return result


@router.get("/courses/{course_id}", response_model=CourseResponse)
def read_course(
    course_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    course = db.query(models.Course).filter(
        models.Course.id == course_id,
        models.Course.owner_id == current_user.id,
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@router.post("/courses", response_model=CourseResponse)
def create_course(
    *,
    db: Session = Depends(deps.get_db),
    course_in: CourseCreate,
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    course = models.Course(
        title=course_in.title,
        description=course_in.description,
        owner_id=current_user.id,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


@router.put("/courses/{course_id}", response_model=CourseResponse)
def update_course(
    course_id: int,
    course_in: CourseUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    course = db.query(models.Course).filter(
        models.Course.id == course_id,
        models.Course.owner_id == current_user.id,
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    if course_in.title is not None:
        course.title = course_in.title
    if course_in.description is not None:
        course.description = course_in.description

    db.commit()
    db.refresh(course)
    return course


@router.delete("/courses/{course_id}", status_code=204)
def delete_course(
    course_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> None:
    course = db.query(models.Course).filter(
        models.Course.id == course_id,
        models.Course.owner_id == current_user.id,
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Delete all images from MinIO for every note in this course
    notes = db.query(models.Note).filter(models.Note.course_id == course_id).all()
    for note in notes:
        for img in note.images:
            if img.minio_key:
                storage.delete_file_from_minio(img.minio_key)

    db.delete(course)
    db.commit()


# ── Note Endpoints ────────────────────────────────────────────────────────────

@router.get("/courses/{course_id}/notes", response_model=List[NoteResponse])
def read_notes(
    course_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    course = db.query(models.Course).filter(
        models.Course.id == course_id,
        models.Course.owner_id == current_user.id,
    ).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    notes = db.query(models.Note).filter(models.Note.course_id == course_id)\
            .order_by(models.Note.created_at.desc())\
            .offset(skip).limit(limit).all()

    result = []
    for note in notes:
        image_urls = [
            storage.get_presigned_url(img.minio_key)
            for img in note.images
            if img.minio_key
        ]
        result.append({
            "id": note.id,
            "title": note.title,
            "content": note.content,
            "created_at": note.created_at,
            "images": image_urls,
            "praise_count": note.praise_count or 0,
            "original_author": note.original_author,
        })
    return result


@router.post("/notes")
def create_note(
    course_id: Optional[int] = Form(None),
    title: str = Form(...),
    content: Optional[str] = Form(None),
    paps_price: int = Form(0),
    files: List[UploadFile] = File(default=[]),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Create a note. course_id is optional — omit to add to library root."""
    if course_id is not None:
        course = db.query(models.Course).filter(
            models.Course.id == course_id,
            models.Course.owner_id == current_user.id,
        ).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

    note = models.Note(title=title, content=content, course_id=course_id, owner_id=current_user.id, paps_price=paps_price)
    db.add(note)
    db.commit()
    db.refresh(note)

    for file in files:
        if file.filename:
            minio_key = storage.upload_file_to_minio(file.file, file.filename, file.content_type)
            db.add(models.NoteImage(note_id=note.id, minio_key=minio_key))

    db.commit()
    return {"message": "Note uploaded successfully", "note_id": note.id}


@router.put("/notes/{note_id}", response_model=NoteResponse)
def update_note(
    note_id: int,
    note_in: NoteUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    # Support notes with or without a course
    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    # Ownership check
    if note.course_id is not None:
        course = db.query(models.Course).filter(
            models.Course.id == note.course_id,
            models.Course.owner_id == current_user.id,
        ).first()
        if not course:
            raise HTTPException(status_code=403, detail="Not authorized")

    if note_in.title is not None:
        note.title = note_in.title
    if note_in.content is not None:
        note.content = note_in.content

    db.commit()
    db.refresh(note)

    image_urls = [
        storage.get_presigned_url(img.minio_key)
        for img in note.images
        if img.minio_key
    ]
    return {
        "id": note.id,
        "title": note.title,
        "content": note.content,
        "created_at": note.created_at,
        "images": image_urls,
        "praise_count": note.praise_count or 0,
        "original_author": note.original_author,
    }


@router.put("/notes/{note_id}/move")
def move_note(
    note_id: int,
    move_in: NoteMoveRequest,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> Any:
    """Move a note to a course, or back to library root (course_id=null)."""
    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    if move_in.course_id is not None:
        course = db.query(models.Course).filter(
            models.Course.id == move_in.course_id,
            models.Course.owner_id == current_user.id,
        ).first()
        if not course:
            raise HTTPException(status_code=404, detail="Course not found")

    note.course_id = move_in.course_id
    db.commit()
    return {"message": "Note moved successfully"}


@router.delete("/notes/{note_id}", status_code=204)
def delete_note(
    note_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(deps.get_current_user),
) -> None:
    note = db.query(models.Note).filter(models.Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    # Ownership check
    if note.course_id is not None:
        course = db.query(models.Course).filter(
            models.Course.id == note.course_id,
            models.Course.owner_id == current_user.id,
        ).first()
        if not course:
            raise HTTPException(status_code=403, detail="Not authorized")

    # Delete MinIO images first
    for img in note.images:
        if img.minio_key:
            storage.delete_file_from_minio(img.minio_key)

    db.delete(note)
    db.commit()
