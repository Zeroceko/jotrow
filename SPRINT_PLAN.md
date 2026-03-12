# Sprint Plan - V1 (2 Sprint)

## Sprint 1: Upload + Sharing (Hafta 1-2)

### Backend
- [x] Docker Compose setup (Postgres, Redis, MinIO)
- [x] SQLAlchemy models (User, Course, Note, NoteImage)
- [x] Alembic migrations
- [ ] Auth endpoints (register, login, JWT)
- [ ] Course CRUD endpoints
- [ ] Note upload endpoint (multi-file)
- [ ] MinIO storage service (upload + presigned URL)
- [ ] Profile public endpoint (/u/{username})
- [ ] Access code verification

### Frontend
- [ ] React + TypeScript + Vite setup
- [ ] Login/Register pages
- [ ] Dashboard (dersler listesi)
- [ ] Upload page (course seç + multi-file upload)
- [ ] Profile view page (public)
- [ ] Access code input modal

### Test
- [ ] Auth flow (register → login → token)
- [ ] Upload flow (course oluştur → not yükle → fotoğraflar görüntüle)
- [ ] Sharing flow (profil link + kod → erişim)

## Sprint 2: Polish + Deploy (Hafta 3-4)

### Backend
- [ ] Error handling iyileştirme
- [ ] Rate limiting (Redis)
- [ ] File validation (size, type)
- [ ] Logging
- [ ] Health check endpoints
- [ ] API documentation (Swagger)

### Frontend
- [ ] Responsive design (mobil-first)
- [ ] Loading states
- [ ] Error handling
- [ ] Image gallery component
- [ ] Copy share link button
- [ ] Basic analytics (görüntülenme sayısı)

### DevOps
- [ ] Docker Compose production config
- [ ] Environment variables
- [ ] MinIO bucket setup script
- [ ] Database migration script
- [ ] README güncelleme

### Test
- [ ] End-to-end test (Playwright/Cypress)
- [ ] Load test (basic)
- [ ] Security audit (basic)

## V1.5 Backlog (Sonraki Sprint)
- [ ] OCR entegrasyonu (client-side Tesseract.js)
- [ ] PAPS ekonomisi (wallet, transaction)
- [ ] Vote sistemi (upvote/downvote)
- [ ] Reputation hesaplama
- [ ] Marketplace (not fiyatlandırma, satın alma)
