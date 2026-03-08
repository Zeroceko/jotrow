from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text, Boolean
from sqlalchemy.orm import relationship
import datetime
from app.db.base_class import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String)
    share_code = Column(String(4))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Profile
    display_name = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    university = Column(String, nullable=True)
    department = Column(String, nullable=True)

    # Privacy
    note_default_visibility = Column(String, default="private")  # "private" | "public"
    show_on_explore = Column(Boolean, default=True)

    # Wallet
    paps_balance = Column(Integer, default=0)

    courses = relationship("Course", back_populates="owner")
    notes_root = relationship("Note", back_populates="owner", foreign_keys="Note.owner_id")
    transactions = relationship("Transaction", back_populates="user")

class Course(Base):
    __tablename__ = "courses"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    owner = relationship("User", back_populates="courses")
    notes = relationship("Note", back_populates="course")

class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text, nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    praise_count = Column(Integer, default=0)
    original_author = Column(String, nullable=True)
    visibility = Column(String, default="private")  # "private" | "public"
    paps_price = Column(Integer, default=0)
    requires_pin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    course = relationship("Course", back_populates="notes")
    images = relationship("NoteImage", back_populates="note")
    owner = relationship("User", back_populates="notes_root", foreign_keys=[owner_id])
    unlocked_by = relationship("UnlockedNote", back_populates="note")

class UnlockedNote(Base):
    __tablename__ = "unlocked_notes"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    note_id = Column(Integer, ForeignKey("notes.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", foreign_keys=[user_id])
    note = relationship("Note", back_populates="unlocked_by")

class NoteImage(Base):
    __tablename__ = "note_images"
    id = Column(Integer, primary_key=True, index=True)
    note_id = Column(Integer, ForeignKey("notes.id"))
    image_url = Column(String)
    minio_key = Column(String)

    note = relationship("Note", back_populates="images")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String, nullable=False)  # "topup" | "purchase" | "sale" | "fee" | "refund"
    amount = Column(Integer, nullable=False)  # PAPS; positive = credit, negative = debit
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="transactions")
