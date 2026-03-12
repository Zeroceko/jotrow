# Notlar Burada - V1

Üniversite öğrencileri için fotoğraf bazlı ders notu paylaşım platformu.

## V1 Özellikler

- 📸 Çoklu fotoğraf yükleme
- 📚 Ders bazlı organizasyon
- 🔗 Profil bazlı paylaşım (username)
- 🔒 4 haneli kod ile erişim kontrolü
- 💾 MinIO (S3) storage
- 🔐 JWT authentication

## Tech Stack

- Backend: Python 3.11 + FastAPI
- Frontend: React 18 + TypeScript + Vite
- Database: PostgreSQL 15
- Cache: Redis 7
- Storage: MinIO (S3-compatible)
- Container: Docker + Docker Compose

## Kurulum

### Gereksinimler
- Docker
- Docker Compose

### Çalıştırma

```bash
# Projeyi klonla
git clone <repo-url>
cd notlar-burada

# Docker ile başlat
docker-compose up --build

# Uygulamalar:
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
# MinIO Console: http://localhost:9001
```

### İlk Kurulum

```bash
# Backend container'a gir
docker-compose exec backend bash

# Database migration
alembic upgrade head

# MinIO bucket oluştur (ilk çalıştırmada)
# MinIO Console'dan (localhost:9001) giriş yap:
# Username: minioadmin
# Password: minioadmin
# Bucket oluştur: notlar-burada
```

## Demo Akışı

### 1. Kayıt Ol
```bash
POST http://localhost:8000/api/auth/register
{
  "username": "zeynep",
  "email": "zeynep@example.com",
  "password": "password123"
}

# Response: access_code: "4821" (profil kodu)
```

### 2. Giriş Yap
```bash
POST http://localhost:8000/api/auth/login
Form: username=zeynep&password=password123

# Response: access_token (JWT)
```

### 3. Ders Oluştur
```bash
POST http://localhost:8000/api/notes/courses
Authorization: Bearer <token>
{
  "code": "MAT101",
  "name": "Matematik 1"
}
```

### 4. Not Yükle
```bash
POST http://localhost:8000/api/notes/notes
Authorization: Bearer <token>
Multipart Form:
- note: {"title": "Ders 1", "course_id": 1}
- files: [foto1.jpg, foto2.jpg]
```

### 5. Profil Paylaş
```
Link: http://localhost:3000/u/zeynep
Kod: 4821

Arkadaşlarına gönder:
"MAT101 notlarımı Notlar Burada'ya yükledim!
Profil: localhost:3000/u/zeynep
Kod: 4821"
```

### 6. Profil Görüntüle (Public)
```bash
GET http://localhost:8000/api/u/zeynep?access_code=4821

# Response: Dersler ve notlar listesi
```

## Geliştirme

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# .env dosyası oluştur
cp .env.example .env

# Migration
alembic upgrade head

# Çalıştır
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Proje Yapısı

```
notlar-burada/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── alembic.ini
│   ├── .env.example
│   └── app/
│       ├── main.py              # FastAPI app
│       ├── models.py            # SQLAlchemy models
│       ├── schemas.py           # Pydantic schemas
│       ├── config.py            # Settings
│       ├── database.py          # DB connection
│       ├── api/
│       │   ├── auth.py          # Register, login
│       │   ├── users.py         # User endpoints
│       │   ├── notes.py         # Course, Note CRUD
│       │   └── sharing.py       # Public profile
│       └── services/
│           └── storage.py       # MinIO upload/download
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       └── pages/
│           ├── Home.tsx
│           ├── Login.tsx
│           ├── Register.tsx
│           ├── Upload.tsx
│           ├── Editor.tsx
│           └── Profile.tsx
├── API_ENDPOINTS.md
├── SPRINT_PLAN.md
└── README.md
```

## V1.5 Roadmap

- OCR entegrasyonu (Tesseract.js client-side)
- PAPS ekonomisi (platform kredisi)
- Vote sistemi (upvote/downvote)
- Reputation
- Marketplace (not satın alma)

## Lisans

MIT
