# JOTROW - Project Structure

## Backend (FastAPI)
- `app/models.py`: SQLAlchemy models (User, Course, Note, NoteImage).
- `app/api/auth.py`: Authentication logic (Registration with 4-digit code, JWT Login).
- `app/api/notes.py`: CRUD operations for Courses and Notes.
- `app/api/sharing.py`: Public sharing logic via `/u/{username}`.
- `app/services/storage.py`: MinIO integration for file uploads.
- `alembic/`: Database migrations.

## Frontend (React + Vite + TypeScript)
- `src/pages/`: Main application pages (Login, Register, Dashboard, Upload, profile).
- `src/components/`: Reusable UI components.
- `src/services/`: API client and services.

## Infrastructure
- `docker-compose.yml`: Orchestration for App, DB, and MinIO.
- `MinIO`: S3 compatible object storage for note images.
- `PostgreSQL`: Relational database.
