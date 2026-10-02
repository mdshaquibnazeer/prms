-- =====================================================================
-- Intelligent Patient Record Management System - PostgreSQL schema
-- Run this file ONCE on an empty database (it drops and recreates tables).
-- =====================================================================

DROP TABLE IF EXISTS emergency_queue CASCADE;
DROP TABLE IF EXISTS prescriptions   CASCADE;
DROP TABLE IF EXISTS medical_history CASCADE;
DROP TABLE IF EXISTS appointments    CASCADE;
DROP TABLE IF EXISTS users           CASCADE;
DROP TABLE IF EXISTS doctors         CASCADE;
DROP TABLE IF EXISTS patients        CASCADE;

-- 1. patients ---------------------------------------------------------
CREATE TABLE patients (
    patient_id   VARCHAR(20)  PRIMARY KEY,                    -- e.g. P1001
    name         VARCHAR(100) NOT NULL,
    age          INTEGER      NOT NULL CHECK (age BETWEEN 0 AND 120),
    gender       VARCHAR(10)  NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    phone        VARCHAR(20)  NOT NULL,
    email        VARCHAR(120),
    address      TEXT,
    blood_group  VARCHAR(3)   CHECK (blood_group IN ('A+','A-','B+','B-','AB+','AB-','O+','O-')),
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2. doctors ----------------------------------------------------------
CREATE TABLE doctors (
    doctor_id      VARCHAR(20)  PRIMARY KEY,                  -- e.g. D001
    name           VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    phone          VARCHAR(20),
    email          VARCHAR(120),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 3. appointments -----------------------------------------------------
-- appointment_id is the primary key. patient_id is only a FOREIGN KEY
-- because one patient can have many appointments.
CREATE TABLE appointments (
    appointment_id   SERIAL       PRIMARY KEY,
    patient_id       VARCHAR(20)  NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    doctor_id        VARCHAR(20)  NOT NULL REFERENCES doctors(doctor_id)   ON DELETE RESTRICT,
    appointment_date DATE         NOT NULL,
    appointment_time TIME         NOT NULL,
    priority         SMALLINT     NOT NULL DEFAULT 3 CHECK (priority IN (1, 2, 3)),  -- 1 Critical, 2 Emergency, 3 Normal
    status           VARCHAR(12)  NOT NULL DEFAULT 'Pending'
                     CHECK (status IN ('Pending', 'Confirmed', 'Completed', 'Cancelled')),
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 4. medical_history --------------------------------------------------
CREATE TABLE medical_history (
    history_id  SERIAL       PRIMARY KEY,
    patient_id  VARCHAR(20)  NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    doctor_id   VARCHAR(20)  NOT NULL REFERENCES doctors(doctor_id)   ON DELETE RESTRICT,
    visit_date  DATE         NOT NULL,
    diagnosis   VARCHAR(200) NOT NULL,
    treatment   VARCHAR(300) NOT NULL,
    notes       TEXT,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 5. prescriptions ----------------------------------------------------
CREATE TABLE prescriptions (
    prescription_id SERIAL       PRIMARY KEY,
    patient_id      VARCHAR(20)  NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    doctor_id       VARCHAR(20)  NOT NULL REFERENCES doctors(doctor_id)   ON DELETE RESTRICT,
    medicine        VARCHAR(150) NOT NULL,
    dosage          VARCHAR(100) NOT NULL,
    duration        VARCHAR(100) NOT NULL,
    instructions    TEXT,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 6. users (login accounts) -------------------------------------------
CREATE TABLE users (
    user_id        SERIAL       PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    email          VARCHAR(120) NOT NULL UNIQUE,
    password_hash  VARCHAR(100) NOT NULL,                     -- bcrypt hash, never plain text
    role           VARCHAR(15)  NOT NULL CHECK (role IN ('admin', 'doctor', 'receptionist')),
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 7. emergency_queue (extra table that stores the waiting list that the
--    in-memory Priority Queue / Heap is built from) ----------------------
CREATE TABLE emergency_queue (
    queue_id       SERIAL       PRIMARY KEY,
    patient_id     VARCHAR(20)  NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
    appointment_id INTEGER      REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    priority       SMALLINT     NOT NULL CHECK (priority IN (1, 2, 3)),
    reason         VARCHAR(200),
    status         VARCHAR(12)  NOT NULL DEFAULT 'Waiting' CHECK (status IN ('Waiting', 'Processed')),
    arrived_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    processed_at   TIMESTAMPTZ
);

-- Indexes for the foreign keys / common filters
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor  ON appointments(doctor_id);
CREATE INDEX idx_appointments_date    ON appointments(appointment_date);
CREATE INDEX idx_history_patient      ON medical_history(patient_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_emergency_status     ON emergency_queue(status);
