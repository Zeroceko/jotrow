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
| `/api/settings/me` | GET | Kullanıcı ayarlarını (profil, cüzdan, gizlilik) getir | ✅ |
| `/api/settings/profile` | PUT | İsim, biyografi, üniversite, bölüm güncelle | ✅ |
| `/api/settings/profile/pin` | PUT | 4 haneli PIN kodunu (share_code) değiştir | ✅ |
| `/api/settings/privacy` | PUT | Varsayılan gizlilik ve keşfet ayarlarını güncelle | ✅ |
| `/api/settings/wallet` | GET | PAPS bakiyesi ve işlem geçmişini listele | ✅ |
| `/api/settings/earnings` | GET | Haftalık kazanç/harcama özeti | ✅ |
| `i18n / Context` | Frontend | TR/EN dil desteği ve global metin çevirisi | ✅ |
### Frontend
| Sayfa/Özellik | Durum |
|---------------|-------|
| Login / Register sayfaları | ✅ |
| Dashboard — kurs listesi & yönetimi | ✅ |
| Kurs detay — not listesi & lightbox | ✅ |
| Not yükleme (Metin + Görsel + HEIC desteği) | ✅ |
| Profil sayfası `/u/:username` — Global Erişim | ✅ |
| **Dil Seçeneği (EN/TR)** — Tek tıkla tüm site çevirisi | ✅ |
| **Profil & Ayarlar Navigasyon** — Direkt profil linki & profil içi ayarlar | ✅ |
| PAPS Sistemi — Bakiye takibi ve işlem geçmişi | ✅ |
| Özel PIN Belirleme — Şifreli not erişim kodu | ✅ |

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
- [x] **Dil Desteği (i18n):** Global `LanguageContext` ile Türkçe ve İngilizce desteği (Navbar'dan toggle edilebilir).
- [x] **Profil & Header Revizyonu:** Header'daki karışık ayarlar ikonu yerine "Profile" linki; Ayarlar sayfasına ise Profil'in içinden geçiş sağlandı.
- [x] **Production Image Upload Fix:** Render'da Supabase S3 bağlantısındaki HTTPS/Secure flag hatası giderildi (Artık resim yükleme prod'da çalışıyor).
- [x] **JWT Decode (Frontend):** Giriş yapan kullanıcının bilgilerini token'dan okumak için `jwt-decode` entegrasyonu yapıldı.
- [x] Kullanıcı auth (register, login, JWT)
- [x] Kurs CRUD ve Not oluşturma + görsel yükleme (MinIO)
- [x] PAPS Sistemi ve Özel PIN belirleme
- [x] Notlara "Övgü (Praise)" özelliği ve "Save Note" (Başkalarından kaydetme)

### 🔲 Sonraki Developer İçin Yapılacaklar

#### Yüksek Öncelik (Bugs & Polish)
- [ ] **i18n Eksik Çeviriler:** Home (Ana Sayfa) ve Dashboard sayfalarındaki statik metinler henüz `LanguageContext`'e bağlanmadı.
- [ ] **Navbar Layout Shift:** Dil değişiminde (EN/TR) metin genişliği değiştiği için butonlar yanlara "zıplıyor". Bunun yerine sabit genişlikli bir **Dropdown** menü eklenmeli.

#### Orta Öncelik
- [ ] **Avatar Yükleme:** Kullanıcı profil fotoğrafı yükleyebilmeli (Backend kütüphaneleri hazır).
- [ ] **Arama & Filtreleme:** Keşfet sayfasındaki kullanıcı arama özelliğine not içeriği araması eklenebilir.

#### Düşük Öncelik / Production'a Geçiş
- [ ] **PAPS Payout:** Kullanıcının kazandığı PAPS birimlerini gerçek paraya dönüştürme mantığı.
- [ ] **Görsel optimizasyon:** Upload sırasında client-side resize (ör. 1920px max) eklenebilir.
- [ ] **Presigned URL süresi:** Şu an 60 dakika. Paylaşılan notlar için `sharing.py`'de bu süre dinamikleştirilebilir.

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
users          → id, username, email, hashed_password, share_code, display_name, bio, university, department, note_default_visibility, show_on_explore, paps_balance, created_at
courses        → id, title, description, owner_id (FK: users), created_at
notes          → id, title, content, course_id (FK: courses), praise_count, original_author, visibility, created_at
note_images    → id, note_id (FK: notes), image_url, minio_key
transactions   → id, user_id (FK: users), type, amount, description, created_at
```

> **Cascade silme:** SQLAlchemy model'de `cascade="all, delete-orphan"` tanımlıysa DB level cascade çalışır. Değilse backend kod içinde manuel silme yapıyor (`notes.py`). Modeli kontrol et.
