# JOTROW 📓

Web tabanlı ders notu paylaşım platformu. Kullanıcılar ders bazlı notlarını organize eder, görseller yükler ve 4 haneli paylaşım kodu ile notlarını başkalarıyla paylaşır.

---

## 🗂 Proje Yapısı

```
notlar-burada/
├── backend/              # FastAPI + SQLAlchemy + PostgreSQL
│   ├── app/
│   │   ├── api/          # Endpoint router'ları (auth, notes, sharing, settings, deps)
│   │   ├── core/         # Config + güvenlik (JWT, bcrypt)
│   │   ├── db/           # SQLAlchemy session + base
│   │   ├── models.py     # User, Course, Note, NoteImage, Transaction
│   │   └── services/     # MinIO dosya yükleme/silme servisi
│   ├── alembic/          # DB migration'ları
│   ├── alembic.ini
│   ├── requirements.txt
│   └── .env              # Lokal ortam değişkenleri
├── frontend/             # React + Vite + Tailwind CSS
│   └── src/
│       ├── pages/        # Login, Register, Dashboard, CourseDetail, Upload, Profile, Settings, Explore, NotFound
│       ├── components/   # Navbar, Onboarding, Card, Button, Input (ui/ altında)
│       ├── context/      # AuthContext (JWT), LanguageContext (i18n EN/TR)
│       └── services/     # API axios instance (baseURL: localhost:8000)
├── HANDOFF.md            # Geliştirici devir teslim belgesi (son oturumun özeti)
└── docker-compose.yml    # PostgreSQL + MinIO
```

---

## ✅ Çalışan Fonksiyonlar

### Backend (API)
| Endpoint | Method | Açıklama | Durum |
|----------|--------|----------|-------|
| `/auth/register` | POST | Kullanıcı kaydı + 4 haneli `share_code` üretimi | ✅ |
| `/auth/login` | POST | OAuth2 form-data ile JWT token alma | ✅ |
| `/api/courses` | GET/POST | Kullanıcının klasörlerini listele / oluştur | ✅ |
| `/api/courses/{id}` | GET/PUT/DELETE | Klasör detay / güncelle / sil | ✅ |
| `/api/courses/{id}/notes` | GET | Klasörün notlarını listele (presigned URL ile) | ✅ |
| `/api/notes` | GET | Kullanıcının inbox (klasörsüz) notları | ✅ |
| `/api/notes` | POST | Not oluştur + multipart dosya yükleme | ✅ |
| `/api/notes/{id}` | PUT | Not başlık/içerik güncelle | ✅ |
| `/api/notes/{id}` | DELETE | Notu + MinIO görsellerini sil | ✅ |
| `/api/notes/{id}/move` | PUT | Notu klasöre taşı veya inbox'a geri al | ✅ |
| `/u/{username}` | GET | Herkese açık profil kontrolü | ✅ |
| `/u/{username}/verify` | POST | 4 haneli kod doğrulama + misafir token | ✅ |
| `/api/settings/me` | GET | Kullanıcı ayarlarını getir | ✅ |
| `/api/settings/profile` | PUT | Profil bilgileri güncelle | ✅ |
| `/api/settings/profile/pin` | PUT | 4 haneli PIN kodunu değiştir | ✅ |
| `/api/settings/privacy` | PUT | Gizlilik ayarları | ✅ |
| `/api/settings/wallet` | GET | PAPS bakiyesi ve işlem geçmişi | ✅ |
| `/api/settings/earnings` | GET | Haftalık kazanç/harcama özeti | ✅ |
| `/api/explore` | GET | Keşfet sayfası kullanıcı listesi | ✅ |
| `/api/notes/{id}/unlock` | POST | PAPS veya PIN ile not kilidi açma | ✅ |

### Frontend
| Sayfa/Özellik | Durum |
|---------------|-------|
| Login / Register sayfaları | ✅ |
| Dashboard — klasör & inbox yönetimi | ✅ |
| **Drag & Drop** — Inbox notlarını klasörlere sürükle-bırak | ✅ |
| Kurs detay — not listesi & lightbox | ✅ |
| Not yükleme (Metin + Görsel + HEIC desteği) | ✅ |
| Profil sayfası `/u/:username` — PIN Korumalı | ✅ |
| **Tam i18n Desteği** — Tüm sayfalar TR/EN | ✅ |
| Settings — Profil, Gizlilik, Cüzdan, Kazanç, Hesap | ✅ |
| Explore — Kullanıcı keşfet & arama | ✅ |
| PAPS Sistemi — Bakiye & işlem geçmişi | ✅ |
| **PAPS Unlock** — Kilitli notları PAPS ile satın alma | ✅ |
| **Görsel Sıkıştırma** — Pillow ile %70+ depolama tasarrufu | ✅ |

---

## ⚠️ Bilinen Hatalar

| # | Öncelik | Sorun | Dosya |
|---|---------|-------|-------|
| 1 | 🔴 KRİTİK | Canlı ortamda "Failed to upload note" (Pillow/MinIO senkronizasyonu) | `storage.py` |
| 2 | 🔴 KRİTİK | DB'de `owner_id = NULL` olan eski notlar yeni kullanıcılara görünüyor | `backend/app/api/notes.py` + DB |
| 3 | 🔴 KRİTİK | Profil sayfası bazı durumlarda "System Error" veriyor | `pages/Profile.tsx`, `components/Navbar.tsx` |
| 4 | 🟡 ORTA | Dashboard "Move" butonu çevirilmedi (`dash.move` key eksik) | `pages/Dashboard.tsx:310` |
| 5 | 🟡 ORTA | `PUT /notes/{id}` endpoint'inde inbox notları için ownership kontrolü yok | `backend/app/api/notes.py:288` |

> Detaylı açıklamalar ve çözüm önerileri için → [HANDOFF.md](./HANDOFF.md)

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

> **Not:** Backend `backend/.env` dosyasını okur. Varsayılan değerler local docker-compose ile uyumludur. Production'da HTTPS güvenliği için `storage.py` otomatik `secure=True` ayarına geçer.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
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

## 🔧 Önemli Teknik Notlar

### i18n Çeviri Sistemi
Tüm UI metinleri `frontend/src/context/LanguageContext.tsx` dosyasından gelir. Key formatı `<sayfa>.<alan>` şeklinde:
```tsx
const { t } = useLanguage();
<p>{t('dash.inbox')}</p>
```
Yeni string eklemek için `LanguageContext.tsx`'te hem `en` hem `tr` bloğuna key eklenmeli.

Mevcut prefix'ler: `nav`, `home`, `dash`, `upload`, `exp`, `settings`, `prof`, `login`, `reg`, `cd`, `nf`

### Bcrypt
`passlib`'in Python 3.9'daki bcrypt backend'i sorunluydu. `app/core/security.py`'de doğrudan `bcrypt` kütüphanesi kullanılıyor. `passlib` bağımlılık listesinde hâlâ var; kaldırılabilir.

### Pydantic v2
`notes.py` tam uyumlu (`ConfigDict(from_attributes=True)`). `auth.py` ve `sharing.py`'de `class Config: orm_mode = True` uyarısı var ama işlevsel sorun yok.

### MinIO Bucket
İlk görsel yüklemede `ensure_bucket_exists()` otomatik bucket oluşturur. Manuel kurulum gerekmez.

### JWT Token Yapısı
- Normal kullanıcı: `sub = "<user_id>"`
- Misafir token: `sub = "guest:<user_id>"`
- `deps.py` her iki formatı `get_current_user` içinde handle eder.

---

## 🗄 Veritabanı Şeması

```
users          → id, username, email, hashed_password, share_code, display_name, bio, university, department, note_default_visibility, show_on_explore, paps_balance, created_at
courses        → id, title, description, owner_id (FK: users), created_at
notes          → id, title, content, course_id (FK: courses, nullable), owner_id (FK: users, nullable), praise_count, original_author, visibility, created_at
note_images    → id, note_id (FK: notes), image_url, minio_key
transactions   → id, user_id (FK: users), type, amount, description, created_at
```

> ⚠️ **Dikkat:** `notes.owner_id` alanı sonradan eklendi. Eski kayıtlarda `NULL` olabilir → Hata #1. DB temizliği:
> ```sql
> DELETE FROM notes WHERE owner_id IS NULL AND course_id IS NULL;
> ```

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
React 18, Vite, Tailwind CSS, Axios, React Router v6, Lucide React, date-fns, jwt-decode
