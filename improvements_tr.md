# Jotrow Projesi İçin Geliştirme ve İyileştirme Önerileri

Bu belge, Jotrow projesinin mevcut kod tabanı, mimarisi ve kullanıcı deneyimi (UX) göz önüne alınarak gelecekte yapılabilecek iyileştirmelerin bir özetidir. Proje büyüdükçe sürdürülebilirliği ve performansı artırmak için uygulanabilecek adımları içerir.

## 1. Frontend Mimari ve Kod Kalitesi İyileştirmeleri (React/Vite)

- **Büyük Dosyaların Bölünmesi:** `Profile.tsx` dosyası şu anda 900 satıra yaklaştı. Modallar (Kaydetme, Kilit Açma), Liste bileşenleri (`CourseCard`, `NoteCard`) ayrı alt bileşenlere (components) bölünmelidir. Bu, kodun okunabilirliğini ve tekrar kullanılabilirliğini artıracaktır.
- **State Yönetimi:** Çok sayıda `useState` ve `useEffect` kullanımı mevcut. Global veya karmaşık state'ler (örneğin auth durumu, kullanıcının PAPS bakiyesi) için React Context veya Zustand/Redux gibi bir state yönetim kütüphanesi kullanılabilir.
- **Tip Güvenliği (TypeScript):** `any` olarak bırakılan tipler (örneğin API'den dönen response'larda) spesifik interface'lere bağlanmalıdır. Bu sayede hata ayıklama süresi kısalır.
- **Pagination / Infinite Scroll:** "Keşfet" (Explore) sayfası için şu an varsayılan limit 50 olarak artırıldı. Ancak kullanıcı sayısı arttıkça bu sayfa yavaşlayacaktır. Gerçek bir pagination veya aşağı inildikçe yüklenen (infinite scroll) bir yapı kurulmalıdır.
- **Optimistic UI Güncellemeleri:** Bir notu beğenme (praise) veya kaydetme sırasında beklemek yerine arayüz anında güncellenmeli, arka planda API çağrısı yapılmalıdır. Eğer hata alınırsa eski hale geri dönülmelidir. Bu sayede uygulama çok daha hızlı hissettirecektir.

## 2. Backend Mimari ve Performans İyileştirmeleri (FastAPI)

- **Service & Repository Pattern:** `app/api/notes.py` ve `sharing.py` gibi router dosyalarında veritabanı sorguları (SQLAlchemy) ve iş mantığı (business logic) iç içe geçmiş durumda. Veritabanı işlemleri `crud` klasörü altındaki Repository fonksiyonlarına, iş kuralları (PAPS kesilmesi, yetki kontrolü) `services` klasörüne ayrılmalıdır.
- **Transaction (İşlem) Geçmişi Modeli:** Bir kullanıcı PAPS ile not açtığında `UnlockedNote` tablosuna kayıt atılıyor ve bakiyesi düşüyor. Ancak "hangi tarihte, ne kadar PAPS kime ödendi" tarzında detaylı bir log (Audit Trail / Transaction) tablomuz yok. İleride gelir/gider detaylarını kullanıcılara göstermek için bir `Transaction` tablosu eklenmelidir.
- **S3 / Caching Optimizasyonu:** MinIO/Supabase üzerinden görsel çekerken ve özellikle Presigned URL üretirken tekrar eden sorgular yapılıyor olabilir. Presigned URL'ler için Redis gibi geçici bir önbellek (Cache) kullanılabilir.
- **Arka Plan İşlemleri (Background Tasks):** Görsel yükleme, yeniden boyutlandırma (Resizing) veya ZIP indirilirken dosyaların birleştirilmesi sırasında sunucu meşgul ediliyor. Bu tip uzun süren işlemler Celery veya FastAPI `BackgroundTasks` kullanılarak asenkron hale getirilebilir.

## 3. Kullanıcı Deneyimi (UX/UI) Geliştirmeleri

- **İstatistik Paneli:** Kullanıcıların notlarından ne kadar PAPS kazandığını gösteren analitik bir grafik/ekran panosunun (Dashboard) profillerine eklenmesi.
- **Bildirimler (Notifications):** Birisinin notu satın aldığında veya notuna beğeni (praise) geldiğinde kullanıcıya uygulama içi (veya e-posta ile) bildirim gitmesi.
- **Arama Motoru Geliştirmesi:** Şu an sadece klasör başlıkları veya açıklamaları üzerinde basit arama yapılıyorsa, uygulamanın içerisine Elasticsearch veya PostgreSQL Full-Text Search entegre edilerek notların _içeriklerinde_ de detaylı arama yapılabilmesi sağlanabilir.

## 4. Güvenlik İyileştirmeleri

- **Rate Limiting (İstek Sınırlandırması):** Özellikle `unlock` (satın alma) veya dosya yükleme API'leri için saniyede yapılabilecek istek sayısı kısıtlanmalıdır (DDoS vb. durumlar için). FastAPI `slowapi` modülü ile kolayca eklenebilir.
- **Dosya Yükleme Doğrulamaları (MIME Types):** Sadece belirli görsel uzantılarının (jpeg, png, webp) yüklendiğinden tam olarak emin olmak ve sahte dosyaların sistemde risk oluşturmasını engellemek için yüklenen byte'ların büyülü numaralarını (magic numbers) kontrol eden kütüphaneler (örn. `python-magic`) kullanılabilir.

---
_Sabah uyandığında bu not üzerinden gelecekte yapılacak önceliklere birlikte karar verebiliriz! İyi dinlenmeler!_
