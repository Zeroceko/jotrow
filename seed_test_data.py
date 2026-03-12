import os
import sys
import random
import datetime

# Add the backend directory to sys.path so we can import app modules directly
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "backend")
sys.path.append(backend_dir)

from app.db.session import SessionLocal, engine
from app import models
from app.core.security import get_password_hash
from sqlalchemy.orm import Session

# --- MOCK DATA ---
FIRST_NAMES = ["Ahmet", "Mehmet", "Ayşe", "Fatma", "Ali", "Veli", "Zeynep", "Elif", "Mustafa", "Deniz", "Burak", "Cem", "Derya", "Emre", "Gizem", "Hakan", "İrem", "Kaan", "Leyla", "Murat"]
LAST_NAMES = ["Yılmaz", "Kaya", "Demir", "Çelik", "Şahin", "Yıldız", "Öztürk", "Aydın", "Özdemir", "Arslan", "Doğan", "Kılıç", "Aslan", "Çetin", "Kara", "Koç", "Kurt", "Özkan", "Şimşek", "Polat"]

UNIVERSITIES = [
    "Boğaziçi Üniversitesi",
    "Orta Doğu Teknik Üniversitesi (ODTÜ)",
    "İstanbul Teknik Üniversitesi (İTÜ)",
    "Bilkent Üniversitesi",
    "Koç Üniversitesi",
    "Sabancı Üniversitesi",
    "Hacettepe Üniversitesi",
    "Yıldız Teknik Üniversitesi",
    "Galatasaray Üniversitesi",
    "Marmara Üniversitesi"
]

DEPARTMENTS = [
    "Bilgisayar Mühendisliği",
    "Yazılım Mühendisliği",
    "Elektrik Elektronik Mühendisliği",
    "Endüstri Mühendisliği",
    "Makine Mühendisliği",
    "İşletme",
    "Ekonomi",
    "Tıp",
    "Hukuk",
    "Mimarlık"
]

COURSE_TITLES = {
    "Bilgisayar Mühendisliği": ["Data Structures", "Algorithms", "Operating Systems", "Databases", "Computer Networks"],
    "Yazılım Mühendisliği": ["Software Architecture", "Agile Methodologies", "Web Development", "Mobile Programming", "Testing"],
    "Elektrik Elektronik Mühendisliği": ["Circuit Theory", "Electromagnetics", "Signals and Systems", "Microprocessors", "Control Systems"],
    "Endüstri Mühendisliği": ["Operations Research", "Production Planning", "Ergonomics", "Quality Management", "Supply Chain"],
    "İşletme": ["Marketing", "Accounting", "Finance", "Human Resources", "Strategic Management"]
}

DEFAULT_COURSES = ["Matematik 101", "Fizik 101", "Girişimcilik", "Tarih", "Yabancı Dil"]

def generate_bio(uni: str, dept: str) -> str:
    templates = [
        f"{uni} {dept} öğrencisi. Notlarımı paylaşıyorum.",
        f"Geleceğin mezunu. {dept} @ {uni}.",
        f"Kodluyoruz, çalışıyoruz. {uni} {dept}",
        f"Notların hepsi A+ garantili :)",
        f"Hayat kısa, finaller uzun. {uni}",
    ]
    return random.choice(templates)

def generate_note_content(title: str) -> str:
    return f"""Bu not {title} dersi için hazırlanmıştır. 
    
Aşağıda derste işlenen önemli kavramlar yer almaktadır:
- Temel tanımlar
- Örnek poblemler ve çözümleri
- Final sınavında çıkabilecek soru tipleri

Notların devamını okumak için incelemeye devam edin."""

def clear_database(db: Session):
    print("Clearing database...")
    # Delete in reverse dependency order
    try:
        db.query(models.NoteImage).delete()
        db.query(models.UnlockedNote).delete()
        db.query(models.Transaction).delete()
        db.query(models.Note).delete()
        db.query(models.Course).delete()
        db.query(models.User).delete()
        db.commit()
        print("Database cleared successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error clearing database: {e}")
        sys.exit(1)

def seed_database(db: Session):
    print("Seeding demo accounts...")
    users = []
    
    # Common password for all demo accounts
    hashed_pwd = get_password_hash("password")

    # 1. Generate 20 Users
    for i in range(20):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        username = f"{first.lower()}{last.lower()}{random.randint(10, 99)}"
        email = f"{username}@test.com"
        uni = random.choice(UNIVERSITIES)
        dept = random.choice(DEPARTMENTS)
        
        user = models.User(
            email=email,
            username=username,
            hashed_password=hashed_pwd,
            display_name=f"{first} {last}",
            bio=generate_bio(uni, dept),
            university=uni,
            department=dept,
            share_code=str(random.randint(1000, 9999)),
            paps_balance=random.choice([0, 100, 500, 1000]),
            is_profile_public=True
        )
        db.add(user)
        users.append(user)
    
    db.commit()
    for user in users:
        db.refresh(user)

    print(f"Created {len(users)} users. Generating courses and notes...")

    notes_created = 0
    courses_created = 0

    # 2. Generate Courses and Notes for each user
    for user in users:
        # Give transaction history for users with balance
        if user.paps_balance > 0:
            tx = models.Transaction(
                user_id=user.id,
                type="topup",
                amount=user.paps_balance,
                description="Initial Demo Balance"
            )
            db.add(tx)

        # 1-3 Courses per user
        num_courses = random.randint(1, 3)
        user_course_titles = COURSE_TITLES.get(str(user.department), DEFAULT_COURSES)
        
        for _ in range(num_courses):
            c_title = random.choice(user_course_titles)
            course = models.Course(
                title=c_title,
                description=f"{c_title} ders notları ve kaynakları.",
                owner_id=user.id
            )
            db.add(course)
            db.commit()
            db.refresh(course)
            courses_created += 1

            # 2-5 Notes per course
            for _ in range(random.randint(2, 5)):
                is_premium = random.random() > 0.7  # 30% chance to be premium/locked
                paps_price = random.choice([50, 100, 250]) if is_premium else 0
                
                note_title = f"{course.title} - Hafta {random.randint(1,14)}"
                note = models.Note(
                    title=note_title,
                    content=generate_note_content(note_title),
                    course_id=course.id,
                    owner_id=user.id,
                    praise_count=random.randint(0, 50),
                    paps_price=paps_price,
                    requires_pin=is_premium
                )
                db.add(note)
                notes_created += 1
        
        # 0-2 Uncategorized / Inbox Notes
        for _ in range(random.randint(0, 2)):
            note_title = f"Karalama - {random.randint(100, 999)}"
            note = models.Note(
                title=note_title,
                content=f"Daha klasöre alınmamış notlar: {note_title}",
                course_id=None,
                owner_id=user.id,
                praise_count=random.randint(0, 10)
            )
            db.add(note)
            notes_created += 1

    db.commit()
    
    print("\n--- SEEDING COMPLETE ---")
    print(f"Users: {len(users)}")
    print(f"Courses: {courses_created}")
    print(f"Notes: {notes_created}")
    print("\nDemo Login Details (any user):")
    print("Email: [username]@test.com (e.g. ahmetkaya45@test.com)")
    print("Password: password")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        clear_database(db)
        seed_database(db)
    finally:
        db.close()
