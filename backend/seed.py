"""
JOTROW Seed Script
Deletes ALL existing data and creates 5 fresh test accounts with content.
Run: python seed.py (from the backend directory)
"""
import os
import sys

# Make sure we can import the app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.core.security import get_password_hash
from app import models

PASSWORD = "test1234"

USERS = [
    {"username": "ahmet", "email": "ahmet@jotrow.com", "display_name": "Ahmet Yılmaz", "bio": "Bilgisayar Mühendisliği 3. sınıf", "university": "İTÜ", "department": "Bilgisayar Müh."},
    {"username": "zeynep", "email": "zeynep@jotrow.com", "display_name": "Zeynep Kaya", "bio": "Tıp fakültesi öğrencisi, anatomi notları paylaşıyorum", "university": "Hacettepe", "department": "Tıp"},
    {"username": "can", "email": "can@jotrow.com", "display_name": "Can Demir", "bio": "Hukuk 2. sınıf", "university": "Ankara Üni.", "department": "Hukuk"},
    {"username": "elif", "email": "elif@jotrow.com", "display_name": "Elif Arslan", "bio": "Almanca öğreniyorum 🇩🇪", "university": "ODTÜ", "department": "Yabancı Diller"},
    {"username": "mert", "email": "mert@jotrow.com", "display_name": "Mert Özkan", "bio": "Makine mühendisliği, termodinamik uzmanı", "university": "Boğaziçi", "department": "Makine Müh."},
]

# Users with courses (folders)
USERS_WITH_COURSES = {
    "ahmet": [
        {
            "title": "Veri Yapıları",
            "description": "CS201 ders notları",
            "notes": [
                {"title": "Linked List Notları", "content": "Tek yönlü ve çift yönlü bağlı listeler hakkında detaylı açıklamalar.", "paps_price": 5},
                {"title": "Binary Tree Özeti", "content": "İkili ağaç yapısı, traversal yöntemleri ve karmaşıklık analizi.", "paps_price": 0},
            ]
        },
        {
            "title": "Algoritma Analizi",
            "description": "CS301 algoritma dersi",
            "notes": [
                {"title": "Sorting Algorithms", "content": "Quick sort, merge sort, heap sort karşılaştırması.", "paps_price": 10, "requires_pin": True},
            ]
        }
    ],
    "zeynep": [
        {
            "title": "Anatomi 101",
            "description": "Temel anatomi dersi notları",
            "notes": [
                {"title": "Kemik Sistemi", "content": "İnsan iskelet sistemi, 206 kemik ve bağlantıları.", "paps_price": 8},
                {"title": "Kas Sistemi", "content": "Çizgili kas, düz kas ve kalp kası arasındaki farklar.", "paps_price": 0},
                {"title": "Sinir Sistemi", "content": "Merkezi ve periferik sinir sistemi yapısı.", "paps_price": 15, "requires_pin": True},
            ]
        }
    ]
}

# Users without courses (notes at library root)
USERS_WITHOUT_COURSES = {
    "can": [
        {"title": "Anayasa Hukuku Özeti", "content": "Temel haklar ve özgürlükler, devletin yapısı hakkında özet.", "paps_price": 5},
        {"title": "Ceza Hukuku Genel", "content": "Suçun unsurları, ceza türleri ve zamanaşımı kuralları.", "paps_price": 0},
    ],
    "elif": [
        {"title": "Konjuktionen (Bağlaçlar)", "content": "Als, wenn, während, bis, seit, bevor, nachdem, sobald bağlaçlarının kullanımı ve örnekleri.", "paps_price": 3},
        {"title": "Almanca B1 Kelime Listesi", "content": "B1 sınavı için en önemli 200 kelime ve örnek cümleler.", "paps_price": 0},
    ],
    "mert": [
        {"title": "Termodinamik 1. Yasa", "content": "Enerji korunumu, iç enerji, iş ve ısı kavramları.", "paps_price": 10},
    ]
}


def seed():
    db = SessionLocal()
    try:
        print("🗑️  Deleting all existing data...")
        db.query(models.UnlockedNote).delete()
        db.query(models.Transaction).delete()
        db.query(models.NoteImage).delete()
        db.query(models.Note).delete()
        db.query(models.Course).delete()
        db.query(models.User).delete()
        db.commit()
        print("   ✅ All data deleted.")

        hashed_pw = get_password_hash(PASSWORD)
        user_map = {}

        for u in USERS:
            user = models.User(
                username=u["username"],
                email=u["email"],
                hashed_password=hashed_pw,
                display_name=u["display_name"],
                bio=u["bio"],
                university=u["university"],
                department=u["department"],
                paps_balance=100,
                share_code="1234",
                show_on_explore=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            user_map[u["username"]] = user

            # Registration bonus transaction
            db.add(models.Transaction(user_id=user.id, type="topup", amount=100, description="Kayıt hediyesi"))
            db.commit()
            print(f"   👤 Created user: {u['username']} (id={user.id})")

        # Create courses and notes for users with folders
        for username, courses in USERS_WITH_COURSES.items():
            user = user_map[username]
            for c in courses:
                course = models.Course(title=c["title"], description=c["description"], owner_id=user.id)
                db.add(course)
                db.commit()
                db.refresh(course)
                print(f"   📁 Created course: {c['title']} for @{username}")

                for n in c["notes"]:
                    note = models.Note(
                        title=n["title"],
                        content=n["content"],
                        course_id=course.id,
                        owner_id=user.id,
                        paps_price=n.get("paps_price", 0),
                        requires_pin=n.get("requires_pin", False),
                        visibility="public",
                    )
                    db.add(note)
                    db.commit()
                    print(f"      📝 Note: {n['title']} (PAPS: {n.get('paps_price', 0)})")

        # Create notes without courses (library root)
        for username, notes in USERS_WITHOUT_COURSES.items():
            user = user_map[username]
            for n in notes:
                note = models.Note(
                    title=n["title"],
                    content=n["content"],
                    course_id=None,
                    owner_id=user.id,
                    paps_price=n.get("paps_price", 0),
                    requires_pin=n.get("requires_pin", False),
                    visibility="public",
                )
                db.add(note)
                db.commit()
                print(f"   📝 Root note: {n['title']} for @{username}")

        print(f"\n🎉 Seed complete! Created {len(USERS)} users.")
        print(f"   All passwords: {PASSWORD}")
        print(f"   All share codes: 1234")
    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
