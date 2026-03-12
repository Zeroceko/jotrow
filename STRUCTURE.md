# Proje Yapısı - V1

## Güncellenmiş Repo Ağacı

```
notlar-burada/
├── docker-compose.yml          # Postgres + Redis + MinIO + Backend + Frontend
├── .gitignore
├── README.md                   # Kurulum + demo akışı
├── API_ENDPOINTS.md            # API dokümantasyonu
├── SPRINT_PLAN.md              # 2 sprint task list
├── STRUCTURE.md                # Bu dosya
│
├── backend/
│   ├── Dockerfile              # Python 3.11 slim
│   ├── requirements.txt        # FastAPI, SQLAlchemy, Alembic, boto3 (OCR YOK)
│   ├── alembic.ini             # Alembic config
│   ├── .env.example            # Environment variables
│   │
│   ├── alembic/
│   │   ├── env.py              # Alembic environment
│   │   ├── script.py.mako      # Migration template
│   │   └── versions/
│   │       └── 001_initial.py  # İlk migration (User, Course, Note, NoteImage)
│   │
│   └── app/
│       ├── __init__.py
│       ├── main.py             # FastAPI app + CORS + router include
│       ├── models.py           # User, Course, Note, NoteImage (V1.5 TODO: Vote, PAPS)
│       ├── schemas.py          # Pydantic models
│       ├── config.py           # Settings (DATABASE_URL, MINIO, JWT)
│       ├── database.py         # SQLAlchemy engine + session
│       │
│       ├── api/
│       │   ├── __init__.py
│       │   ├── auth.py         # POST /register, /login (JWT)
│       │   ├── users.py        # GET /me, /{username}
│       │   ├── notes.py        # Course CRUD, Note CRUD, upload
│       │   └── sharing.py      # GET /u/{username}, POST /u/{username}/verify
│       │
│       └── services/
│           ├── __init__.py
│           └── storage.py      # MinIO upload_file, get_file_url (presigned)
│
└── frontend/
    ├── Dockerfile              # Node 20 alpine
    ├── package.json            # React, TypeScript, Vite, axios, zustand
    ├── tsconfig.json
    ├── tsconfig.node.json
    ├── vite.config.ts
    ├── index.html
    │
    └── src/
        ├── main.tsx            # React root
        ├── App.tsx             # React Router
        ├── index.css           # Global styles
        │
        └── pages/
            ├── Home.tsx        # Landing page
            ├── Login.tsx       # Login form
            ├── Register.tsx    # Register form
            ├── Upload.tsx      # Course seç + multi-file upload
            ├── Editor.tsx      # Not görüntüleme (foto galerisi)
            └── Profile.tsx     # Public profile (/u/{username})
```

## Dosya Açıklamaları

### Backend

#### `app/models.py`
- User: username, email, hashed_password, access_code (4 haneli)
- Course: code, name, user_id
- Note: title, description, user_id, course_id
- NoteImage: note_id, object_key (MinIO path), order

#### `app/api/auth.py`
- POST /register: User oluştur + 4 haneli kod üret
- POST /login: JWT token döndür

#### `app/api/notes.py`
- POST /courses: Ders oluştur
- GET /courses: Kullanıcının dersleri
- POST /notes: Not oluştur + çoklu foto yükle
- GET /notes/{id}: Not detayı
- GET /courses/{id}/notes: Ders notları

#### `app/api/sharing.py`
- POST /u/{username}/verify: Access code doğrula
- GET /u/{username}: Profil (dersler + notlar) - kod gerekli
- GET /u/{username}/share-info: Paylaşım bilgisi

#### `app/services/storage.py`
- upload_file(): MinIO'ya dosya yükle
- get_file_url(): Presigned URL üret (1 saat)

### Frontend

#### `pages/Upload.tsx`
- Course dropdown
- Multi-file upload (drag & drop)
- Progress bar

#### `pages/Profile.tsx`
- Access code input modal
- Dersler grid
- Notlar listesi

#### `pages/Editor.tsx`
- Foto galerisi (swiper/carousel)
- Zoom/pan

## Data Model (V1)

```sql
users
  id, username (unique), email (unique), hashed_password, access_code (4 digit), created_at

courses
  id, code, name, user_id (FK), created_at

notes
  id, title, description, user_id (FK), course_id (FK), created_at, updated_at

note_images
  id, note_id (FK), object_key (MinIO path), order, created_at
```

## Migration Planı

```bash
# İlk migration oluştur
alembic revision --autogenerate -m "Initial migration"

# Migration uygula
alembic upgrade head

# Rollback
alembic downgrade -1
```

## V1.5 TODO (Çıkarılanlar)

- OCR (Tesseract/EasyOCR) → Client-side Tesseract.js
- Vote (upvote/downvote)
- Transaction (PAPS)
- Reputation
- Marketplace
