"""
JOTROW Seed Script
Deletes ALL existing data and creates 25 students with courses and notes.
Run: python seed.py (from the backend directory)
"""
import os
import sys
import random

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.session import SessionLocal
from app.core.security import get_password_hash
from app import models

PASSWORD = "test1234"

STUDENTS = [
    {"username": "ahmet", "email": "ahmet@jotrow.com", "display_name": "Ahmet Yılmaz", "bio": "Bilgisayar Mühendisliği 3. sınıf", "university": "İTÜ", "department": "Bilgisayar Müh."},
    {"username": "zeynep", "email": "zeynep@jotrow.com", "display_name": "Zeynep Kaya", "bio": "Tıp fakültesi öğrencisi", "university": "Hacettepe", "department": "Tıp"},
    {"username": "can", "email": "can@jotrow.com", "display_name": "Can Demir", "bio": "Hukuk 2. sınıf", "university": "Ankara Üni.", "department": "Hukuk"},
    {"username": "elif", "email": "elif@jotrow.com", "display_name": "Elif Arslan", "bio": "Almanca öğreniyorum 🇩🇪", "university": "ODTÜ", "department": "Yabancı Diller"},
    {"username": "mert", "email": "mert@jotrow.com", "display_name": "Mert Özkan", "bio": "Makine mühendisliği, termodinamik uzmanı", "university": "Boğaziçi", "department": "Makine Müh."},
    {"username": "selin", "email": "selin@jotrow.com", "display_name": "Selin Yıldız", "bio": "Psikoloji 4. sınıf, bilişsel psikoloji", "university": "Koç Üni.", "department": "Psikoloji"},
    {"username": "burak", "email": "burak@jotrow.com", "display_name": "Burak Çelik", "bio": "Elektrik-Elektronik Müh. yüksek lisans", "university": "İTÜ", "department": "Elektrik-Elektronik"},
    {"username": "ayse", "email": "ayse@jotrow.com", "display_name": "Ayşe Polat", "bio": "Moleküler biyoloji ve genetik", "university": "Bilkent", "department": "MBG"},
    {"username": "emre", "email": "emre@jotrow.com", "display_name": "Emre Acar", "bio": "İşletme 3. sınıf, finans odaklı", "university": "Sabancı", "department": "İşletme"},
    {"username": "defne", "email": "defne@jotrow.com", "display_name": "Defne Korkmaz", "bio": "Mimarlık öğrencisi, tasarım tutkunu", "university": "Mimar Sinan", "department": "Mimarlık"},
    {"username": "kaan", "email": "kaan@jotrow.com", "display_name": "Kaan Şahin", "bio": "Fizik bölümü, kuantum mekaniği çalışıyorum", "university": "Boğaziçi", "department": "Fizik"},
    {"username": "buse", "email": "buse@jotrow.com", "display_name": "Buse Erdem", "bio": "Eczacılık 5. sınıf", "university": "Gazi Üni.", "department": "Eczacılık"},
    {"username": "onur", "email": "onur@jotrow.com", "display_name": "Onur Güneş", "bio": "Endüstri mühendisliği, yöneylem araştırması", "university": "ODTÜ", "department": "Endüstri Müh."},
    {"username": "ceren", "email": "ceren@jotrow.com", "display_name": "Ceren Turan", "bio": "Uluslararası ilişkiler, diplomasi", "university": "Galatasaray Üni.", "department": "Uluslararası İlişkiler"},
    {"username": "baris", "email": "baris@jotrow.com", "display_name": "Barış Koç", "bio": "Yazılım mühendisliği, full-stack dev", "university": "Yıldız Teknik", "department": "Yazılım Müh."},
    {"username": "naz", "email": "naz@jotrow.com", "display_name": "Naz Akın", "bio": "Grafik tasarım öğrencisi", "university": "Bilgi Üni.", "department": "Grafik Tasarım"},
    {"username": "arda", "email": "arda@jotrow.com", "display_name": "Arda Öztürk", "bio": "Kimya mühendisliği 3. sınıf", "university": "İTÜ", "department": "Kimya Müh."},
    {"username": "melis", "email": "melis@jotrow.com", "display_name": "Melis Başar", "bio": "Matematik bölümü, analiz uzmanı", "university": "ODTÜ", "department": "Matematik"},
    {"username": "taylan", "email": "taylan@jotrow.com", "display_name": "Taylan Kılıç", "bio": "Tarih bölümü, Osmanlı tarihi", "university": "İstanbul Üni.", "department": "Tarih"},
    {"username": "ipek", "email": "ipek@jotrow.com", "display_name": "İpek Çetin", "bio": "Veterinerlik 4. sınıf", "university": "Ankara Üni.", "department": "Veterinerlik"},
    {"username": "efe", "email": "efe@jotrow.com", "display_name": "Efe Yıldırım", "bio": "İnşaat mühendisliği, yapı statiği", "university": "İTÜ", "department": "İnşaat Müh."},
    {"username": "ada", "email": "ada@jotrow.com", "display_name": "Ada Şen", "bio": "Sosyoloji öğrencisi, toplumsal cinsiyet çalışmaları", "university": "Boğaziçi", "department": "Sosyoloji"},
    {"username": "deniz", "email": "deniz@jotrow.com", "display_name": "Deniz Gül", "bio": "Çeviri bilim, İngilizce-Türkçe", "university": "Hacettepe", "department": "Mütercim Tercümanlık"},
    {"username": "yusuf", "email": "yusuf@jotrow.com", "display_name": "Yusuf Kaplan", "bio": "Gıda mühendisliği, kalite kontrol", "university": "Ege Üni.", "department": "Gıda Müh."},
    {"username": "hazal", "email": "hazal@jotrow.com", "display_name": "Hazal Doğan", "bio": "Diş hekimliği 3. sınıf", "university": "Marmara Üni.", "department": "Diş Hekimliği"},
]

# Course + note templates per student
COURSE_DATA = {
    "ahmet": [
        {"title": "Veri Yapıları", "desc": "CS201 ders notları", "notes": [
            {"title": "Linked List Notları", "content": "Tek yönlü ve çift yönlü bağlı listeler. Node yapısı, insert, delete, search operasyonları. Time complexity analizi: insert O(1), search O(n).", "price": 5},
            {"title": "Binary Tree Özeti", "content": "İkili ağaç yapısı. In-order, pre-order, post-order traversal yöntemleri. BST karmaşıklık analizi.", "price": 0},
        ]},
        {"title": "Algoritma Analizi", "desc": "CS301 algoritma dersi", "notes": [
            {"title": "Sorting Algorithms", "content": "Quick sort, merge sort, heap sort karşılaştırması. Ortalama ve en kötü durum analizi.", "price": 10, "pin": True},
        ]},
    ],
    "zeynep": [
        {"title": "Anatomi 101", "desc": "Temel anatomi dersi notları", "notes": [
            {"title": "Kemik Sistemi", "content": "İnsan iskelet sistemi, 206 kemik ve bağlantıları. Aksiyel ve apendiküler iskelet ayrımı.", "price": 8},
            {"title": "Kas Sistemi", "content": "Çizgili kas, düz kas ve kalp kası arasındaki farklar. Miyozin ve aktin filamanları.", "price": 0},
            {"title": "Sinir Sistemi", "content": "Merkezi ve periferik sinir sistemi yapısı. Nöron tipleri ve sinaps mekanizması.", "price": 15, "pin": True},
        ]},
    ],
    "can": [
        {"title": "Anayasa Hukuku", "desc": "Anayasa hukuku ders notları", "notes": [
            {"title": "Temel Haklar", "content": "Temel haklar ve özgürlükler, devletin yapısı. Kuvvetler ayrılığı ilkesi.", "price": 5},
            {"title": "Ceza Hukuku Genel", "content": "Suçun unsurları, ceza türleri ve zamanaşımı kuralları.", "price": 0},
        ]},
    ],
    "elif": [
        {"title": "Almanca B1", "desc": "Almanca B1 seviye ders notları", "notes": [
            {"title": "Konjunktionen", "content": "Als, wenn, während, bis, seit, bevor, nachdem, sobald bağlaçlarının kullanımı.", "price": 3},
            {"title": "B1 Kelime Listesi", "content": "B1 sınavı için en önemli 200 kelime ve örnek cümleler.", "price": 0},
        ]},
    ],
    "mert": [
        {"title": "Termodinamik", "desc": "Termodinamik ders notları", "notes": [
            {"title": "1. Yasa", "content": "Enerji korunumu, iç enerji, iş ve ısı kavramları. Kapalı sistem analizi.", "price": 10},
            {"title": "2. Yasa ve Entropi", "content": "Entropi kavramı, Carnot döngüsü, tersinir ve tersinmez süreçler.", "price": 8},
        ]},
    ],
    "selin": [
        {"title": "Bilişsel Psikoloji", "desc": "PSY301 ders notları", "notes": [
            {"title": "Bellek Modelleri", "content": "Atkinson-Shiffrin modeli: duyusal bellek, kısa süreli bellek, uzun süreli bellek. Çalışma belleği modeli.", "price": 7},
            {"title": "Dikkat Süreçleri", "content": "Seçici dikkat, bölünmüş dikkat. Stroop etkisi ve cocktail party etkisi.", "price": 5},
        ]},
    ],
    "burak": [
        {"title": "Devre Analizi", "desc": "EE201 temel devre analizi", "notes": [
            {"title": "Kirchhoff Yasaları", "content": "KVL ve KCL uygulamaları. Düğüm ve çevre analizi yöntemleri.", "price": 6},
            {"title": "Thevenin-Norton", "content": "Thevenin ve Norton eşdeğer devreleri. Süperpozisyon prensibi.", "price": 8, "pin": True},
        ]},
    ],
    "ayse": [
        {"title": "Moleküler Biyoloji", "desc": "MBG202 ders notları", "notes": [
            {"title": "DNA Replikasyonu", "content": "Yarı-korunumlu replikasyon, helikaz, primaz, DNA polimeraz III, Okazaki parçaları.", "price": 10},
            {"title": "Gen İfadesi", "content": "Transkripsiyon ve translasyon. mRNA, tRNA, rRNA görevleri.", "price": 0},
        ]},
    ],
    "emre": [
        {"title": "Finansal Yönetim", "desc": "BA301 finans dersi", "notes": [
            {"title": "NBD Analizi", "content": "Net bugünkü değer hesaplama, iskonto oranı, yatırım değerlendirmesi.", "price": 12},
            {"title": "Portföy Teorisi", "content": "Markowitz ortalama-varyans modeli, etkin sınır, CAPM.", "price": 8},
        ]},
    ],
    "defne": [
        {"title": "Mimari Tasarım", "desc": "ARCH301 tasarım stüdyosu", "notes": [
            {"title": "Modernizm Akımı", "content": "Le Corbusier, Mies van der Rohe, Frank Lloyd Wright. Form follows function ilkesi.", "price": 5},
            {"title": "Sürdürülebilir Tasarım", "content": "LEED sertifikası, pasif ev tasarımı, yeşil çatı sistemleri.", "price": 7},
        ]},
    ],
    "kaan": [
        {"title": "Kuantum Mekaniği", "desc": "PHYS401 kuantum fiziği", "notes": [
            {"title": "Schrödinger Denklemi", "content": "Zamana bağlı ve bağımsız Schrödinger denklemi. Dalga fonksiyonu ve olasılık yorumu.", "price": 15},
            {"title": "Hidrojen Atomu", "content": "Hidrojen atomunun kuantum mekaniksel çözümü. Kuantum sayıları ve orbital yapıları.", "price": 10, "pin": True},
        ]},
    ],
    "buse": [
        {"title": "Farmakoloji", "desc": "Temel farmakoloji", "notes": [
            {"title": "İlaç Etkileşimleri", "content": "Farmakokinetik ve farmakodinamik etkileşimler. CYP450 enzim sistemi.", "price": 8},
            {"title": "Antibiyotikler", "content": "Beta-laktamlar, makrolidler, aminoglikozitler. Etki mekanizmaları ve direnç.", "price": 6},
        ]},
    ],
    "onur": [
        {"title": "Yöneylem Araştırması", "desc": "IE301 optimizasyon", "notes": [
            {"title": "Doğrusal Programlama", "content": "Simpleks metodu adım adım. Dual problem ve duyarlılık analizi.", "price": 10},
            {"title": "Kuyruk Teorisi", "content": "M/M/1 ve M/M/c kuyruk modelleri. Bekleme süreleri ve utilization oranları.", "price": 7},
        ]},
    ],
    "ceren": [
        {"title": "Uluslararası Hukuk", "desc": "IR302 uluslararası hukuk", "notes": [
            {"title": "BM Sistemi", "content": "Birleşmiş Milletler yapısı, Güvenlik Konseyi, Genel Kurul. Veto yetkisi.", "price": 5},
            {"title": "İnsan Hakları", "content": "AİHM kararları, Avrupa İnsan Hakları Sözleşmesi maddeleri.", "price": 0},
        ]},
    ],
    "baris": [
        {"title": "Web Development", "desc": "Full-stack web geliştirme", "notes": [
            {"title": "React Hooks", "content": "useState, useEffect, useContext, useMemo, useCallback. Custom hooks yazımı.", "price": 8},
            {"title": "Node.js Backend", "content": "Express.js ile REST API, middleware, authentication, JWT.", "price": 10},
            {"title": "PostgreSQL", "content": "İlişkisel veritabanı tasarımı, normalizasyon, indexing, query optimization.", "price": 6},
        ]},
    ],
    "naz": [
        {"title": "Grafik Tasarım Temelleri", "desc": "Görsel iletişim dersi", "notes": [
            {"title": "Tipografi", "content": "Serif ve sans-serif ayrımı. Font pairing kuralları. Hiyerarşi ve okunabilirlik.", "price": 4},
            {"title": "Renk Teorisi", "content": "RGB ve CMYK renk modelleri. Renk harmonisi, tamamlayıcı renkler.", "price": 0},
        ]},
    ],
    "arda": [
        {"title": "Kimya Mühendisliği", "desc": "Temel kimya müh. dersleri", "notes": [
            {"title": "Kütle Transferi", "content": "Difüzyon, konvektif kütle transferi, Fick yasaları. Distilasyon kolonu tasarımı.", "price": 9},
            {"title": "Reaktör Tasarımı", "content": "CSTR ve PFR karşılaştırması. Dönüşüm oranı ve seçicilik hesabı.", "price": 7, "pin": True},
        ]},
    ],
    "melis": [
        {"title": "Analiz", "desc": "MATH301 reel analiz", "notes": [
            {"title": "Diziler ve Seriler", "content": "Cauchy dizileri, yakınsaklık testleri, mutlak ve koşullu yakınsaklık.", "price": 6},
            {"title": "Süreklilik", "content": "Epsilon-delta tanımı, düzgün süreklilik, Bolzano teoremi.", "price": 5},
        ]},
    ],
    "taylan": [
        {"title": "Osmanlı Tarihi", "desc": "Osmanlı İmparatorluğu", "notes": [
            {"title": "Kuruluş Dönemi", "content": "Osman Bey'den Fatih'e. Beylikten imparatorluğa geçiş. Tımar sistemi.", "price": 4},
            {"title": "Tanzimat Dönemi", "content": "Gülhane Hatt-ı Hümayunu, Islahat Fermanı. Modernleşme çabaları.", "price": 3},
        ]},
    ],
    "ipek": [
        {"title": "Veteriner Anatomi", "desc": "Hayvan anatomisi", "notes": [
            {"title": "Evcil Hayvan Anatomisi", "content": "Kedi ve köpek iskelet sistemi karşılaştırması. Eklem yapıları.", "price": 5},
            {"title": "Büyükbaş Hayvan", "content": "Sığır sindirim sistemi, rumen fizyolojisi, geviş getirme.", "price": 7},
        ]},
    ],
    "efe": [
        {"title": "Yapı Statiği", "desc": "CE201 yapı mekaniği", "notes": [
            {"title": "Kuvvet Analizi", "content": "Statik denge, serbest cisim diyagramı, mesnet tepkileri. İç kuvvet diyagramları.", "price": 8},
            {"title": "Çelik Yapılar", "content": "Çelik profil seçimi, kaynak bağlantıları, burkulma kontrolü.", "price": 10, "pin": True},
        ]},
    ],
    "ada": [
        {"title": "Sosyolojiye Giriş", "desc": "SOC101 ders notları", "notes": [
            {"title": "Sosyal Tabakalaşma", "content": "Marx ve Weber'in sınıf teorileri. Toplumsal hareketlilik kavramı.", "price": 3},
            {"title": "Kültür ve Kimlik", "content": "Kültürel görelilik, etnosentrizm, alt kültürler ve karşı kültürler.", "price": 0},
        ]},
    ],
    "deniz": [
        {"title": "Çeviri Teknikleri", "desc": "Çeviri bilim dersleri", "notes": [
            {"title": "Edebi Çeviri", "content": "Kaynak metin sadakati vs. hedef metin akıcılığı. Eşdeğerlik türleri.", "price": 5},
            {"title": "Teknik Çeviri", "content": "Terminoloji yönetimi, CAT araçları (SDL Trados, MemoQ). Çeviri bellekleri.", "price": 4},
        ]},
    ],
    "yusuf": [
        {"title": "Gıda Kimyası", "desc": "FE301 gıda kimyası", "notes": [
            {"title": "Karbonhidratlar", "content": "Monosakkaritler, disakkaritler, polisakkaritler. Maillard reaksiyonu.", "price": 6},
            {"title": "Gıda Katkı Maddeleri", "content": "Koruyucular, antioksidanlar, emülgatörler. E kodları ve güvenlik limitleri.", "price": 4},
        ]},
    ],
    "hazal": [
        {"title": "Diş Hekimliği", "desc": "Temel diş hekimliği dersleri", "notes": [
            {"title": "Diş Anatomisi", "content": "Süt ve kalıcı dişler. Mine, dentin, pulpa yapısı. Diş numaralama sistemleri.", "price": 7},
            {"title": "Periodontoloji", "content": "Dişeti hastalıkları, plak oluşumu, periodontal cep. Tedavi yaklaşımları.", "price": 8},
        ]},
    ],
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

        for s in STUDENTS:
            user = models.User(
                username=s["username"],
                email=s["email"],
                hashed_password=hashed_pw,
                display_name=s["display_name"],
                bio=s["bio"],
                university=s["university"],
                department=s["department"],
                paps_balance=100,
                share_code="1234",
                show_on_explore=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            db.add(models.Transaction(user_id=user.id, type="topup", amount=100, description="Kayıt hediyesi"))
            db.commit()

            # Create courses and notes
            courses = COURSE_DATA.get(s["username"], [])
            for c in courses:
                course = models.Course(title=c["title"], description=c["desc"], owner_id=user.id)
                db.add(course)
                db.commit()
                db.refresh(course)

                for n in c["notes"]:
                    note = models.Note(
                        title=n["title"],
                        content=n["content"],
                        course_id=course.id,
                        owner_id=user.id,
                        paps_price=n.get("price", 0),
                        requires_pin=n.get("pin", False),
                        visibility="public",
                    )
                    db.add(note)
                    db.commit()

            print(f"   👤 {s['username']} — {len(courses)} course(s)")

        print(f"\n🎉 Seed complete! Created {len(STUDENTS)} students.")
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
