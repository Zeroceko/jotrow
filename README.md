# JOTROW 📓 — Akıllı Ders Notu Paylaşım Platformu

**JOTROW**, öğrencilerin ve akademisyenlerin ders notlarını organize etmelerini, güvenle saklamalarını ve bir ekonomi içerisinde paylaşmalarını sağlayan modern bir web platformudur.

---

## 📽 Vizyon ve Amaç
JOTROW, akademik bilginin bir değere dönüştüğü bir ekosistem olmayı amaçlar. Kullanıcılar sadece not tutmakla kalmaz, aynı zamanda kendi uzmanlık alanlarını markalaştırır ve **PAPS** token sistemi ile bu bilgiyi ticarileştirebilirler.

> [!IMPORTANT]
> **Öncelik 1:** Dosya yükleme (upload) işinin tüm ortamlarda stabil hale getirilmesi. Diğer tüm geliştirmeler bu temel üzerine inşa edilecektir.

[📄 Detaylı Developer Devir Belgesi (Handoff) İçin Tıklayın](./DEVOLUTION.md)

---

## 🚀 Öne Çıkan Özellikler

### 🛡 Gelişmiş Güvenlik ve Paylaşım
- **4 Haneli PIN Sistemi:** Her kullanıcıya özel bir paylaşım kodu (`share_code`).
- **Esnek Görünürlük:** Notlar; Gizli, Herkese Açık (Ücretsiz) veya Kilitli (PAPS/PIN Gerektiren) olarak ayarlanabilir.
- **Korumalı Profil:** `/u/username` üzerinden kilitli profillere sadece PIN ile erişim.

### 💰 PAPS Ekonomisi
- **Kayıt Bonusu:** Her yeni üyeye anında **100 PAPS** hediye.
- **Not Satışı:** Notlarınızı PAPS karşılığında kilitleyin.
- **İşlem Geçmişi:** Kazanç ve harcamaların şeffaf takibi.

### 🖼 Akıllı Depolama (Image Engine)
- **Oto-Sıkıştırma:** Görseller yüklenirken Pillow ile optimize edilir (%82'ye varan depolama tasarrufu).
- **Format Desteği:** JPEG, PNG ve Apple HEIC/HEIF desteği.
- **MinIO Entegrasyonu:** Yüksek hızlı S3 uyumlu nesne depolama.

### ⚡ Kullanıcı Deneyimi
- **Drag & Drop:** Notları klasörlere sürükleyip bırakarak organize edin.
- **Tam i18n:** Türkçe ve İngilizce dil seçeneği.
- **Keşfet:** En popüler içerikleri ve yazarları bulun.

---

## 🛠 Teknik Mimari

| Katman | Teknoloji |
|--------|-----------|
| **Backend** | FastAPI (Python) |
| **Database** | PostgreSQL + SQLAlchemy |
| **Görsel İşleme** | Pillow + python-heif |
| **Frontend** | React 18 + Vite + Tailwind CSS |
| **Localization** | Custom i18n Context (TR/EN) |
| **Depolama** | MinIO (Object Storage) |

---

## 🏁 Hızlı Başlangıç

### 1. Altyapıyı Başlat
```bash
docker-compose up -d
```

### 2. Backend Kurulumu
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

### 3. Frontend Kurulumu
```bash
cd frontend
npm install
npm run dev
```

---

## 🌐 Canlı Ortam Linkleri
- **Üretim (Live):** [https://jotrow-mu.vercel.app/](https://jotrow-mu.vercel.app/)
- **API (Render):** [https://jotrow.onrender.com/docs](https://jotrow.onrender.com/docs)

---

## 📂 Proje Klasör Yapısı
- `/backend`: FastAPI uygulama kodları, modeller ve migration'lar.
- `/frontend`: React bileşenleri, sayfalar ve asst'ler.
- `DEVOLUTION.md`: Yeni geliştiriciler için derinlemesine teknik rehber.

---
**JOTROW**, bilginin özgürce ama değerinde paylaşıldığı bir gelecek için geliştirildi.
