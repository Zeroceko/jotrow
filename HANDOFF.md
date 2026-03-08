# JOTROW — Developer Handoff
**Tarih:** 2026-03-08 | **Oturum:** Sprint 4 (Görsel Fix + PAPS Unlock)

---

## 🏁 Bu Oturumda Tamamlananlar

### 1. Tam i18n (Çok Dilli) Desteği
Tüm frontend sayfaları Türkçe/İngilizce çevirisine bağlandı. Artık hiçbir sayfada hardcode İngilizce string kalmadı.

**Çevrilen sayfalar:**
| Dosya | Durum |
|-------|-------|
| `Home.tsx` | ✅ Zaten çevriliydi |
| `Dashboard.tsx` | ✅ Zaten çevriliydi |
| `Explore.tsx` | ✅ Bu oturumda tamamlandı |
| `Settings.tsx` | ✅ Bu oturumda tamamlandı |
| `Profile.tsx` | ✅ Bu oturumda tamamlandı |
| `Login.tsx` | ✅ Bu oturumda tamamlandı |
| `Register.tsx` | ✅ Bu oturumda tamamlandı |
| `CourseDetail.tsx` | ✅ Bu oturumda tamamlandı |
| `Upload.tsx` | ✅ Zaten çevriliydi |
| `NotFound.tsx` | ✅ Bu oturumda tamamlandı |

**Çeviri mimarisi:**  
`frontend/src/context/LanguageContext.tsx` dosyası tüm key-value çiftlerini barındırır.  
Her sayfada `const { t } = useLanguage();` ile import edilir.  
Dil seçimi Navbar'da yapılır ve `localStorage`'da saklanır.

### 3. Görsel Yükleme Fix & Sıkıştırma (Pillow)
MinIO'ya görsel yüklerken alınan "Length -1" hatası ve yüksek depolama kullanımı çözüldü.

**Detaylar:**
- `storage.py`: Tüm görseller yükleme anında Pillow ile yakalanır.
- **Sıkıştırma:** Maksimum 1200px genişlik ve %70 JPEG kalitesine düşürülür.
- **Fix:** Görsel buffer boyutu (`nbytes`) hesaplanarak MinIO'ya net uzunlukla gönderilir.
- **Depolama:** Dosya boyutlarında %70-%90 oranında azalma sağlandı.

### 4. PAPS ile Not Kilidi Açma (Unlock)
Not sahipleri artık notlarına PAPS fiyatı koyabiliyor. Başka kullanıcılar bu notu PAPS ödeyerek veya sahibinin PIN kodunu girerek açabiliyor.

**Teknik Detaylar:**
- **Model:** `Note` tablosuna `paps_price` eklendi. `UnlockedNote` tablosu ile kimin hangi notu açtığı takip ediliyor.
- **Backend:** `POST /api/notes/{id}/unlock` — Bakiye kontrolü, transfer ve kilit açma kaydı.
- **Frontend:** `Profile.tsx` ve `CourseDetail.tsx` içerisinde kilitli notlar için "Unlock" modalı/arayüzü eklendi.

**Mevcut çeviri modülleri (key prefix'lerine göre):**
- `nav.*` — Navbar
- `home.*` — Ana sayfa
- `dash.*` — Dashboard
- `upload.*` — Not yükleme
- `exp.*` — Keşfet
- `settings.*` — Ayarlar
- `prof.*` — Profil sayfası
- `login.*` — Giriş
- `reg.*` — Kayıt
- `cd.*` — Kurs detay
- `nf.*` — 404 sayfası

### 2. Drag & Drop ile Not Taşıma
Dashboard'da gelen kutusundaki (Inbox) notlar, klasörlerin üzerine sürükle-bırak ile taşınabiliyor.

**Teknik Detaylar:**
- Not kartları `draggable` attribute ile işaretli.
- `onDragStart` → `noteId`'yi dataTransfer'a yazar.
- Klasör kartları `onDragOver` + `onDrop` ile `handleMoveNote` çağırır.
- Backend: `PUT /api/notes/{id}/move` endpoint'i `{ course_id: int }` alıyor.

---

## ⚠️ Bilinen Hatalar / Eksikler

### 1. [YENİ / KRİTİK] Canlı Ortamda "Failed to upload note"
**Sorun:** Localde/Docker'da çözülmesine rağmen bazı canlı (production) ortamlarda görsel yükleme hâlâ hata verebiliyor.
**Kök Neden:** Prod ortamında Pillow'un (libjpeg vb.) eksik olması veya `.env` içindeki `MINIO_SECURE` ayarının HTTPS uyumsuzluğu.
**Kontrol:** `storage.py` içindeki `secure=not is_local` mantığı kontrol edilmeli.

### 2. [KRİTİK] Profil Sayfası — Yönlendirme Sorunu
**Sorun:** Navbar'daki "Profile" linka tıklayınca bazı durumlarda "System Error" geliyor.  
**Kök Neden:** Profil sayfası `/u/:username` rotasında çalışıyor. Navbar'ın gelen URL yapısına ve JWT'den parse ettiği kullanıcı adına bakmak gerekiyor.  
**Kontrol Edilecek Yer:** `components/Navbar.tsx` → Profile link URL'si. `pages/Profile.tsx` → `checkProfileExists()` fonksiyonu, `api.get(/api/sharing/${username})` çağrısı.  
**İpucu:** Eğer kullanıcının `username` alanı `null` ise (kayıt sırasında atlanmışsa) backend 404 döner ve "System Error" ekrana gelir. Register'ın 2. adımında kullanıcı adı zorunlu tutulmuş olsa da eski hesaplarda bu boş kalabilir.

### 2. [KRİTİK] Yeni Üyelerin Başkasına Ait Notları Görmesi
**Sorun:** Yeni kayıt olan kullanıcı Dashboard'da ona ait olmayan notlar görüyor.  
**Kök Neden:** `notes.py`'de `read_library_notes` endpoint'i `owner_id == current_user.id` filtresi ile çalışıyor. ANCAK bazı eski notlarda `owner_id` alanı `null` olabilir (bu alan sonradan eklendi). `null`'lar herkese görünüyor.  
**Çözüm:** Mevcut `null` owner_id'li notları temizlemek için migration çalıştırılabilir. Ya da query'ye `models.Note.owner_id.is_not(None)` şartı eklenmeli:
```python
notes = db.query(models.Note).filter(
    models.Note.owner_id == current_user.id,
    models.Note.course_id == None,
    models.Note.original_author == None,
).all()
```
Bu zaten mevcut ama DB'deki eski kayıtlar temizlenmedi! Aşağıdaki migration çalıştırılmalı:
```sql
DELETE FROM notes WHERE owner_id IS NULL;
```
Veya yeni bir Alembic migration eklenebilir.

### 3. [ORTA] Dashboard'daki "Move" Butonu Çevirisiz
Kart üzerindeki `Move` butonu TR/EN çevirisine bağlanmadı. `Dashboard.tsx:310` satırına bakılmalı.
```tsx
// Mevcut:
<FolderPlus size={12} /> Move
// Olması gereken:
<FolderPlus size={12} /> {t('dash.move')}
```
Ve `LanguageContext.tsx`'e:
```
'dash.move': 'Move' (EN) / 'Taşı' (TR)
```
eklenmelidir.

### 4. [DÜŞÜK] Navbar Layout Shift
Dil değişiminde butonlar sağa/sola kayıyor (metin genişliği farklı). Sabit genişlikli `<select>` dropdown kullanılabilir.

### 5. [DÜŞÜK] Update Note Ownership Check Eksik
`PUT /api/notes/{note_id}` endpoint'inde course'suz (inbox'taki) notlar için ownership kontrolü yok:
```python
# notes.py satır 292:
if note.course_id is not None:
    # ... ownership check var
# Ama course_id == None ise sahiplik kontrol edilmiyor!
```
Çözüm: `note.owner_id == current_user.id` kontrolü eklenebilir.

---

## 📐 Mimari Özet

### Backend
```
FastAPI + SQLAlchemy + PostgreSQL + MinIO
app/api/auth.py      → Kayıt/Giriş/JWT
app/api/notes.py     → Kurs ve Not CRUD + note move
app/api/sharing.py   → Halka açık profil + PIN doğrulama
app/api/settings.py  → Profil, gizlilik, cüzdan, kazanç
app/models.py        → User, Course, Note, NoteImage, Transaction
```

### Frontend
```
React 18 + Vite + Tailwind CSS
context/AuthContext.tsx     → JWT token (localStorage)
context/LanguageContext.tsx → i18n (all strings, EN/TR)
pages/Dashboard.tsx         → Ana ekran, kurs+inbox listesi, drag&drop
pages/Profile.tsx           → /u/:username — PIN korumalı profil
pages/Settings.tsx          → Profil/Gizlilik/Cüzdan/Kazanç/Hesap
pages/Explore.tsx           → Kullanıcı keşfet + arama
```

### Kimlik Doğrulama Akışı
1. Kullanıcı `/auth/login` → JWT token alır.
2. Token `localStorage` + `AuthContext`'te saklanır.
3. Tüm API çağrıları `Authorization: Bearer <token>` header'ı ile yapılır (`services/api.ts`).
4. Misafir erişimi: `/u/:username/verify` → misafir token döner → sadece pinli profillere okuma.

---

## 🔜 Önerilen Sonraki Adımlar (Öncelik Sırasıyla)

1. **[BUG FIX]** DB'deki `owner_id = NULL` olan eski notları temizle.
2. **[BUG FIX]** Profil sayfası "System Error" hatasının kök nedeni bulunup çözülmeli.
3. **[FEATURE]** Avatar/Profil fotoğrafı yükleme (MinIO hazır, UI yok).
4. **[İYİLEŞTİRME]** Navbar dil seçicisini dropdown'a çevir (mevcut toggle buton).
5. **[İYİLEŞTİRME]** Dashboard'daki "Move" butonunu çevir.
6. **[İYİLEŞTİRME]** Note update endpoint'ine inkbox sahiplik kontrolü ekle.
7. **[FEATURE]** Not içeriği arama (Explore'da veya Dashboard'da).
8. **[FEATURE]** PAPS ödeme/çekim entegrasyonu.

---

## 🌐 Canlı Ortam (Production) Bilgileri

- **Frontend URL:** [https://jotrow-mu.vercel.app/](https://jotrow-mu.vercel.app/)
- **Backend URL:** [https://jotrow.onrender.com](https://jotrow.onrender.com)

**(NOT: 08 Mart 2026'da CORS policy (Access-Control-Allow-Origin) sorunu düzeltildi ve Vercel domain'i `main.py` içerisine allow_origins listesine eklendi. Öncesinde API'ye erişim sağlanamadığı için "Failed to upload note" dahil tüm endpointler bloklanıyordu.)**
