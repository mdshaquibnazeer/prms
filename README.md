# Intelligent Patient Record Management System

**Course:** Data Structures and Algorithm-II (CCSE0301) | **Student:** Mohammed Shaquib Nazeer (Roll No. 2501330100226)
**Program:** B.Tech CSE, Semester III, Section CSE-C, 2026-2027 | **Faculty:** Pankaj Sir
**Domain:** Good Health & Well-being (SDG 3) | **Type:** Individual PBL project

## 1. Project description
A hospital patient-record system where **the data structures and algorithms do the real work**: a hand-written Hash Map finds patients by ID, a Queue orders normal appointments, a Priority Queue on a Binary Heap decides who is treated first in emergencies, a Linked List holds each patient's visit history, and Merge Sort / Linear / Binary Search order and find records. PostgreSQL stores everything permanently.

## 2. Features
- JWT login, bcrypt password hashing, role-based access (admin / doctor / receptionist) enforced in the backend
- Patients: add, edit, view, delete (with confirmation), search by ID / name / phone with a selectable algorithm, sort by ID / name / age / appointment date / priority
- Appointments (Normal / Emergency / Critical; Pending / Confirmed / Completed / Cancelled), FIFO queue of today's normal appointments
- Emergency queue: add emergency patient, process next patient (heap extract)
- Medical history timeline (linked list), prescriptions, doctors
- Dashboard and Reports (with filters)
- **DSA Demonstration** page with 7 interactive tabs plus an About / DSA tab (objective, problem, stack, where and why, complexity table) for the viva
- Validation, friendly error messages, loading and empty states, responsive layout (sidebar / compact sidebar / hamburger drawer), keyboard-accessible controls

## 3. Technology stack
React 18, JavaScript, Tailwind CSS, React Router, Vite | Node.js, Express | PostgreSQL | REST API | JWT + bcrypt | Postman | Git/GitHub.
Not used: MongoDB, Firebase, Cloudflare, Cloudinary, Docker.

## 4. DSA concepts and where they are used
| DSA | File | Feature | Why |
|---|---|---|---|
| Hash Map (separate chaining) | `backend/src/dsa/HashMap.js` | Patient ID lookup, duplicate-ID check, ID search | average O(1) lookup |
| Queue (linked, head+tail) | `Queue.js` | Today's normal appointments, "Serve next patient" | FIFO fairness |
| Priority Queue | `PriorityQueue.js` | Emergency queue | urgent patients first, FIFO among equals |
| Binary Min-Heap | `Heap.js` | Engine of the priority queue (insert, extractMin, peek, heapify) | O(log n) re-ordering |
| Linked List | `LinkedList.js` | Medical history (one Node per visit) | ordered, growing sequence |
| Linear / Binary Search | `Searching.js` | Patient search, DSA demo | O(n) vs O(log n) on sorted data |
| Merge Sort | `Sorting.js` | Patient sorting, history order, prep for binary search | stable O(n log n) |

## 5. Architecture
```
User -> React UI -> REST API -> Express Controller -> Service Layer -> DSA Processing -> PostgreSQL -> Response -> React UI
```
**PostgreSQL = permanent storage. DSA = efficient in-memory processing built from database rows.** The Hash Map is not the database, and a database primary key is not a Hash Map key.

## 6. Folder structure
```
prms/
├── backend/
│   ├── src/ controllers/ routes/ models/ services/ middleware/ config/ utils/
│   │        dsa/ (HashMap, Queue, Heap, PriorityQueue, LinkedList, Searching, Sorting)
│   │        server.js
│   ├── scripts/ (setupDb.js, apiSmokeTest.js)   tests/ (dsa.test.js)
├── frontend/src/ components/ pages/ layouts/ services/ hooks/ utils/ context/ App.jsx main.jsx
├── database/ schema.sql, seed.sql
├── docs/ project-overview, dsa-explanation, database-design, api-documentation, setup-guide, viva-questions
├── postman/PRMS.postman_collection.json
├── .env.example   .gitignore   package.json   README.md
```

## 7. Database structure
Tables: `patients`, `doctors`, `appointments`, `medical_history`, `prescriptions`, `users`, plus `emergency_queue` (keeps the waiting list so it survives a restart). `patient_id` is the primary key of `patients` only; elsewhere it is a foreign key. Details: `docs/database-design.md`.

## 8. Installation and run (exact commands)
Requirements: Node.js 18+, PostgreSQL 14+.

```bash
# 1. Database (in psql):   CREATE DATABASE patient_records;

# 2. Environment file in the PROJECT ROOT
cp .env.example .env      # then edit DATABASE_URL and JWT_SECRET

# 3. Backend
cd backend
npm install
npm run db:setup          # creates tables (schema.sql) + demo data (seed.sql)
npm run dev               # http://localhost:5000/api

# 4. Frontend (new terminal)
cd frontend
npm install
npm run dev               # http://localhost:5173
```
Manual database alternative: `psql -U postgres -d patient_records -f database/schema.sql` then `-f database/seed.sql`.
Full walkthrough and troubleshooting: `docs/setup-guide.md`.

## 9. Environment variables (`.env` in the project root)
| Variable | Purpose |
|---|---|
| `DATABASE_URL` | `postgresql://USER:PASSWORD@localhost:5432/patient_records` |
| `JWT_SECRET` | long random string used to sign tokens |
| `PORT` | API port (default 5000) |
| `JWT_EXPIRES_IN` | token lifetime (default 8h) |
| `CLIENT_URL` | frontend origin for CORS (default http://localhost:5173) |

Never commit the real `.env`.

## 10. Demo credentials (demo only)
| Role | Email | Password | Access |
|---|---|---|---|
| Admin | admin@hospital.com | Admin@123 | everything, including reports and deletions |
| Doctor | doctor@hospital.com | Doctor@123 | patients, history, appointments, prescriptions |
| Receptionist | reception@hospital.com | Reception@123 | patients, appointments, emergency queue |

## 11. API summary
Full list with roles, parameters and examples: `docs/api-documentation.md`. Import `postman/PRMS.postman_collection.json` into Postman (run **Auth > Login** first).

Main groups: `/auth`, `/patients`, `/patients/:id/history`, `/patients/:id/prescriptions`, `/doctors`, `/appointments` (+ `/queue`), `/emergency`, `/dashboard`, `/reports`, `/dsa/*`.

## 12. DSA complexity table
| Algorithm / Data Structure | Operation | Complexity |
|---|---|---|
| Hash Map | Search / insert / delete | Average O(1) (worst O(n)) |
| Queue | Enqueue / Dequeue / Peek | O(1) |
| Priority Queue | Insert / Extract | O(log n) |
| Heap | Insert / Extract | O(log n) |
| Heap | Peek | O(1) |
| Heap | Heapify (build) | O(n) |
| Linked List | Insert at end (tail pointer kept) | O(1) |
| Linked List | Delete / search | O(n) |
| Linear Search | Search | O(n) |
| Binary Search | Search (sorted data) | O(log n) |
| Merge Sort | Sort | O(n log n), space O(n) |

## 13. Testing
- `cd backend && npm test` - 10 unit tests for the DSA classes (collisions, resize, FIFO order, heap property, priority ties, linked-list head/tail, stable merge sort, binary search steps).
- `cd backend && npm run test:api` - 76 end-to-end checks against the running API (login, role denial, CRUD, validation, duplicate ID, search algorithms, sorting, FIFO and priority queue behaviour, DSA demo endpoints). It changes demo data, so run `npm run db:setup` afterwards.
- Postman collection in `/postman`.

### Manual checklist (UI)
1. Log in as each role; wrong password shows "Invalid email or password."
2. Receptionist: Medical History and Prescriptions are not in the sidebar and the API answers 403.
3. Patients: add (duplicate ID shows an error), edit, delete (confirmation), search with Hash Map / Linear / Binary, sort by each field.
4. Appointments: book, edit, serve next patient from the FIFO queue.
5. Emergency Queue: order is Critical, Emergency, Normal; "Process Next Patient" shows "Patient ... is now being processed."
6. Patient details: history timeline with Visit 1 (head) ... tail.
7. DSA Demonstration: use every tab; try Binary Search on unsorted numbers.
8. Resize the browser to tablet and phone widths: tables become cards, hamburger menu appears.

## 14. Honest status of testing
Backend (DSA unit tests and the 76-check API run against PostgreSQL 16) and the production build of the frontend were verified. The UI screens were **not** click-tested in a real browser by the author of this code generation step, so run the manual checklist above once on your machine and report anything odd.

## 15. Future scope (not implemented)
AI-based risk prediction, SMS/email reminders, advanced analytics, mobile application, cloud deployment, hospital-system integration, appointment notifications, advanced reporting.
