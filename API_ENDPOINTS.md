# API Endpoints - V1

## Auth

### POST /api/auth/register
Yeni kullanıcı kaydı
```json
Request:
{
  "username": "zeynep",
  "email": "zeynep@example.com",
  "password": "password123"
}

Response:
{
  "id": 1,
  "username": "zeynep",
  "email": "zeynep@example.com",
  "access_code": "4821",
  "created_at": "2024-01-01T00:00:00"
}
```

### POST /api/auth/login
Giriş yap (JWT token al)
```json
Form Data:
username=zeynep
password=password123

Response:
{
  "access_token": "eyJ...",
  "token_type": "bearer"
}
```

## Users

### GET /api/users/me
Mevcut kullanıcı bilgisi (Auth required)

### GET /api/users/{username}
Username ile kullanıcı bilgisi

## Courses

### POST /api/notes/courses
Yeni ders oluştur (Auth required)
```json
Request:
{
  "code": "MAT101",
  "name": "Matematik 1"
}

Response:
{
  "id": 1,
  "code": "MAT101",
  "name": "Matematik 1",
  "created_at": "2024-01-01T00:00:00",
  "notes_count": 0
}
```

### GET /api/notes/courses
Kullanıcının derslerini listele (Auth required)

## Notes

### POST /api/notes/notes
Not oluştur ve fotoğrafları yükle (Auth required)
```json
Multipart Form:
- note: {"title": "Ders 1", "course_id": 1, "description": "..."}
- files: [file1.jpg, file2.jpg, ...]

Response:
{
  "id": 1,
  "title": "Ders 1",
  "description": "...",
  "course_id": 1,
  "created_at": "2024-01-01T00:00:00",
  "images": [
    {
      "id": 1,
      "object_key": "users/1/notes/uuid.jpg",
      "order": 0,
      "url": "https://presigned-url..."
    }
  ]
}
```

### GET /api/notes/notes/{note_id}
Not detayı (Auth required)

### GET /api/notes/courses/{course_id}/notes
Ders notlarını listele (Auth required)

## Sharing (Public)

### POST /api/u/{username}/verify
Profil erişimi için kod doğrulama
```json
Request:
{
  "access_code": "4821"
}

Response:
{
  "message": "Access granted",
  "username": "zeynep"
}
```

### GET /api/u/{username}?access_code=4821
Kullanıcı profili - dersler ve notlar
```json
Response:
{
  "username": "zeynep",
  "courses": [
    {
      "id": 1,
      "code": "MAT101",
      "name": "Matematik 1",
      "created_at": "2024-01-01T00:00:00",
      "notes_count": 5
    }
  ]
}
```

### GET /api/u/{username}/share-info
Paylaşım bilgisi (kod göstermeden)
```json
Response:
{
  "username": "zeynep",
  "share_url": "http://localhost:3000/u/zeynep",
  "requires_code": true
}
```
