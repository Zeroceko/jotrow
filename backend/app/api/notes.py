from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import User, Note, Course, NoteImage
from app.schemas import NoteCreate, NoteResponse, NoteImageResponse, CourseCreate, CourseResponse
from app.api.auth import require_current_user
from app.services.storage import upload_file, get_file_url

router = APIRouter()

@router.post("/courses", response_model=CourseResponse)
def create_course(
    course: CourseCreate,
    current_user: User = Depends(require_current_user),
    db: Session = Depends(get_db)
):
    """Yeni ders oluştur"""
    existing = db.query(Course).filter(
        Course.code == course.code,
        Course.user_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Course already exists")
    
    db_course = Course(
        code=course.code,
        name=course.name,
        user_id=current_user.id
    )
    db.add(db_course)
    db.commit()
    db.refresh(db_course)
    
    return {
        "id": db_course.id,
        "code": db_course.code,
        "name": db_course.name,
        "created_at": db_course.created_at,
        "notes_count": 0
    }

@router.get("/courses", response_model=List[CourseResponse])
def get_my_courses(
    current_user: User = Depends(require_current_user),
    db: Session = Depends(get_db)
):
    """Kullanıcının derslerini listele"""
    courses = db.query(Course).filter(Course.user_id == current_user.id).all()
    
    result = []
    for course in courses:
        notes_count = db.query(Note).filter(Note.course_id == course.id).count()
        result.append({
            "id": course.id,
            "code": course.code,
            "name": course.name,
            "created_at": course.created_at,
            "notes_count": notes_count
        })
    
    return result

@router.post("/notes", response_model=NoteResponse)
async def create_note(
    note: NoteCreate,
    files: List[UploadFile] = File(...),
    current_user: User = Depends(require_current_user),
    db: Session = Depends(get_db)
):
    """Not oluştur ve fotoğrafları yükle"""
    course = db.query(Course).filter(
        Course.id == note.course_id,
        Course.user_id == current_user.id
    ).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Not oluştur
    db_note = Note(
        title=note.title,
        description=note.description,
        user_id=current_user.id,
        course_id=course.id
    )
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    
    # Fotoğrafları yükle
    for idx, file in enumerate(files):
        object_key = await upload_file(file, current_user.id)
        
        note_image = NoteImage(
            note_id=db_note.id,
            object_key=object_key,
            order=idx
        )
        db.add(note_image)
    
    db.commit()
    db.refresh(db_note)
    
    # Response için presigned URL'ler ekle
    images = []
    for img in db_note.images:
        images.append({
            "id": img.id,
            "object_key": img.object_key,
            "order": img.order,
            "url": get_file_url(img.object_key)
        })
    
    return {
        "id": db_note.id,
        "title": db_note.title,
        "description": db_note.description,
        "course_id": db_note.course_id,
        "created_at": db_note.created_at,
        "images": images
    }

@router.get("/notes/{note_id}", response_model=NoteResponse)
def get_note(
    note_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user)
):
    """Not detayı"""
    note = db.query(Note).filter(Note.id == note_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # Erişim kontrolü (V1: sadece owner)
    if note.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    images = []
    for img in note.images:
        images.append({
            "id": img.id,
            "object_key": img.object_key,
            "order": img.order,
            "url": get_file_url(img.object_key)
        })
    
    return {
        "id": note.id,
        "title": note.title,
        "description": note.description,
        "course_id": note.course_id,
        "created_at": note.created_at,
        "images": images
    }

@router.get("/courses/{course_id}/notes", response_model=List[NoteResponse])
def get_course_notes(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_current_user)
):
    """Ders notlarını listele"""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    # Erişim kontrolü
    if course.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    notes = db.query(Note).filter(Note.course_id == course_id).all()
    
    result = []
    for note in notes:
        images = []
        for img in note.images:
            images.append({
                "id": img.id,
                "object_key": img.object_key,
                "order": img.order,
                "url": get_file_url(img.object_key)
            })
        
        result.append({
            "id": note.id,
            "title": note.title,
            "description": note.description,
            "course_id": note.course_id,
            "created_at": note.created_at,
            "images": images
        })
    
    return result
