# AcademiQ — Full API Documentation

**Base URL:** `http://127.0.0.1:8000/api`  
**Production URL:** `https://api.academiq.app/api`  
**Auth:** JWT Bearer Token — include `Authorization: Bearer <access_token>` on every protected endpoint  
**Content-Type:** `application/json` on all requests and responses  
**Team:** Edvora  

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Academy Owner](#2-academy-owner)
3. [Users](#3-users)
4. [Students](#4-students)
5. [Teachers](#5-teachers)
6. [Subjects](#6-subjects)
7. [Classes](#7-classes)
8. [Teacher–Class Assignment](#8-teacherclass-assignment)
9. [Enrollment](#9-enrollment)
10. [Payments](#10-payments)
11. [Sessions](#11-sessions)
12. [Attendance](#12-attendance)
13. [Grades](#13-grades)
14. [Dashboard & Aggregation](#14-dashboard--aggregation)
15. [Error Reference](#15-error-reference)
16. [Frontend Mapping Summary](#16-frontend-mapping-summary)

---

## Conventions

```
PK   — Primary Key (UUID)
FK   — Foreign Key
?    — Optional query parameter
*    — Required field in request body
[R]  — Read-only field in response
```

**Owner legend:**  
`[Mahdy]` `[Yahya]` `[Zahwa]` `[Yamen]` `[Nasef]`

---

---

## 1. Authentication

**Owner: Mahdy**  
All auth endpoints are public (no token required).

---

### POST `/auth/register/`

Creates a new `academy_owner` record and the first `Users` record (role = `owner`) in a single transaction.

**Request body:**
```json
{
  "academy_name": "Rainbow Academy",      // *
  "academy_email": "owner@rainbow.com",   // *
  "academy_password": "securepass123",    // *
  "academy_phone": "01012345678",         // *
  "full_name": "Mohamed Ali",
  "email": "mohamed@gmail.com",            // *
  "phone": "01098765432",
  "password": "123456",                    // *
}
```

**Response `201`:**
```json
{
  "academy_id": "uuid",
  "academy_name": "Rainbow Academy",
  "owner_user_id": "uuid",
  "access": "eyJhbGci...",
  "refresh": "eyJhbGci..."
}
```

**Frontend link:**  
→ `RegisterPage` (`/register`) — initial onboarding form. On success: store tokens, redirect to `/dashboard`.

---

### POST `/auth/login/`

Authenticates against either `academy_owner` (owner login) or `Users` table (staff login). Returns JWT pair.

**Request body:**
```json
{
  "email": "owner@rainbow.com",   // *
  "password": "securepass123"     // *
}
```

**Response `200`:**
```json
{
  "access": "eyJhbGci...",
  "refresh": "eyJhbGci...",
  "user": {
    "id": "uuid",
    "name": "Mohamed Ali",
    "role": "owner",
    "academy_id": "uuid",
    "academy_name": "Rainbow Academy"
  }
}
```

**Response `401`:**
```json
{ "detail": "Invalid credentials." }
```

**Frontend link:**  
→ `LoginPage` (`/login`) — email + password form. On success: store `access` + `refresh` in localStorage, store `user` object in `AcademyContext`, redirect to `/dashboard`.

---

### POST `/auth/token/refresh/`

Returns a new access token using a valid refresh token.

**Request body:**
```json
{ "refresh": "eyJhbGci..." }   // *
```

**Response `200`:**
```json
{ "access": "eyJhbGci..." }
```

**Response `401`:**
```json
{ "detail": "Token is invalid or expired." }
```

**Frontend link:**  
→ `axiosClient` interceptor — called automatically by the Axios response interceptor when any request returns `401`. If refresh also fails, clears tokens and redirects to `/login`. **Not triggered by a user action.**

---

### POST `/auth/logout/`

Blacklists the refresh token. Requires valid access token.

**Request body:**
```json
{ "refresh": "eyJhbGci..." }   // *
```

**Response `205`:** Empty body.

**Frontend link:**  
→ Topbar logout button → `handleLogout()` — clears localStorage tokens, calls this endpoint, redirects to `/login`.

---

---

## 2. Academy Owner

**Owner: Mahdy**

---

### GET `/academy/`

Returns the current academy's profile. Scoped to `request.user.academy_id`.

**Response `200`:**
```json
{
  "id": "uuid",                          // [R]
  "academy_name": "Rainbow Academy",
  "academy_email": "owner@rainbow.com",
  "academy_phone": "01012345678",
  "created_at": "2025-09-01T10:00:00Z", // [R]
  "subscription_end": "2026-09-01",
  "is_active": true                      // [R]
}
```

**Frontend link:**  
→ `AcademyContext` — called once on app load after login. Populates the academy name shown in the topbar and sidebar header. Also read by `DashboardPage` for the subscription expiry warning banner.

---

### PATCH `/academy/`

Updates the current academy's profile. Owner role only.

**Request body (all optional):**
```json
{
  "academy_name": "Rainbow Academy Updated",
  "academy_phone": "01099999999"
}
```

**Response `200`:** Updated academy object (same shape as GET).

**Frontend link:**  
→ `SettingsPage` (`/settings`) — Academy Profile section. Edit form with save button.

---

---

## 3. Users

**Owner: Mahdy**  
Covers staff accounts (admin, receptionist). Student and teacher user accounts are created via their own endpoints.

---

### GET `/users/`

Lists all staff users in the academy.

**Query params:**
```
?role=admin|receptionist     — filter by role
?search=name_or_email        — search by name or email
```

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "name": "Sara Ahmed",
    "email": "sara@rainbow.com",
    "phone": "01011112222",
    "role": "admin",
    "is_active": true,
    "created_at": "2025-09-01T10:00:00Z"  // [R]
  }
]
```

**Frontend link:**  
→ `UsersPage` (`/users`) — staff list table with role badge and status toggle.

---

### POST `/users/`

Creates a new staff user account.

**Request body:**
```json
{
  "name": "Sara Ahmed",            // *
  "email": "sara@rainbow.com",     // *
  "password": "temppass123",       // *
  "phone": "01011112222",
  "role": "admin"                  // * — admin | receptionist
}
```

**Response `201`:** Created user object.

**Frontend link:**  
→ `UsersPage` → Add Staff button → `AddUserModal` — form for name, email, temp password, role selector.

---

### GET `/users/{id}/`

Returns a single user's detail.

**Response `200`:** Single user object.

**Frontend link:**  
→ `UserDetailModal` — opened by clicking a user row in `UsersPage`.

---

### PATCH `/users/{id}/`

Updates a user's details. Cannot change `email` (unique login identifier).

**Request body (all optional):**
```json
{
  "name": "Sara Mohamed",
  "phone": "01099988877",
  "role": "receptionist",
  "is_active": false
}
```

**Response `200`:** Updated user object.

**Frontend link:**  
→ `UserDetailModal` edit form → save button. Setting `is_active: false` deactivates the account without deleting it.

---

---

## 4. Students

**Owner: Mahdy**

---

### GET `/students/`

Lists all students in the academy.

**Query params:**
```
?status=active|paused|dropped     — filter by status
?search=name                       — search by first or last name
?educational_level=3               — filter by level
```

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "academy_id": "uuid",           // [R]
    "user_id": "uuid",              // [R] — linked Users account
    "name": "Ahmed Mohamed",        // [R] computed from first+last
    "parent_phone": "01022223333",
    "educational_level": 7,
    "status": "active",
    "enrolled_at": "2025-09-01",
    "update_at": "2025-10-15T08:22:00Z",  // [R]
    "enrollment_count": 2,          // [R] annotated
    "overdue_payments_count": 1     // [R] annotated
  }
]
```

**Frontend link:**  
→ `StudentListPage` (`/students`) — main student table. `enrollment_count` shown as badge. `overdue_payments_count > 0` triggers a red warning badge on the row.

---

### POST `/students/`

Creates a `Users` account and a `Students` profile in a single transaction.

**Request body:**
```json
{
  "first_name": "Ahmed",          // *
  "last_name": "Mohamed",         // *
  "email": "ahmed@example.com",   // * — becomes login email
  "password": "temppass123",      // *
  "parent_phone": "01022223333",  // *
  "educational_level": 7,         // *
  "status": "active"              // default: active
}
```

**Response `201`:** Created student object with `user_id` and `id`.

**Frontend link:**  
→ `StudentListPage` → Add Student button → `StudentFormModal` — full creation form.

---

### GET `/students/{id}/`

Returns full student detail, annotated with live computed fields.

**Response `200`:**
```json
{
  "id": "uuid",
  "name": "Ahmed Mohamed",
  "parent_phone": "01022223333",
  "educational_level": 7,
  "status": "active",
  "enrolled_at": "2025-09-01",
  "update_at": "2025-10-15T08:22:00Z",
  "enrollment_count": 2,
  "total_paid": "1500.00",
  "overdue_payments_count": 1,
  "attendance_pct_overall": 82.5
}
```

**Frontend link:**  
→ `StudentProfilePage` (`/students/:id`) — header section showing all summary badges. Also called by `StudentFormModal` when in edit mode.

---

### PATCH `/students/{id}/`

Updates student fields. Does not update the linked `Users` account (use `/users/{id}/` for that).

**Request body (all optional):**
```json
{
  "parent_phone": "01099887766",
  "educational_level": 8,
  "status": "paused"
}
```

**Response `200`:** Updated student object.

**Frontend link:**  
→ `StudentFormModal` in edit mode (opened from `StudentProfilePage` edit button) → save button.

---

### DELETE `/students/{id}/`

Soft delete — sets `status = dropped`. **Never removes the row.** All historical records are preserved.

**Response `204`:** Empty body.

**Frontend link:**  
→ `StudentProfilePage` → dropdown menu → Drop Student → confirmation dialog → confirm button.

---

---

## 5. Teachers

**Owner: Zahwa**

---

### GET `/teachers/`

Lists all teachers in the academy.

**Query params:**
```
?search=name     — search by name
```

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",              // [R]
    "name": "Dr. Fatma Hassan",     // [R] from Users
    "email": "fatma@rainbow.com",   // [R] from Users
    "rate_per_session": "150.00",
    "session_duration": "01:30:00",
    "assigned_class_count": 3,      // [R] annotated
    "sessions_this_month": 12       // [R] annotated
  }
]
```

**Frontend link:**  
→ `TeachersPage` (`/teachers`) — teachers list with rate badge and class count.

---

### POST `/teachers/`

Creates a `Users` account (role = `teacher`) and a `Teachers` profile in a single transaction.

**Request body:**
```json
{
  "name": "Dr. Fatma Hassan",       // *
  "email": "fatma@rainbow.com",     // *
  "password": "temppass123",        // *
  "phone": "01033334444",
  "rate_per_session": "150.00",     // *
  "session_duration": "01:30:00"    // * — HH:MM:SS
}
```

**Response `201`:** Created teacher object.

**Frontend link:**  
→ `TeachersPage` → Add Teacher button → `TeacherFormModal`.

---

### GET `/teachers/{id}/`

Teacher detail with assigned classes and session history.

**Response `200`:**
```json
{
  "id": "uuid",
  "name": "Dr. Fatma Hassan",
  "email": "fatma@rainbow.com",
  "phone": "01033334444",
  "rate_per_session": "150.00",
  "session_duration": "01:30:00",
  "assigned_classes": [
    { "class_id": "uuid", "class_name": "Math G7 Mon/Wed", "subject": "Mathematics" }
  ],
  "sessions_this_month": 12
}
```

**Frontend link:**  
→ `TeacherDetailModal` — opened by clicking a teacher row in `TeachersPage`.

---

### PATCH `/teachers/{id}/`

Updates teacher profile fields.

**Request body (all optional):**
```json
{
  "rate_per_session": "175.00",
  "session_duration": "02:00:00"
}
```

**Response `200`:** Updated teacher object.

**Frontend link:**  
→ `TeacherDetailModal` edit form → save button.

---

### DELETE `/teachers/{id}/`

Soft deactivate — sets the linked `Users.is_active = false`.

**Response `204`:** Empty body.

**Frontend link:**  
→ `TeacherDetailModal` → Deactivate button → confirmation dialog.

---

---

## 6. Subjects

**Owner: Yahya**

---

### GET `/subjects/`

Lists all subjects in the academy.

**Query params:**
```
?is_active=true|false     — filter by active status
?search=name              — search by name
```

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "name": "Mathematics",
    "description": "Core mathematics curriculum",
    "session_count": 24,
    "is_active": true,
    "class_count": 3    // [R] annotated — number of classes using this subject
  }
]
```

**Frontend link:**  
→ `SubjectsPage` (`/subjects`) — subject catalog list with `session_count` badge and `class_count` badge.

---

### POST `/subjects/`

Creates a new subject.

**Request body:**
```json
{
  "name": "Mathematics",              // *
  "description": "Core curriculum",
  "session_count": 24                 // *
}
```

**Response `201`:** Created subject object.

**Frontend link:**  
→ `SubjectsPage` → Add Subject button → `SubjectFormModal`.

---

### GET `/subjects/{id}/`

Subject detail.

**Response `200`:** Single subject object including `class_count`.

**Frontend link:**  
→ `SubjectDetailModal` — opened by clicking a subject row.

---

### PATCH `/subjects/{id}/`

Updates subject fields.

**Request body (all optional):**
```json
{
  "name": "Advanced Mathematics",
  "session_count": 30,
  "is_active": false
}
```

**Response `200`:** Updated subject object.

**Frontend link:**  
→ `SubjectFormModal` in edit mode → save button.

---

### DELETE `/subjects/{id}/`

Soft deactivate — sets `is_active = false`. Cannot delete if active classes depend on it.

**Response `204`:** Empty body.  
**Response `400`:** `{ "detail": "Cannot deactivate subject with active classes." }`

**Frontend link:**  
→ `SubjectDetailModal` → Deactivate button → confirmation dialog.

---

---

## 7. Classes

**Owner: Yahya**

---

### GET `/classes/`

Lists all classes in the academy.

**Query params:**
```
?subject_id=uuid          — filter by subject
?is_active=true|false     — filter by active status
?teacher_id=uuid          — filter by assigned teacher
```

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "name": "Math G7 Mon/Wed 4pm",
    "subject_id": "uuid",
    "subject_name": "Mathematics",        // [R]
    "session_time": "16:00:00",
    "start_date": "2025-09-01",
    "end_date": "2026-01-31",
    "is_active": true,
    "enrolled_count": 18,                 // [R] annotated
    "sessions_completed": 10,             // [R] annotated
    "session_count": 24,                  // [R] from subject
    "teachers": [                         // [R] from teacher_class
      { "teacher_id": "uuid", "name": "Dr. Fatma Hassan" }
    ]
  }
]
```

**Frontend link:**  
→ `ClassListPage` (`/classes`) — class cards layout. Progress bar uses `sessions_completed / session_count`.

---

### POST `/classes/`

Creates a new class.

**Request body:**
```json
{
  "name": "Math G7 Mon/Wed 4pm",   // *
  "subject_id": "uuid",            // *
  "session_time": "16:00:00",      // *
  "start_date": "2025-09-01",      // *
  "end_date": "2026-01-31"         // *
}
```

**Response `201`:** Created class object.

**Frontend link:**  
→ `ClassListPage` → Add Class button → `ClassFormModal`.

---

### GET `/classes/{id}/`

Class detail with enrolled students, sessions progress, and assigned teachers.

**Response `200`:**
```json
{
  "id": "uuid",
  "name": "Math G7 Mon/Wed 4pm",
  "subject_id": "uuid",
  "subject_name": "Mathematics",
  "session_time": "16:00:00",
  "start_date": "2025-09-01",
  "end_date": "2026-01-31",
  "is_active": true,
  "enrolled_count": 18,
  "sessions_completed": 10,
  "session_count": 24,
  "teachers": [
    { "teacher_id": "uuid", "name": "Dr. Fatma Hassan", "assigned_at": "2025-09-01" }
  ]
}
```

**Frontend link:**  
→ `ClassDetailPage` (`/classes/:id`) — header section. Four tabs rendered below: Students (Zahwa), Sessions (Yamen), Grades (Nasef), Teachers (Yahya).

---

### GET `/classes/{id}/students/`

Lists all students currently enrolled in this class. Read-only join across `Enrollment` (Zahwa's table).

**Response `200`:**
```json
[
  {
    "enrollment_id": "uuid",
    "student_id": "uuid",
    "student_name": "Ahmed Mohamed",
    "enrollment_status": "active",
    "fee_amount": "500.00",
    "payment_cycle": "2025-10-01"
  }
]
```

**Frontend link:**  
→ `ClassDetailPage` → Students tab — enrolled students list. Zahwa's `EnrollStudentButton` is placed here by Yahya's shell; it calls `POST /enrollments/` which is Zahwa's endpoint.

---

### PATCH `/classes/{id}/`

Updates class fields.

**Request body (all optional):**
```json
{
  "name": "Math G7 Updated",
  "session_time": "17:00:00",
  "end_date": "2026-02-28",
  "is_active": false
}
```

**Response `200`:** Updated class object.

**Frontend link:**  
→ `ClassDetailPage` → Edit button → `ClassFormModal` in edit mode.

---

---

## 8. Teacher–Class Assignment

**Owner: Yahya**  
Uses the `teacher_class` junction table.

---

### GET `/classes/{id}/teachers/`

Lists all teachers assigned to a class.

**Response `200`:**
```json
[
  {
    "assignment_id": "uuid",
    "teacher_id": "uuid",
    "teacher_name": "Dr. Fatma Hassan",
    "rate_per_session": "150.00",
    "assigned_at": "2025-09-01"
  }
]
```

**Frontend link:**  
→ `ClassDetailPage` → Teachers tab — assigned teachers list.

---

### POST `/teacher-class/`

Assigns a teacher to a class.

**Request body:**
```json
{
  "class_id": "uuid",    // *
  "teacher_id": "uuid"   // *
}
```

**Response `201`:**
```json
{
  "assignment_id": "uuid",
  "class_id": "uuid",
  "teacher_id": "uuid",
  "teacher_name": "Dr. Fatma Hassan",
  "assigned_at": "2025-10-15"     // [R] auto today
}
```

**Response `400`:** `{ "detail": "Teacher already assigned to this class." }`

**Frontend link:**  
→ `ClassDetailPage` → Teachers tab → Assign Teacher button → teacher search dropdown → confirm.

---

### DELETE `/teacher-class/{assignment_id}/`

Removes a teacher assignment from a class.

**Response `204`:** Empty body.

**Frontend link:**  
→ `ClassDetailPage` → Teachers tab → remove button on each assignment row → confirmation dialog.

---

---

## 9. Enrollment

**Owner: Zahwa**

---

### GET `/enrollments/`

Lists enrollments. Must supply at least one filter.

**Query params:**
```
?student_id=uuid           — all enrollments for a student
?class_id=uuid             — all enrollments in a class
?status=active|paused|dropped|completed
```

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "student_id": "uuid",
    "student_name": "Ahmed Mohamed",   // [R]
    "class_id": "uuid",
    "class_name": "Math G7 Mon/Wed",   // [R]
    "fee_amount": "500.00",
    "payment_cycle": "2025-10-01",
    "start_date": "2025-09-01",
    "end_date": "2026-01-31",
    "status": "active",
    "total_paid": "1000.00",           // [R] annotated
    "balance_due": "500.00"            // [R] annotated
  }
]
```

**Frontend link:**  
→ `StudentProfilePage` → Enrollment tab (Zahwa's component): calls `?student_id=:id`  
→ `ClassDetailPage` → Students tab (Yahya's shell): calls `?class_id=:id` via `GET /classes/{id}/students/`

---

### POST `/enrollments/`

Enrolls a student in a class.

**Request body:**
```json
{
  "student_id": "uuid",           // *
  "class_id": "uuid",             // *
  "fee_amount": "500.00",         // *
  "payment_cycle": "2025-10-01",  // * — day-of-month due date
  "start_date": "2025-09-01",     // *
  "end_date": "2026-01-31"        // *
}
```

**Response `201`:** Created enrollment object.

**Response `400`:** `{ "detail": "Student is already enrolled in this class." }`

**Frontend link:**  
→ `ClassDetailPage` → Students tab → Enroll Student button → `EnrollStudentModal` (search student, set fee, set dates, confirm).  
→ `StudentProfilePage` → Enrollment tab → Enroll in Class button → same modal with student pre-filled.

---

### GET `/enrollments/{id}/`

Enrollment detail with payment history.

**Response `200`:**
```json
{
  "id": "uuid",
  "student_name": "Ahmed Mohamed",
  "class_name": "Math G7 Mon/Wed",
  "fee_amount": "500.00",
  "payment_cycle": "2025-10-01",
  "start_date": "2025-09-01",
  "end_date": "2026-01-31",
  "status": "active",
  "total_paid": "1000.00",
  "balance_due": "500.00",
  "payments": [
    { "id": "uuid", "amount": "500.00", "paid_on": "2025-09-05", "notes": "" },
    { "id": "uuid", "amount": "500.00", "paid_on": "2025-10-03", "notes": "" }
  ]
}
```

**Frontend link:**  
→ `StudentProfilePage` → Enrollment tab → click enrollment row → `EnrollmentDetailModal`.

---

### PATCH `/enrollments/{id}/`

Updates enrollment status or fee terms.

**Request body (all optional):**
```json
{
  "status": "paused",
  "fee_amount": "450.00",
  "end_date": "2025-12-31"
}
```

**Response `200`:** Updated enrollment object.

**Frontend link:**  
→ `EnrollmentDetailModal` → status change buttons (Pause / Drop / Complete) and edit fee form.

---

---

## 10. Payments

**Owner: Zahwa**

---

### GET `/payments/`

Lists payment records.

**Query params:**
```
?enrollment_id=uuid     — payments for a specific enrollment
?student_id=uuid        — all payments for a student across all enrollments
?month=2025-10          — filter by month (YYYY-MM)
```

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "enrollment_id": "uuid",
    "student_name": "Ahmed Mohamed",   // [R]
    "class_name": "Math G7 Mon/Wed",   // [R]
    "amount": "500.00",
    "paid_on": "2025-10-03",
    "notes": "Cash payment",
    "created_at": "2025-10-03T11:22:00Z"  // [R]
  }
]
```

**Frontend link:**  
→ `StudentProfilePage` → Payments tab: calls `?student_id=:id`  
→ `PaymentsPage` (`/payments`): calls `?month=current_month` for monthly overview

---

### POST `/payments/`

Records a payment against an enrollment. Updates the enrollment's `balance_due`.

**Request body:**
```json
{
  "enrollment_id": "uuid",   // *
  "amount": "500.00",        // *
  "paid_on": "2025-10-03",   // * — date of payment
  "notes": "Cash payment"
}
```

**Response `201`:** Created payment object.

**Frontend link:**  
→ `StudentProfilePage` → Payments tab → Record Payment button → `RecordPaymentModal` (amount, date, notes).  
→ `PaymentsPage` → overdue row → Record Payment button → same modal with enrollment pre-filled.

---

### GET `/payments/summary/`

Academy-level financial summary. Used for dashboard KPI cards.

**Query params:**
```
?month=2025-10     — defaults to current month (YYYY-MM)
```

**Response `200`:**
```json
{
  "month": "2025-10",
  "revenue_expected": "12500.00",
  "revenue_collected": "10500.00",
  "collection_rate_pct": 84.0,
  "overdue_count": 5,
  "overdue_total": "2000.00"
}
```

**Frontend link:**  
→ `DashboardPage` — Revenue KPI card, Collection Rate card, Overdue Payments card. Called on dashboard mount and on month selector change.

---

---

## 11. Sessions

**Owner: Yamen**

---

### GET `/sessions/`

Lists sessions for a class.

**Query params:**
```
?class_id=uuid     — * required
?ordering=-session_num     — default: newest first
```

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "class_id": "uuid",
    "session_num": 10,
    "session_date": "2025-10-14",
    "notes": "Covered chapter 5",
    "present_count": 15,    // [R] annotated
    "absent_count": 3,      // [R] annotated
    "total_enrolled": 18,   // [R] annotated
    "turnout_pct": 83.3     // [R] annotated
  }
]
```

**Frontend link:**  
→ `ClassDetailPage` → Sessions tab (Yamen's component): calls `?class_id=:id`. Each row links to `AttendanceMarkingPage`.

---

### POST `/sessions/`

Creates a new session for a class. `session_num` is auto-calculated as `max(session_num) + 1` for that class.

**Request body:**
```json
{
  "class_id": "uuid",         // *
  "session_date": "2025-10-14",   // *
  "notes": "Covered chapter 5"
}
```

**Response `201`:** Created session object with auto-assigned `session_num`.

**Response `400`:** `{ "detail": "A session already exists for this class on this date." }`

**Frontend link:**  
→ `ClassDetailPage` → Sessions tab → New Session button → `NewSessionModal` (date picker + notes).

---

### GET `/sessions/{id}/`

Session detail with attendance summary.

**Response `200`:**
```json
{
  "id": "uuid",
  "class_id": "uuid",
  "class_name": "Math G7 Mon/Wed",
  "session_num": 10,
  "session_date": "2025-10-14",
  "notes": "Covered chapter 5",
  "present_count": 15,
  "absent_count": 3,
  "total_enrolled": 18,
  "turnout_pct": 83.3
}
```

**Frontend link:**  
→ `AttendanceMarkingPage` (`/classes/:id/attendance/:session_id`) — header section showing session info before the attendance grid.

---

### GET `/classes/{id}/attendance/summary/`

Per-session turnout summary for a class over its lifetime.

**Response `200`:**
```json
{
  "class_id": "uuid",
  "class_name": "Math G7 Mon/Wed",
  "sessions_completed": 10,
  "session_count": 24,
  "average_turnout_pct": 85.5,
  "sessions": [
    { "session_num": 1, "session_date": "2025-09-03", "turnout_pct": 100.0 },
    { "session_num": 2, "session_date": "2025-09-08", "turnout_pct": 88.9 }
  ]
}
```

**Frontend link:**  
→ `ClassDetailPage` → Sessions tab — summary bar at the top showing overall turnout and progress.

---

---

## 12. Attendance

**Owner: Yamen**

---

### POST `/sessions/{id}/attendance/`

Bulk creates or updates attendance records for a session. Safe to call multiple times — uses `update_or_create` internally so corrections do not create duplicates.

**Request body:**
```json
{
  "records": [
    { "enrollment_id": "uuid", "present": true },
    { "enrollment_id": "uuid", "present": false },
    { "enrollment_id": "uuid", "present": true }
  ]
}
```

**Response `200`:**
```json
{
  "session_id": "uuid",
  "processed": 18,
  "present_count": 15,
  "absent_count": 3
}
```

**Frontend link:**  
→ `AttendanceMarkingPage` → Submit Attendance button. Sends the full grid state in one call. Shows success toast with present/absent count on response.

---

### GET `/sessions/{id}/attendance/`

Lists all attendance records for a session with student names.

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "enrollment_id": "uuid",
    "student_id": "uuid",       // [R]
    "student_name": "Ahmed Mohamed",  // [R]
    "present": true
  }
]
```

**Frontend link:**  
→ `AttendanceMarkingPage` — called on page load. If records already exist for this session (edit mode), pre-fills the present/absent toggles.

---

### GET `/students/{id}/attendance/stats/`

Per-student attendance statistics for a specific class.

**Query params:**
```
?class_id=uuid     — * required
?days=28           — lookback window in days (default: 28)
```

**Response `200`:**
```json
{
  "student_id": "uuid",
  "class_id": "uuid",
  "total_sessions": 10,
  "present_count": 8,
  "absent_count": 2,
  "attendance_pct": 80.0,
  "days_window": 28
}
```

**Frontend link:**  
→ `StudentProfilePage` → Attendance tab (Yamen's component): called per enrolled class to show the attendance percentage badge.  
→ `DashboardPage` → at-risk panel: Zahwa's `GET /dashboard/at-risk/` joins against this to find students below 70%.  
→ `AttendanceSummaryWidget` — small badge component used in `StudentProfilePage` header.

---

### GET `/students/{id}/attendance/history/`

Chronological session attendance history for a student in a specific class.

**Query params:**
```
?class_id=uuid     — * required
```

**Response `200`:**
```json
[
  {
    "session_id": "uuid",
    "session_num": 10,
    "session_date": "2025-10-14",
    "present": true
  },
  {
    "session_id": "uuid",
    "session_num": 9,
    "session_date": "2025-10-09",
    "present": false
  }
]
```

**Frontend link:**  
→ `StudentProfilePage` → Attendance tab (Yamen's component) → per-class session history list. Each row shows date, session number, and present/absent chip.

---

---

## 13. Grades

**Owner: Nasef**

---

### POST `/grades/`

Creates a new grade entry.

**Request body:**
```json
{
  "enrollment_id": "uuid",           // *
  "session_id": "uuid",              // *
  "subject_name": "Mathematics",     // * — denormalized copy
  "score": "7.50",                   // *
  "max_score": "10.00",              // *
  "assigned_on": "2025-10-14"        // *
}
```

**Response `201`:**
```json
{
  "id": "uuid",
  "enrollment_id": "uuid",
  "session_id": "uuid",
  "subject_name": "Mathematics",
  "score": "7.50",
  "max_score": "10.00",
  "score_pct": 75.0,              // [R] computed
  "assigned_on": "2025-10-14",
  "created_at": "2025-10-14T12:00:00Z"  // [R]
}
```

**Response `400`:** `{ "detail": "Grade for this assessment already exists for this student in this session." }`

**Frontend link:**  
→ `ClassDetailPage` → Grades tab (Nasef's component) → grade entry form → submit button.

---

### GET `/grades/`

Lists all grades for an enrollment.

**Query params:**
```
?enrollment_id=uuid     — * required
?ordering=-assigned_on  — default: newest first
```

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "subject_name": "Mathematics",
    "score": "7.50",
    "max_score": "10.00",
    "score_pct": 75.0,
    "assigned_on": "2025-10-14",
    "session_num": 10              // [R] from session
  }
]
```

**Frontend link:**  
→ `StudentProfilePage` → Grades tab (Nasef's component): calls `?enrollment_id=:id` for each active enrollment.

---

### PATCH `/grades/{id}/`

Corrects a grade entry.

**Request body (all optional):**
```json
{
  "score": "8.00",
  "notes": "Remarked after review"
}
```

**Response `200`:** Updated grade object.

**Frontend link:**  
→ `StudentProfilePage` → Grades tab → edit icon on grade row → inline edit form → save.

---

### DELETE `/grades/{id}/`

Removes a grade entry permanently.

**Response `204`:** Empty body.

**Frontend link:**  
→ `StudentProfilePage` → Grades tab → delete icon on grade row → confirmation dialog.

---

### GET `/grades/summary/`

Computed grade summary for a student in a class. **Must always return a valid JSON response, even when no grades exist.**

**Query params:**
```
?enrollment_id=uuid     — * required
```

**Response `200` (with data):**
```json
{
  "enrollment_id": "uuid",
  "assessment_count": 5,
  "average_pct": 78.0,
  "latest_score_pct": 82.0,
  "trend": "improving"
}
```

**Response `200` (no grades yet):**
```json
{
  "enrollment_id": "uuid",
  "assessment_count": 0,
  "average_pct": null,
  "latest_score_pct": null,
  "trend": null
}
```

`trend` logic: compare average of last 3 scores vs average of 3 before that.  
- Difference > +5% → `"improving"`  
- Difference < -5% → `"declining"`  
- Otherwise → `"stable"`  
- Fewer than 3 scores → `null`

**Frontend link:**  
→ `StudentProfilePage` → Grades tab — summary bar at the top (average %, trend badge).  
→ `ClassDetailPage` → Class Grades tab — per-student average row.  
→ Phase 2: `GET /dashboard/at-risk/` will join against this to factor grade decline into dropout risk scoring.

---

### GET `/classes/{id}/grades/summary/`

All enrolled students' grade summaries for a class in one call.

**Response `200`:**
```json
[
  {
    "enrollment_id": "uuid",
    "student_name": "Ahmed Mohamed",
    "assessment_count": 5,
    "average_pct": 78.0,
    "trend": "improving"
  },
  {
    "enrollment_id": "uuid",
    "student_name": "Sara Khaled",
    "assessment_count": 3,
    "average_pct": 52.0,
    "trend": "declining"
  }
]
```

**Frontend link:**  
→ `ClassDetailPage` → Grades tab (Nasef's component) — class-wide grade summary table, color-coded by `average_pct`.

---

---

## 14. Dashboard & Aggregation

**Owner: Zahwa**  
All endpoints are read-only aggregations. No new models. These endpoints can only be built after the other tables have data (Sprint 3–4).

---

### GET `/dashboard/summary/`

Top-level academy KPIs for the dashboard header.

**Response `200`:**
```json
{
  "active_students_count": 87,
  "active_classes_count": 6,
  "active_enrollments_count": 112,
  "revenue_expected_this_month": "12500.00",
  "revenue_collected_this_month": "10500.00",
  "collection_rate_pct": 84.0,
  "overdue_enrollments_count": 5,
  "overdue_total": "2000.00",
  "avg_attendance_pct_last_28_days": 81.5
}
```

**Frontend link:**  
→ `DashboardPage` (`/dashboard`) — KPI card row at the top. Called once on mount, cached for 5 minutes.

---

### GET `/dashboard/at-risk/`

Students who are at risk based on attendance and payment status. The base layer for Phase 2 AI retention agent.

**Query params:**
```
?attendance_threshold=70     — default: 70 (%)
?overdue_days=14             — default: 14 (days)
```

**Response `200`:**
```json
[
  {
    "student_id": "uuid",
    "student_name": "Ahmed Mohamed",
    "risk_factors": ["low_attendance", "overdue_fee"],
    "attendance_pct": 62.5,
    "overdue_amount": "500.00",
    "overdue_days": 18,
    "enrolled_classes": ["Math G7 Mon/Wed"]
  }
]
```

**Frontend link:**  
→ `DashboardPage` — At-Risk Students panel. Each row shows student name, risk factor badges, and a View Profile button linking to `/students/:id`.

---

### GET `/dashboard/activity/`

Most recent actions across the academy for the activity feed.

**Query params:**
```
?limit=20     — default: 20
```

**Response `200`:**
```json
[
  {
    "type": "payment",
    "description": "Payment of 500 EGP recorded for Ahmed Mohamed",
    "timestamp": "2025-10-14T11:22:00Z",
    "student_id": "uuid",
    "student_name": "Ahmed Mohamed"
  },
  {
    "type": "enrollment",
    "description": "Sara Khaled enrolled in English B2 Wed/Fri",
    "timestamp": "2025-10-13T09:10:00Z",
    "student_id": "uuid",
    "student_name": "Sara Khaled"
  },
  {
    "type": "session",
    "description": "Session 10 marked for Math G7 Mon/Wed — 15/18 attended",
    "timestamp": "2025-10-12T17:05:00Z",
    "class_id": "uuid",
    "class_name": "Math G7 Mon/Wed"
  }
]
```

**Frontend link:**  
→ `DashboardPage` — Recent Activity feed section. Each item is a text row with timestamp and optional link.

---

### GET `/dashboard/teachers/`

Per-teacher workload summary.

**Response `200`:**
```json
[
  {
    "teacher_id": "uuid",
    "teacher_name": "Dr. Fatma Hassan",
    "class_count": 3,
    "total_enrolled_students": 52,
    "sessions_this_month": 12,
    "earnings_this_month": "1800.00"   // rate_per_session × sessions_this_month
  }
]
```

**Frontend link:**  
→ `TeachersPage` — workload badges per teacher row.  
→ `DashboardPage` — optional teacher workload section (if space allows in the layout).

---

---

## 15. Error Reference

All error responses follow this shape:

```json
{
  "detail": "Human-readable error message."
}
```

Or for validation errors:

```json
{
  "field_name": ["Error message for this field."],
  "another_field": ["Another error."]
}
```

| Code | Meaning | Common cause |
|------|---------|--------------|
| `400` | Bad Request | Missing required field, invalid value, constraint violation |
| `401` | Unauthorized | Missing or expired JWT token |
| `403` | Forbidden | Valid token but insufficient role |
| `404` | Not Found | Record does not exist or belongs to a different academy |
| `409` | Conflict | Duplicate record (e.g. same student enrolled twice in same class) |
| `500` | Server Error | Unhandled exception — check Django logs |

**Important:** A `404` is returned when a record exists but belongs to a different academy. This prevents information leakage — the response is identical to a genuinely missing record.

---

---

## 16. Frontend Mapping Summary

This table maps every React page to the endpoints it calls and who owns each.

| Page / Component | Route | Endpoints Called | Owner |
|---|---|---|---|
| `LoginPage` | `/login` | `POST /auth/login/` | Mahdy |
| `RegisterPage` | `/register` | `POST /auth/register/` | Mahdy |
| `AcademyContext` | (global) | `GET /academy/` | Mahdy |
| `axiosClient` interceptor | (global) | `POST /auth/token/refresh/` | Mahdy |
| `DashboardPage` | `/dashboard` | `GET /dashboard/summary/`, `GET /dashboard/at-risk/`, `GET /dashboard/activity/`, `GET /payments/summary/` | Zahwa |
| `StudentListPage` | `/students` | `GET /students/` | Mahdy |
| `StudentProfilePage` | `/students/:id` | `GET /students/:id/` | Mahdy |
| ↳ Enrollment tab | (tab) | `GET /enrollments/?student_id=`, `POST /enrollments/` | Zahwa |
| ↳ Payments tab | (tab) | `GET /payments/?student_id=`, `POST /payments/` | Zahwa |
| ↳ Attendance tab | (tab) | `GET /students/:id/attendance/stats/?class_id=`, `GET /students/:id/attendance/history/?class_id=` | Yamen |
| ↳ Grades tab | (tab) | `GET /grades/?enrollment_id=`, `GET /grades/summary/?enrollment_id=` | Nasef |
| `StudentFormModal` | (modal) | `POST /students/`, `PATCH /students/:id/` | Mahdy |
| `SubjectsPage` | `/subjects` | `GET /subjects/`, `POST /subjects/`, `PATCH /subjects/:id/` | Yahya |
| `ClassListPage` | `/classes` | `GET /classes/` | Yahya |
| `ClassDetailPage` | `/classes/:id` | `GET /classes/:id/` | Yahya |
| ↳ Students tab | (tab) | `GET /classes/:id/students/`, `POST /enrollments/` | Yahya shell, Zahwa data |
| ↳ Sessions tab | (tab) | `GET /sessions/?class_id=`, `POST /sessions/`, `GET /classes/:id/attendance/summary/` | Yamen |
| ↳ Grades tab | (tab) | `GET /classes/:id/grades/summary/` | Nasef |
| ↳ Teachers tab | (tab) | `GET /classes/:id/teachers/`, `POST /teacher-class/`, `DELETE /teacher-class/:id/` | Yahya |
| `AttendanceMarkingPage` | `/classes/:id/attendance/:session_id` | `GET /sessions/:id/attendance/`, `POST /sessions/:id/attendance/` | Yamen |
| `TeachersPage` | `/teachers` | `GET /teachers/`, `POST /teachers/`, `GET /dashboard/teachers/` | Zahwa |
| `PaymentsPage` | `/payments` | `GET /payments/?month=`, `GET /payments/summary/`, `POST /payments/` | Zahwa |
| `SettingsPage` | `/settings` | `GET /academy/`, `PATCH /academy/` | Mahdy |
| `UsersPage` | `/users` | `GET /users/`, `POST /users/`, `PATCH /users/:id/` | Mahdy |

---

*AcademiQ API Documentation — Team Edvora — Base Layer (no AI)*  
*Phase 2 additions: AI report generation, dropout prediction agent, and notification dispatch endpoints will be documented separately.*
