# API Endpoints

## Auth
- `POST /auth/register`: Register new user (returns 4-digit code or uses it).
- `POST /auth/login`: JWT token exchange.

## Notes & Courses
- `GET /courses`: List user's courses.
- `POST /courses`: Create a new course.
- `GET /courses/{id}/notes`: List notes in a course.
- `POST /notes`: Upload a new note (image + metadata).

## Sharing
- `GET /u/{username}`: Public profile view (requires code).
- `POST /u/{username}/verify`: Verify 4-digit code for access.
