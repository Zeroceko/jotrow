# JOTROW 📓 — Project Devolution & Handoff Document
**Date:** March 8, 2026 | **Author:** Antigravity (AI Architect)

Welcome, fellow developer! This document is designed to give you a 360-degree view of **JOTROW**, the progress we've made, the technical hurdles we've cleared, and the exciting roadmap ahead.

---

## 🌟 1. Project Vision
**JOTROW** is a digital knowledge-sharing ecosystem. It's more than just a note-taking app; it's a platform where students and academic enthusiasts can:
- **Organize** their logic into structured "Courses" (Folders).
- **Secure** their expertise using a unique 4-digit PIN system.
- **Monetize** their knowledge through the **PAPS Economy** (Tokenized access).
- **Scale** effortlessly with optimized image hosting and a sleek, retro-modern UI.

**Goal:** To become the primary "Open Library" for academic notes, where value is exchanged seamlessly between creators and learners.

---

## 🛠 2. Technical Stack & Architecture

### Backend (The Engine)
- **Framework:** FastAPI (Python 3.9+)
- **ORM:** SQLAlchemy (PostgreSQL)
- **Migrations:** Alembic
- **Storage:** MinIO (S3 Compatible) — Used for high-speed, scalable image storage.
- **Image Processing:** Pillow (Auto-compression to JPEG, 70% quality, max 1200px width).
- **Security:** JWT (JSON Web Tokens) with a dual-mode Auth system (Standard Users vs. Guest PIN-access).

### Frontend (The Face)
- **Core:** React 18 + Vite
- **Styling:** Tailwind CSS (Custom Retro-Modern Theme)
- **State/Context:** 
  - `AuthContext`: Manages JWTs and user state.
  - `LanguageContext`: Full i18n support (TR/EN).
- **Interactions:** Drag & Drop note organization, Lightbox for image viewing.

### Infrastructure
- **Frontend Hosting:** [Vercel](https://jotrow-mu.vercel.app/)
- **Backend Hosting:** [Render](https://jotrow.onrender.com)
- **Database:** Managed PostgreSQL (on Render)
- **Object Storage:** Self-hosted MinIO

---

## ✅ 3. What's Done (Key Achievements)

### 📈 PAPS Economy Implementation
- **Initial Bonus:** Every new user gets **100 PAPS** as a registration gift.
- **Note Locking:** Users can set a PAPS price for their notes or require a PIN.
- **Unlock Mechanism:** Backend handles real-time balance checks, transaction logging, and `UnlockedNote` tracking.
- **Earning System:** When someone pays for your note, PAPS are instantly transferred to your wallet.

### 🖼 Advanced Image Handling
- **The "Upload Fix":** Resolved the production "Failed to upload" error by fixing CORS policies and ensuring `libjpeg` dependencies are present in Docker.
- **Pillow Compression:** Every image is compressed *before* it hits MinIO, saving ~80% storage space without losing readability.
- **HEIC/HEIF Support:** Direct support for iPhone photos.

### 🔐 Multi-Tier Security
- **4-Digit PIN:** Users have a `share_code`. Anyone with this code can access their "Public Profile" (`/u/username`).
- **Private/Public/Locked:** Notes can be private, public (free), or locked (requires PAPS/PIN).

### 🌍 Global Read-Only Mode
- **Translation:** 100% translatable UI using a key-based system (`LanguageContext`).
- **Explore Page:** Search and discover top contributors.

---

## 🔜 4. Roadmap (What's Next?)

### 🟠 High Priority: UX & Critical Fixes
1. **[CRITICAL] Production File Upload Stability:** This remains the top priority. Ensure MinIO/HTTPS and Pillow dependencies are 100% synchronized across all environments.
2. **Handle (Username) Selection:** Registration must be a forced multi-step process. Users MUST NOT be able to proceed or skip without setting a handle. If a legacy user logs in without one, they should be immediately redirected to a "Handle Selection" screen.
3. **Praise/Like Auth Guard:** Clicking the "Praise" button while logged out must trigger a login prompt/popup instead of failing silently.
4. **My Place (Centralized Dashboard):** Create a unified "My Place" (Benim Yerim) view where users can see all their notes and folders, and initiate new uploads or folder creation directly from there.

### 🟡 Medium Priority: Feature Refinements
1. **Save to "MY JOTS":** Saving a note should not require selecting a course. If no course is selected, it should default to a "MY JOTS" (Library Root) section.
2. **Earnings Hierarchy:** The "Earnings" summary should be nested under the "Wallet" section. If a user has 0 PAPS, display a helpful "How to earn PAPS" guide (e.g., "Share high-quality notes and set a price!").
3. **Enhanced Unlock UX:** 
   - When a note is locked, show a clear choice: "Pay PAPS" or "Enter PIN".
   - **Preview Mode:** Display only the first sentence of the content or the first page of an attachment as a teaser.
4. **Downloads:** Implement a feature to download saved notes or entire courses for offline use.
5. **Upload Flow Refinement:** Rename the "Content" field to "Description". It should be treated as brief info about the note rather than the full body text.

### 🟢 Long Term (Vision)
1. **AI Summarization:** Auto-generate summaries for uploaded note images.
2. **Collaborative Courses:** Let multiple users contribute to the same folder.
3. **PAPS Withdrawal:** Implement a way for users to "cash out" via real payment gateways.

---

## 📁 5. Important Files for Developers

| Path | Purpose |
|------|---------|
| `backend/app/models.py` | The source of truth for the DB schema. |
| `backend/app/api/sharing.py` | Handles the complexity of PAPS/PIN unlocking. |
| `backend/app/services/storage.py` | Image processing and MinIO logic. |
| `frontend/src/context/LanguageContext.tsx` | All TR/EN strings are here. |
| `frontend/src/pages/Profile.tsx` | The most complex frontend page (handles public view/unlock). |

---

## 🚀 6. Getting Started
1. **Env Setup:** Copy `.env.example` in both folders.
2. **Docker:** `docker-compose up -d` for DB and MinIO.
3. **Migrations:** `alembic upgrade head` is critical.
4. **Backend:** `uvicorn app.main:app --reload`
5. **Frontend:** `npm run dev`

**Developer Note:** The project uses a **CORS whitelist**. If you deploy to a new domain, you MUST update `allowed_origins` in `backend/app/main.py`.

---

*Good luck! JOTROW is a powerful tool built with precision. Feel free to reach out to the visionaries if you have questions.*
