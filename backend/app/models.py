from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    access_code = Column(String(4), nullable=False)  # Profil için 4 haneli kod
    created_at = Column(DateTime, default=datetime.utcnow)
    
    courses = relationship("Course", back_populates="owner")
    notes = relationship("Note", back_populates="owner")

class Course(Base):
    __tablename__ = "courses"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(20), index=True)  # MAT101
    name = Column(String(255))
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship("User", back_populates="courses")
    notes = relationship("Note", back_populates="course")

class Note(Base):
    __tablename__ = "notes"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255))
    description = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    course_id = Column(Integer, ForeignKey("courses.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    owner = relationship("User", back_populates="notes")
    course = relationship("Course", back_populates="notes")
    images = relationship("NoteImage", back_populates="note", order_by="NoteImage.order")

class NoteImage(Base):
    __tablename__ = "note_images"
    
    id = Column(Integer, primary_key=True, index=True)
    note_id = Column(Integer, ForeignKey("notes.id"))
    object_key = Column(String(500), nullable=False)  # MinIO path
    order = Column(Integer, default=0)  # Sıralama
    created_at = Column(DateTime, default=datetime.utcnow)
    
    note = relationship("Note", back_populates="images")

# V1.5 TODO: Vote, Transaction, PAPS wallet
# V1.5 TODO: OCR (client-side Tesseract.js veya backend)
