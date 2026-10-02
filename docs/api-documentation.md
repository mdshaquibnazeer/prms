# API Documentation

Base URL: `http://localhost:5000/api`. All endpoints except `/auth/login` and `/health` need the header `Authorization: Bearer <token>`.

Successful responses: `{ "success": true, ... }`. Errors: `{ "success": false, "message": "...", "errors": { "field": "..." } }`.
Status codes: 400 validation, 401 not logged in / bad login, 403 role not allowed, 404 not found, 409 duplicate or conflict, 500 server error (generic message).

Roles: **A** admin, **D** doctor, **R** receptionist.

## Auth
| Method | Path | Roles | Description |
|---|---|---|---|
| POST | `/auth/login` | public | body `{ email, password }` -> `{ token, user }` |
| GET | `/auth/me` | all | current user |
| POST | `/auth/change-password` | all | `{ currentPassword, newPassword }` |
| GET / POST | `/users` | A | list / create users |

## Patients
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/patients` | A D R | Query: `search`, `by` (id/name/phone), `algorithm` (auto/hash/linear/binary), `sort` (patient_id/name/age/appointment_date/priority), `order` (asc/desc). Response `meta` reports the algorithm, complexity and comparisons. |
| GET | `/patients/next-id` | A D R | next free ID, e.g. P1006 |
| GET | `/patients/:id` | A D R | one patient, found through the Hash Map |
| POST | `/patients` | A D R | create (ID, name, age, gender, phone required) |
| PUT | `/patients/:id` | A D R | update |
| DELETE | `/patients/:id` | A | delete (cascades) |

## Medical history and prescriptions (A, D only)
| Method | Path | Description |
|---|---|---|
| GET | `/patients/:id/history` | visits as linked-list nodes (position, isHead, isTail, nextHistoryId), ordered by visit date |
| POST | `/patients/:id/history` | `{ doctor_id, visit_date, diagnosis, treatment, notes }` |
| DELETE | `/history/:id` | delete a visit |
| GET | `/prescriptions` | all prescriptions |
| GET / POST | `/patients/:id/prescriptions` | list / add `{ doctor_id, medicine, dosage, duration, instructions }` |
| DELETE | `/prescriptions/:id` | delete |

## Doctors
| Method | Path | Roles |
|---|---|---|
| GET | `/doctors`, `/doctors/:id` | A D R |
| POST / PUT / DELETE | `/doctors`, `/doctors/:id` | A |

## Appointments
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/appointments` | A D R | Query `scope` (today/upcoming/all), `status`, `patient_id`, `doctor_id` |
| POST | `/appointments` | A D R | `{ patient_id, doctor_id, appointment_date, appointment_time, priority, status }`. Past dates rejected; a doctor cannot be double-booked for a normal appointment. Critical/Emergency appointments for today also join the emergency queue. |
| PUT | `/appointments/:id` | A D R | update |
| DELETE | `/appointments/:id` | A R | delete |
| GET | `/appointments/queue` | A D R | today's normal appointments as a FIFO queue |
| POST | `/appointments/queue/next` | A D R | dequeue the front appointment and mark it Completed |

## Emergency queue
| Method | Path | Description |
|---|---|---|
| GET | `/emergency` | waiting patients in priority order, plus the heap array and recently processed |
| POST | `/emergency` | `{ patient_id, priority (1-3), reason }` |
| POST | `/emergency/process-next` | extract the highest-priority patient; message "Patient X is now being processed." |

## Dashboard and reports
| Method | Path | Roles | Description |
|---|---|---|---|
| GET | `/dashboard` | A D R | statistics, recent patients/appointments, emergency preview |
| GET | `/reports` | A | Query `from`, `to`, `doctor_id` |

## DSA demonstration (A D R)
Each user has their own in-memory demo structures. Responses contain `result` (message, complexity) and `state`.
`GET /dsa/info`, `GET /dsa/state`, `POST /dsa/reset {which}`,
`POST /dsa/hashmap/set | collisions | load-patients`, `GET /dsa/hashmap/get/:key`, `DELETE /dsa/hashmap/:key`,
`POST /dsa/queue/enqueue | dequeue`, `GET /dsa/queue/peek`,
`POST /dsa/priority-queue/insert | extract | load-emergency`, `GET /dsa/priority-queue/peek`,
`POST /dsa/heap/insert | extract | heapify`, `GET /dsa/heap/peek`,
`POST /dsa/linked-list/add | delete | search | display | load-patient`,
`POST /dsa/search { dataset, field, algorithm, query, numbers, sortFirst }`, `POST /dsa/sort { dataset, field, order, numbers }`.

## Other
`GET /health` - checks the database connection.
