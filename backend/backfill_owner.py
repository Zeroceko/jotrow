import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models import Note, Course

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

notes = db.query(Note).all()
for n in notes:
    if n.course_id:
        course = db.query(Course).filter(Course.id == n.course_id).first()
        if course:
            n.owner_id = course.owner_id
    else:
        # Just assign to the first user or leave null
        pass
db.commit()
print("Backfilled owner_id")
