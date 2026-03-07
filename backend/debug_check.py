import sys
import os
from sqlalchemy.orm import Session

sys.path.append(os.getcwd())
from app.db.session import SessionLocal
from app.models import User, Course

def check():
    db = SessionLocal()
    user = db.query(User).filter(User.username == "demo").first()
    if not user:
        print("Demo user not found!")
        return
    count = db.query(Course).filter(Course.owner_id == user.id).count()
    print(f"Demo user (ID: {user.id}) has {count} courses.")
    db.close()

if __name__ == "__main__":
    check()
