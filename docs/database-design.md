# Database Design (PostgreSQL)

Run `database/schema.sql` then `database/seed.sql`.

## Tables
| Table | Primary key | Foreign keys | Notes |
|---|---|---|---|
| `patients` | `patient_id` (e.g. P1001) | - | age 0-120 check, gender and blood-group checks |
| `doctors` | `doctor_id` (e.g. D001) | - | |
| `appointments` | `appointment_id` (SERIAL) | `patient_id -> patients` (CASCADE), `doctor_id -> doctors` (RESTRICT) | `priority` 1/2/3, `status` Pending/Confirmed/Completed/Cancelled |
| `medical_history` | `history_id` (SERIAL) | `patient_id`, `doctor_id` | one row = one visit = one linked-list node |
| `prescriptions` | `prescription_id` (SERIAL) | `patient_id`, `doctor_id` | |
| `users` | `user_id` (SERIAL) | - | `email` UNIQUE, `password_hash` (bcrypt), role admin/doctor/receptionist |
| `emergency_queue` *(extra)* | `queue_id` (SERIAL) | `patient_id`, `appointment_id` | stores who is waiting so the queue survives a server restart; status Waiting/Processed |

`emergency_queue` is the one table beyond the six required: the priority queue lives in memory, so PostgreSQL needs somewhere to keep the waiting list permanently.

## Relationships
```
patients 1 --- * appointments        doctors 1 --- * appointments
patients 1 --- * medical_history     doctors 1 --- * medical_history
patients 1 --- * prescriptions       doctors 1 --- * prescriptions
patients 1 --- * emergency_queue
```

## Key rule
`patient_id` is the **primary key of `patients` only**. In `appointments`, `medical_history` and `prescriptions` it is a **foreign key**, because one patient can have many appointments, visits and prescriptions. Their own primary keys are `appointment_id`, `history_id` and `prescription_id`.

**Database primary key != Hash Map key.** The primary key makes rows unique inside PostgreSQL (with an index). The Hash Map is a separate in-memory structure that the application builds from the rows.

## Deletion behaviour
- Deleting a patient removes their appointments, history, prescriptions and queue entries (`ON DELETE CASCADE`).
- A doctor who is still referenced cannot be deleted (`ON DELETE RESTRICT`); the API returns a friendly 409 message.

## Security
Passwords are hashed with bcrypt (cost 10). All SQL uses parameters (`$1, $2 ...`), never string concatenation of user input.
