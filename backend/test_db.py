import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.models import User

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()
users = db.query(User).order_by(User.id.desc()).limit(5).all()
for u in users:
    print(f"id={u.id}, username='{u.username}', email='{u.email}'")

u19 = db.query(User).filter(User.username == 'user_19').first()
print("Found user_19?" , u19 is not None)
