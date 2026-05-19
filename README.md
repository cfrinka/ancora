# OnTherapy

A secure, HIPAA-conscious journaling feed for patients and therapists.

## Stack
- **Frontend** – Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend** – Go (Chi router), JWT auth via HTTP-only cookies
- **Database** – PostgreSQL (Supabase or local Docker)

---

## Quick Start (Local Dev)

### 1. Database — Supabase
1. Create a free project at [supabase.com](https://supabase.com).
2. In the **SQL Editor**, run `backend/migrations/001_schema.sql` then `backend/migrations/002_seed.sql`.
3. Copy the **Connection String (URI)** from Project Settings → Database.

### 2. Backend
```bash
cd backend
cp .env.example .env
# Fill in DATABASE_URL and JWT_SECRET in .env
go mod tidy
go run ./cmd/server
```
Server starts on `http://localhost:8080`.

### 3. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```
App starts on `http://localhost:3000`.

---

## Default Admin Credentials
| Field    | Value                  |
|----------|------------------------|
| Email    | admin@ontherapy.com    |
| Password | Admin@1234!            |

> **Change the password immediately** after first login by updating the `password_hash` in the `users` table.  
> Generate a new bcrypt hash: `go run ./cmd/server` exposes no utility — use an online bcrypt tool (cost 12) or the snippet below:
> ```go
> hash, _ := bcrypt.GenerateFromPassword([]byte("NewPassword"), 12)
> fmt.Println(string(hash))
> ```

---

## Folder Structure
```
ontherapy/
├── backend/
│   ├── cmd/server/          # main.go + router.go
│   ├── internal/
│   │   ├── auth/            # JWT helpers
│   │   ├── config/          # env config loader
│   │   ├── handler/         # HTTP handlers
│   │   ├── middleware/       # Authenticate + RequireRole
│   │   ├── model/           # domain structs + DTOs
│   │   └── repository/      # pgx DB queries
│   ├── migrations/          # 001_schema.sql, 002_seed.sql
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── app/
│   │   ├── login/           # Login page
│   │   ├── patient/         # Patient journal feed
│   │   ├── therapist/       # Therapist consolidated feed
│   │   └── admin/           # Admin dashboard
│   ├── components/          # Navbar
│   ├── lib/                 # API client, AuthContext
│   ├── types/               # Shared TS types
│   ├── Dockerfile
│   └── .env.example
└── docker-compose.yml
```

---

## API Endpoints

| Method | Path | Role |
|--------|------|------|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/logout` | Authenticated |
| GET | `/api/auth/me` | Authenticated |
| GET | `/api/emotions` | Authenticated |
| GET | `/api/patient/posts` | Patient |
| POST | `/api/patient/posts` | Patient |
| GET | `/api/therapist/feed` | Therapist |
| GET | `/api/therapist/patients` | Therapist |
| GET/POST | `/api/admin/therapists` | Admin |
| GET | `/api/admin/patients` | Admin |
| PUT | `/api/admin/patients/{id}/assign` | Admin |
| GET/POST | `/api/admin/emotions` | Admin |
| PUT/DELETE | `/api/admin/emotions/{id}` | Admin |

---

## Docker (all services)
```bash
# Copy and fill both .env files first
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
docker compose up --build
```
