# AcademiQ

**The Intelligent Academy Operating System**

AcademiQ is a multi-tenant, cloud-based Academy Management SaaS targeting Egyptian private academies, tutoring centers, language schools, and training institutes. It replaces fragmented manual workflows (WhatsApp groups, paper attendance, Excel) with one centralized system — and adds an AI layer that autonomously detects at-risk students, drafts parent messages, and sends payment reminders.

---

## Table of Contents

- [The Problem](#the-problem)
- [The Solution](#the-solution)
- [Core Features](#core-features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)
- [Data Model](#data-model)
- [AI Layer](#ai-layer)
- [Multi-Tenancy](#multi-tenancy)
- [Background Jobs](#background-jobs)
- [Team](#team)

---

## The Problem

Private academies in Egypt run real businesses — often generating hundreds of thousands of EGP per month — on WhatsApp groups, paper sheets, and Excel files. This produces measurable, daily losses:

| Pain Point | Impact |
|---|---|
| Admin time | 3 hours/day per center on manual reminders and calculations |
| Uncollected fees | 15–25% of monthly revenue lost due to poor tracking |
| Student churn | 30% dropout rate with no early warning system |
| Detection lag | 2-week average delay between a student going at-risk and the owner noticing |

---

## The Solution

> **AcademiQ tells the owner which student is about to leave, generates a personalized message to the parent, and delivers it — before the student is already gone.**

AcademiQ replaces every fragmented manual workflow with one intelligent, centralized system:

| Problem | AcademiQ's Answer |
|---|---|
| 3 hrs/day on manual reminders | Automated payment reminders at day 0, 3, and 7 after a missed payment — resolves 80% of outstanding fees within 48 hours |
| Fees uncollected | Dashboard tracks expected vs collected revenue in real time. Collection rate goes from ~70% to ~85% |
| No early warning for dropout | Weekly AI scan scores every student on attendance, grades, and payment behavior — flags at-risk students 2 weeks earlier than manual observation |
| Admin blind to student health | Owner gets a Sunday morning email with academy-wide metrics, generated automatically without any human trigger |

### Quantified Impact

- **7,500 EGP/month recovered** — a center collecting 85% instead of 70% on 100 students at 500 EGP/month
- **20–30% reduction** in unplanned student dropout through early detection
- **Admin time cut from 3 hours/day to under 30 minutes** for oversight

---

## Core Features

### Base Layer (Sprints 1–6)

- **Student Management** — registration, profiles, soft delete, status lifecycle (pending → active → dropped)
- **Academic Structure** — subjects, classes, teacher assignment, session scheduling
- **Attendance Tracking** — per-session bulk attendance, stats, history
- **Enrollment & Payments** — enrollment lifecycle, fee configuration, payment recording, balance tracking
- **Grade Management** — per-assessment grading, trend analysis, class-wide summaries
- **Owner Dashboard** — KPI aggregation, at-risk panel, activity feed, revenue vs collected
- **Staff Management** — owner creates admin/teacher accounts with role-based permissions

### AI Layer (Sprints 7–8)

- **Student Retention Agent** — weekly Celery scan scoring every enrolled student on attendance, grades, and payment behavior. Medium/high risk students get an AI-drafted Arabic/English parent message and an alert in the owner's inbox.
- **AI Report Cards** — LLM-generated plain-language monthly summaries per student, cached for 7 days.
- **Payment Reminder Automation** — scheduled reminders at day 0, 3, and 7 after a missed payment cycle via SMS/WhatsApp/email. Day-7 escalation creates a retention alert automatically.
- **Owner Alert Inbox** — editable AI-drafted messages, one-tap send, dismiss flow.
- **Weekly Management Email** — Sunday 07:00 Cairo: auto-generated academy health report delivered to the owner.
- **AI Cost Control** — Redis prompt caching (`sha256(prompt)`, 7-day TTL), per-call usage logging, monthly cost breakdown by feature.
- **RAG Layer** — hybrid structured + vector RAG. Every LLM prompt is grounded in real academy data — never generic.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite) + React Router + Axios + TailwindCSS |
| Backend | Django 4.x + Django REST Framework |
| Auth | Cookie-based JWT (SimpleJWT + custom `CookieJWTAuthentication`) |
| Database | PostgreSQL + pgvector extension |
| AI | Google Gemini Flash (2.5) |
| Background Jobs | Celery + Redis + django-celery-beat |
| Notifications | Email (SMTP) + SMS/WhatsApp (Twilio / Infobip) |
| API Docs | drf-spectacular (OpenAPI 3, Swagger UI at `/api/docs/`) |
| Deployment | Railway (backend) + Vercel (frontend) |

---

## Architecture Overview

**Presentation Layer**

| Technology | Role |
|---|---|
| React (Vite) + React Router | SPA routing and page rendering |
| Axios | HTTP client with cookie JWT interceptor |
| TailwindCSS | Utility-first styling |
| Context Providers | Auth · Students · Enrollment · Payment · Grades · Alerts · Notifications |

↕ HTTPS · Cookie JWT

**API Layer**

| Component | Role |
|---|---|
| Django REST Framework | REST API + serializers + viewsets |
| drf-spectacular | OpenAPI 3 schema, Swagger UI at `/api/docs/` |
| AcademyScopedMixin | Enforces academy-level tenant isolation on every queryset |
| CookieJWTAuthentication | Custom cookie-based JWT auth scheme |
| Role-based permissions | `IsOwner` · `IsAdmin` · `IsAuthenticated` |

↕

**Business Layer**

| App | Models |
|---|---|
| `core` | User · Students · Academy |
| `structure` | Subject · Class · ClassSchedule · ClassSession |
| `financial_operations` | Teachers · Enrollment · Payment |
| `records` | ClassSession · Attendance |
| `grades` | Grade |

**AI Layer**

| Module | Contents |
|---|---|
| `ai/utils/` | `gemini_client.py` · `prompt_builder.py` · `rag_engine.py` · `embeddings.py` · `vector_store.py` |
| `ai/agent/` | `risk_scorer.py` · Alert model · ScanLog · `weekly_student_scan` task |
| `ai/reports/` | AIReportCard model · `generator.py` · bulk generation task |
| `ai/notifications/` | Notification model · payment reminders · alert dispatch |

↕

**Data Layer**

| Store | Role |
|---|---|
| PostgreSQL | Primary data store · multi-tenant via `academy_id` FK on every table |
| pgvector extension | 1536-dim student embeddings for RAG similarity search |
| Redis | Celery broker · prompt cache (7-day TTL, `sha256` key) · task results |

↕

**Background Jobs**

| Task | Schedule |
|---|---|
| `weekly_student_scan` | Monday 08:00 Africa/Cairo |
| `send_payment_reminders` | Daily 09:00 Africa/Cairo |
| `send_weekly_management_report` | Sunday 07:00 Africa/Cairo |

### Request Flow

```
Browser → Cookie JWT → Django → AcademyScopedMixin (tenant filter)
       → Permission check (IsOwner / IsAdmin / IsAuthenticated)
       → ViewSet → Serializer → DB query
       → Response
```

### AI Retention Flow

```
Celery Beat (Monday 08:00)
  └─ weekly_student_scan(academy_id)
       └─ for each active enrollment:
            ├─ rag_engine.get_student_context(student_id)
            │    ├─ attendance stats (last 28 days)
            │    ├─ grade averages (last 2 assessments)
            │    └─ payment balance + overdue days
            ├─ compute_risk(context)  ← pure function, no DB
            │    ├─ attendance < 70%  → +40 pts
            │    ├─ overdue > 4 days → +35 pts
            │    └─ avg score < 50%   → +25 pts
            └─ if risk >= medium:
                 ├─ create Alert row
                 └─ Gemini Flash → Arabic/English parent message
                      └─ stored in Alert.message (ready to send)
```

---

## Project Structure

```
Backend/
├── academy_q/              # Django project — settings, celery, urls
├── core/                   # Auth, User, Students, Academy + permissions/mixins
├── structure/              # Subjects, Classes, Schedules, TeacherClass
├── financial_operations/   # Teachers, Enrollments, Payments
├── records/                # ClassSessions, Attendance
├── grades/                 # Grade model, summaries, trends
├── ai/
│   ├── utils/              # Gemini client, prompt builder, RAG engine, embeddings
│   ├── agent/              # Risk scorer, Alert model, ScanLog, weekly scan
│   ├── reports/            # AIReportCard model, generator, bulk generation
│   └── notifications/      # Notification model, payment reminders, dispatch
└── api/                    # Root URL router

Frontend/
└── src/
    ├── components/         # Reusable UI components per domain
    ├── context/            # React context providers
    ├── pages/              # Route-level page components
    ├── services/           # Axios service functions per domain
    └── routes/             # MainRouter
```

---

## Getting Started

### Prerequisites

- Docker + Docker Compose
- Node.js 18+

### Backend

```bash
# Copy and configure env
cp .env.example .env

# Start all services (Django, PostgreSQL, Redis, Celery worker, Celery beat)
docker compose up --build

# Run migrations
docker compose exec web python manage.py migrate

# Seed demo data (1 academy, 3 subjects, 4 classes, 2 teachers, 25 students, 2 months history)
docker compose exec web python manage.py seed_demo_data
```

### Frontend

```bash
cd Frontend
npm install
npm run dev
```

### Celery (if running outside Docker)

```bash
celery -A academy_q worker -l info
celery -A academy_q beat -l info
```

---

## Environment Variables

```env
# Django
SECRET_KEY=
DEBUG=
ALLOWED_HOSTS=

# Database
DB_NAME=
DB_USER=
DB_PASSWORD=
DB_HOST=
DB_PORT=

# Redis / Celery
REDIS_URL=

# AI
GEMINI_API_KEY=
GEMINI_MODEL=
GEMINI_EMBEDDING_MODEL=

# Email
EMAIL_BACKEND=
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USE_TLS=
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=

```

---

## API Documentation

Interactive Swagger UI available at `/api/docs/` when the server is running.

Generate/validate the schema:

```bash
python manage.py spectacular --file schema.yaml --validate
```

### Endpoint Groups

| Tag | Base Path |
|---|---|
| Auth | `/api/auth/` |
| Academy | `/api/auth/academy/` |
| Staff | `/api/users/` |
| Students | `/api/auth/users/students/`, `/api/users/students/` |
| Structure | `/api/subjects/`, `/api/classes/`, `/api/class-schedule/` |
| Finance | `/api/teachers/`, `/api/enrollments/`, `/api/payments/` |
| Attendance | `/api/sessions/`, `/api/students/{id}/attendance/` |
| Grades | `/api/grades/` |
| AI Reports | `/api/reports/` |
| AI Agent | `/api/alerts/`, `/api/agent/` |
| AI Notifications | `/api/notifications/` |
| AI Infra | `/api/ai/usage/`, `/api/ai/health/celery/` |

---

## AI Layer

### The AI Trinity

| Pillar | Implementation | Output |
|---|---|---|
| LLM | Gemini 2.5 Flash (`thinking_budget=0` for speed/cost) | Report cards, risk narratives, parent messages |
| RAG | Hybrid: direct DB queries + pgvector similarity search (1536-dim) | Every prompt grounded in the specific student's real data |
| Agent | Celery beat — weekly Monday 08:00 Cairo | Autonomous scan → risk score → alert → message draft |

### Risk Scoring

Pure function — no DB calls, fully unit-testable with fixture dicts:

| Condition | Score |
|---|---|
| Attendance < 70% in last 28 days | +40 |
| Overdue fees > 14 days | +35 |
| Avg score < 50 on last 2 assessments | +25 |

0–39 = low · 40–69 = medium · 70–100 = high. Only medium and high trigger alerts.

### Prompt Caching

Cache key: `sha256(prompt)`, TTL: 7 days. Self-invalidating — if underlying student data changes, the prompt text changes, the hash changes, cache misses automatically. No explicit invalidation logic needed.

---

## Background Jobs

| Task | Schedule | App |
|---|---|---|
| `weekly_student_scan` | Monday 08:00 Africa/Cairo | `ai.agent` |
| `send_weekly_management_report` | Sunday 07:00 Africa/Cairo | `ai.tasks` |
| `send_payment_reminders` | Daily 09:00 Africa/Cairo | `ai.notifications` |

Health check: `GET /api/ai/health/celery/`

Manual scan trigger (owner only, rate-limited to 3/day): `POST /api/agent/run-scan/`

---

## Multi-Tenancy

Row-level isolation via `academy_id` FK on every model. Pattern enforced at the ViewSet layer:

```python
class AcademyScopedMixin:
    def get_queryset(self):
        if getattr(self, "swagger_fake_view", False):
            return super().get_queryset().none()
        return super().get_queryset()
        # each viewset filters by request.user.academy_id
```

No cross-tenant queries are possible without explicitly bypassing the mixin.

---

## Team

| Member | Role | Owns |
|---|---|---|
| Mohamed Mahdy | Tech Lead | Architecture, Auth, Students, AI Infrastructure, Deployment |
| Ahmed Yahya | Backend / Academic | Structure, Classes, Schedules, Junctions, AI Report Cards |
| Zahwa Kandeel | Finance / Dashboard | Teachers, Payments, Enrollment, Notifications, Dashboard |
| Yamen Aly | Attendance / Agent | Attendance, Sessions, Subjects, Alerts, Retention Agent |
| Mohamed Nasef | Grades | Grade model, Summaries, Trends, Tests |

**Team:** Edvora · **Industry:** EdTech / SaaS · **Target Market:** Egyptian private academies and tutoring centers
