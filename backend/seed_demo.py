import sys
import os
from sqlalchemy.orm import Session
from datetime import datetime

# Add the current directory to sys.path to import app modules
sys.path.append(os.getcwd())

from app.db.session import SessionLocal
from app.models import User, Course, Note
from app.core.security import get_password_hash

def seed_demo_data():
    db: Session = SessionLocal()
    try:
        # 1. Create Demo User
        demo_user = db.query(User).filter(User.username == "demo").first()
        if not demo_user:
            print("Creating Demo User...")
            demo_user = User(
                username="demo",
                hashed_password=get_password_hash("demo1234"),
                share_code="1234",
                created_at=datetime.utcnow()
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
        else:
            print("Demo User already exists.")

        # 2. Sample Courses
        courses_data = [
            {
                "title": "CS101: Introduction to Computer Science",
                "description": "Fundamental concepts of algorithms, data structures, and the logic of computing.",
                "notes": [
                    {
                        "title": "Binary Search Explained",
                        "content": "### What is Binary Search?\nDivide and conquer. Why **O(log n)** matters for large datasets. \n\n```python\ndef binary_search(arr, x):\n    low = 0\n    high = len(arr) - 1\n    while low <= high:\n        mid = (high + low) // 2\n        if arr[mid] < x:\n            low = mid + 1\n        elif arr[mid] > x:\n            high = mid - 1\n        else:\n            return mid\n    return -1\n```\nRemember the mid-point calculation!"
                    },
                    {
                        "title": "Pointers vs. References",
                        "content": "Pointers store addresses; references are aliases. Visualizing the stack and heap allocation in C++...\n\n- **Pointer**: `int* p = &a;`\n- **Reference**: `int& r = a;`"
                    },
                    {
                        "title": "Big O Notation Cheat Sheet",
                        "content": "| Complexity | Name | Example |\n|---|\n| O(1) | Constant | Array access |\n| O(log n) | Logarithmic | Binary search |\n| O(n) | Linear | Loop over array |\n| O(n^2) | Quadratic | Nested loops |"
                    }
                ]
            },
            {
                "title": "Modern Web Development",
                "description": "Building responsive and dynamic web applications using React, Next.js, and Tailwind CSS.",
                "notes": [
                    {
                        "title": "React Hooks Overview",
                        "content": "The most important ones:\n- `useState`: Manage local state\n- `useEffect`: Handle side effects\n- `useContext`: Global state without prop drilling\n- `useMemo`: Performance optimization"
                    },
                    {
                        "title": "Tailwind CSS Layout Basics",
                        "content": "Flexbox vs Grid in Tailwind:\n- `flex flex-col items-center` -> Vertical centered stack\n- `grid grid-cols-1 md:grid-cols-3` -> Responsive columns"
                    }
                ]
            }
        ]

        # 3. Insert Courses and Notes
        for c_data in courses_data:
            existing_course = db.query(Course).filter(
                Course.title == c_data["title"], 
                Course.owner_id == demo_user.id
            ).first()
            
            if not existing_course:
                print(f"Adding Course: {c_data['title']}")
                course = Course(
                    title=c_data["title"],
                    description=c_data["description"],
                    owner_id=demo_user.id,
                    created_at=datetime.utcnow()
                )
                db.add(course)
                db.commit()
                db.refresh(course)
                
                for n_data in c_data["notes"]:
                    print(f"  Adding Note: {n_data['title']}")
                    note = Note(
                        title=n_data["title"],
                        content=n_data["content"],
                        course_id=course.id,
                        created_at=datetime.utcnow(),
                        praise_count=5 # Give some initial praise
                    )
                    db.add(note)
                db.commit()
            else:
                print(f"Course '{c_data['title']}' already exists for demo user.")

        print("\nSuccess! Demo data seeded successfully.")
        print(f"Demo Account: demo / demo1234")
        print(f"Share PIN: 1234")

    except Exception as e:
        print(f"Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
