# Notlar Burada 📓

Web tabanlı ders notu paylaşım platformu. Kullanıcılar ders bazlı notlarını organize eder, görseller yükler ve 4 haneli paylaşım kodu ile notlarını başkalarıyla paylaşır.

---

## 🗂 Proje Yapısı

```
notlar-burada/
├── backend/              # FastAPI + SQLAlchemy + PostgreSQL
│   ├── app/
│   │   ├── api/          # Endpoint router'ları (auth, notes, sharing, deps)
│   │   ├── core/         # Config + güvenlik (JWT, bcrypt)
│   │   ├── db/           # SQLAlchemy session + base
│   │   ├── models.py     # User, Course, Note, NoteImage
│   │   └── services/     # MinIO dosya yükleme/silme servisi
│   ├── alembic/          # DB migration'ları
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env              # Lokal ortam değişkenleri
├── frontend/             # React + Vite + Tailwind CSS
│   └── src/
│       ├── pages/        # Login, Register, Dashboard, CourseDetail, Upload, Profile
│       ├── components/   # Navbar, Card, Button, Input (ui/ altında)
│       ├── context/      # AuthContext (JWT token yönetimi)
│       └── services/     # API axios instance (baseURL: localhost:8000)
└── docker-compose.yml    # PostgreSQL + MinIO
```

---

## ✅ Çalışan Fonksiyonlar

### Backend (API)
| Endpoint | Method | Açıklama | Durum |
|----------|--------|----------|-------|
| `/auth/register` | POST | Kullanıcı kaydı + 4 haneli `share_code` üretimi | ✅ |
| `/auth/login` | POST | OAuth2 form-data ile JWT token alma | ✅ |
| `/api/courses` | GET | Kullanıcının kurslarını listele | ✅ |
| `/api/courses` | POST | Yeni kurs oluştur | ✅ |
| `/api/courses/{id}` | GET | Tekil kurs detayı | ✅ |
| `/api/courses/{id}` | PUT | Kurs başlık/açıklamasını güncelle | ✅ |
| `/api/courses/{id}` | DELETE | Kursu + içindeki notlar + MinIO görsellerini sil | ✅ |
| `/api/courses/{id}/notes` | GET | Kursun notlarını listele (presigned URL ile) | ✅ |
| `/api/notes` | POST | Not oluştur + multipart dosya yükleme | ✅ |
| `/api/notes/{id}` | DELETE | Notu + MinIO görsellerini sil | ✅ |
| `/u/{username}` | GET | Herkese açık profil kontrolü | ✅ |
| `/u/{username}/verify` | POST | 4 haneli kod doğrulama + misafir token | ✅ |

### Frontend
| Sayfa/Özellik | Durum |
|---------------|-------|
| Login / Register sayfaları | ✅ |
| Dashboard — kurs listesi | ✅ |
| Dashboard — kurs oluşturma | ✅ |
| Dashboard — kurs inline düzenleme (kalem ikonu) | ✅ |
| Dashboard — kurs silme (çift tıklama onayı) | ✅ |
| Kurs detay — not listesi + görsel thumbnail | ✅ |
| Kurs detay — not silme (çift tıklama onayı) | ✅ |
| Kurs detay — görsel lightbox (ok tuşu + ESC desteği) | ✅ |
| Not yükleme (metin + görsel, sürükle-bırak) | ✅ |
| Profil paylaşım sayfası `/u/:username` — kilidi açma | ✅ |
| Profil — kurs kartına tıklanınca notlar açılıyor (collapse panel) | ✅ |
| Profil — misafir token ile not görüntüleme | ✅ |
| Profil — not görsellerinde lightbox | ✅ |

---

## 🚀 Geliştirici Başlangıç Kılavuzu

### Gereksinimler
- Docker & Docker Compose
- Python 3.9+
- Node.js 18+

### 1. Altyapıyı Başlat (PostgreSQL + MinIO)

```bash
docker-compose up -d db minio
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate            # Windows: venv\Scripts\activate
pip install -r requirements.txt

# DB migration çalıştır (ilk kurulumda veya model değişikliğinde)
alembic upgrade head

# Sunucuyu başlat
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

> **Not:** Backend `backend/.env` dosyasını okur. Varsayılan değerler local docker-compose ile uyumludur.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

### 4. Tüm Servisleri Docker ile Başlat

```bash
docker-compose up --build
```

### Varsayılan Servis Adresleri

| Servis | URL |
|--------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| MinIO Console | http://localhost:9001 |

**MinIO yönetim paneli:** kullanıcı: `minioadmin` / şifre: `minioadmin`

---

## 📌 Nerede Kaldık — Yapılacaklar

### ✅ Bu Sprint'te Tamamlananlar
- [x] Kullanıcı auth (register, login, JWT)
- [x] Kurs CRUD (oluştur, listele, düzenle, sil)
- [x] Not oluşturma + görsel yükleme (MinIO)
- [x] HEIC/HEIF formatındaki fotoğraflar için backend JPEG dönüştürmesi
- [x] Not düzenleme (`PUT /api/notes/{id}` + inline frontend UI)
- [x] Not silme (MinIO görsellerini de temizler)
- [x] Kurs silme (içindeki notlar ve MinIO görsellerini de temizler)
- [x] Paylaşım kodu backend'i (`share_code` üretimi)
- [x] Misafir token ile kurs/not görüntüleme (Profile sayfası)
- [x] Profil sayfasında kurs kartı → collapse panel → notlar
- [x] Profil `/u/:username` kilidi için backend/frontend Vite routing fix'leri yapıldı
- [x] Görsel lightbox (CourseDetail ve Profile sayfalarında)
- [x] Alembic migration'ları tamamlandı + Docker alt yapısı ayakta
- [x] Pydantic v2 uyumu (`from_attributes`, `ConfigDict`) — Tüm `api` router'larında.
- [x] Frontend vite API proxy (baseURL: `/`)
- [x] Sayfalama (Backend `GET /courses` ve `GET /notes` için `limit`/`offset`)
- [x] Kurs kartlarında "Not Sayısı" badge'i (`note_count` özelliği)
- [x] Keşfet Sayfası (Kullanıcı arama, en çok kursu olanlar listesi)
- [x] Notlara "Övgü (Praise)" özelliği (Animasyonlu UI ve Backend)
- [x] Başkasının notunu kendi kursuna kopyalama ("Save Note")
- [x] Backend çalışır durumda + E2E testleri başarılı.

### 🔲 Sonraki Developer İçin Yapılacaklar

#### Orta Öncelik
- [ ] **Share code yenileme:** Kullanıcı kendi `share_code`'unu yenileyebilmeli. `POST /auth/reset-share-code` endpoint'i + UI gerekli.
- [ ] **Frontend Pagination UI:** Backend limit/offset eklendi ancak Frontend hala 100 kaydı birden çekiyor ("Load More" butonu eklenebilir).

#### Düşük Öncelik / Production'a Geçiş
- [ ] **Üretim ortamı:** `SECRET_KEY` ve MinIO credential'ları `.env`'den production secret'larına taşınmalı.
- [ ] **CORS kısıtlama:** `app/main.py`'de `allow_origins=["*"]` production'da spesifik domainlerle kısıtlanmalı.
- [ ] **Görsel optimizasyon:** Upload sırasında client-side resize (ör. 1920px max) eklenebilir. Büyük görseller MinIO'da yer ve presigned URL süresi sorununa neden olabilir.
- [ ] **Presigned URL süresi:** Şu an 60 dakika. Paylaşılan notlar için bu kısa gelebilir; `sharing.py`'de misafir token süresiyle uyumlu hale getirilmeli.

---

## 🔧 Önemli Teknik Notlar

### Bcrypt
`passlib`'in Python 3.9'daki bcrypt backend'i sorunluydu. `app/core/security.py`'de doğrudan `bcrypt` kütüphanesi kullanılıyor:
```python
import bcrypt
hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())
```
`passlib` bağımlılık listesinde hâlâ var; kaldırılabilir.

### Pydantic v2
`notes.py` tam uyumlu (`ConfigDict(from_attributes=True)`). `auth.py` ve `sharing.py`'de `class Config: orm_mode = True` uyarısı var ama işlevsel sorun yok.

### MinIO Bucket
İlk görsel yüklemede `ensure_bucket_exists()` otomatik bucket oluşturur. Manuel kurulum gerekmez.

### JWT Token Yapısı
- Normal kullanıcı: `sub = "<user_id>"`
- Misafir token: `sub = "guest:<user_id>"`
- `deps.py` her iki formatı `get_current_user` içinde handle eder.

### Frontend Port
Geliştirme sırasında Vite bazen port 3000'e düşer (5173 meşgulse). `npm run dev -- --port 5173` ile sabit tutulabilir.

---

## 📦 Bağımlılıklar

### Backend (`requirements.txt`)
```
fastapi, uvicorn, sqlalchemy, psycopg2-binary, alembic,
pydantic-settings, python-jose[cryptography], bcrypt,
passlib[bcrypt], python-multipart, minio
```
> `passlib` kaldırılabilir; `bcrypt` doğrudan kullanılıyor.

### Frontend (`package.json`)
React 18, Vite, Tailwind CSS, Axios, React Router v6, Lucide React, date-fns

---

## 🗄 Veritabanı Şeması

```
users          → id, username, hashed_password, share_code, created_at
courses        → id, title, description, owner_id (FK: users), created_at
notes          → id, title, content, course_id (FK: courses), created_at
note_images    → id, note_id (FK: notes), image_url, minio_key
```

> **Cascade silme:** SQLAlchemy model'de `cascade="all, delete-orphan"` tanımlıysa DB level cascade çalışır. Değilse backend kod içinde manuel silme yapıyor (`notes.py`). Modeli kontrol et.
