# Project Overview

**Title:** Intelligent Patient Record Management System
**Course:** Data Structures and Algorithm-II (CCSE0301)
**Student:** Mohammed Shaquib Nazeer | **Roll No.:** 2501330100226
**Program:** B.Tech Computer Science and Engineering, Semester III, Section CSE-C
**Academic Year:** 2026-2027 | **Faculty:** Pankaj Sir
**Domain / SDG:** Good Health & Well-being - SDG 3 | **Type:** Individual PBL project

## 1. Objective
Build a working hospital patient-record system in which the **data structures and algorithms are the core of the application**, not just a topic mentioned in a report. Every DSA concept solves a real problem in the patient workflow.

## 2. Problem being solved
| Hospital problem | DSA answer |
|---|---|
| Find a patient instantly by Patient ID | **Hash Map** (average O(1)) |
| Serve normal appointments fairly | **Queue** (FIFO) |
| Treat the most critical patient first | **Priority Queue** built on a **Binary Min-Heap** |
| Keep an ordered, growing history of visits | **Linked List** |
| Locate records on unsorted / sorted data | **Linear Search** / **Binary Search** |
| Show records ordered by ID, name, age, date, priority | **Merge Sort** |

## 3. Scope - what is implemented
- Login with JWT, bcrypt password hashing, role-based access (admin / doctor / receptionist) enforced in the backend and mirrored in the UI
- Patients: add, edit, view, delete (with confirmation), search (ID / name / phone) with a choice of algorithm, sort by 5 fields
- Appointments with Normal / Emergency / Critical priority and 4 statuses; a FIFO queue of today's normal appointments with "Serve next patient"
- Emergency queue with "Add Emergency Patient" and "Process Next Patient" (heap extract)
- Medical history shown as a linked-list timeline; prescriptions; doctors
- Dashboard, Reports (6 reports with filters, plain bar charts)
- DSA Demonstration page (Hash Map, Queue, Priority Queue, Heap, Linked List, Searching, Sorting, About/DSA with complexity table)
- PostgreSQL storage, REST API, validation, friendly error messages, loading and empty states, responsive layout, accessible controls

## 4. Not implemented (future scope only)
AI risk prediction, SMS/email reminders, advanced analytics, mobile app, cloud deployment, hospital-system integration, push notifications and advanced reporting are **not** part of this version.

## 5. Architecture
```
User -> React UI -> REST API -> Express Controller -> Service Layer
     -> DSA Processing (backend/src/dsa) -> Model (SQL) -> PostgreSQL -> Response -> React UI
```
- **Controllers** read the request and send the response.
- **Services** hold business rules and call the DSA classes.
- **DSA layer** (`backend/src/dsa`) contains only pure data-structure code with no Express or database code.
- **Models** contain parameterised SQL only.

## 6. Database vs DSA
PostgreSQL is the **permanent storage**. The DSA structures are **application-level** structures built from database rows: the Hash Map index of patients, the FIFO queue of today's normal appointments, the priority queue of waiting emergencies, and the linked list of one patient's visits. The database primary key (`patient_id`) and the Hash Map key are two separate things that happen to use the same value.
