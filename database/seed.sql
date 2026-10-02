-- =====================================================================
-- Demo data (all names/records are FICTIONAL). Run AFTER schema.sql.
-- Dates are relative to the day you run this file, so the dashboard
-- always looks "live" (today's appointments, waiting emergencies...).
-- =====================================================================

TRUNCATE emergency_queue, prescriptions, medical_history, appointments, users, doctors, patients RESTART IDENTITY CASCADE;

-- Demo login accounts (passwords are stored as bcrypt hashes, never plain text)
--   admin@hospital.com      / Admin@123
--   doctor@hospital.com     / Doctor@123
--   reception@hospital.com  / Reception@123
INSERT INTO users (name, email, password_hash, role) VALUES
 ('Admin User',        'admin@hospital.com',     '$2a$10$TGnlSnz1vO4w2qJJMTxCe.A6ECv9u8NFRJ2YwlD1igijDo2.57c9e', 'admin'),
 ('Dr. Sharma (login)','doctor@hospital.com',    '$2a$10$xB50xwnoqm1iysAtEUznxu7oG0NsziGg.LkFMpO9G0Eh9rgj2uUvm', 'doctor'),
 ('Front Desk',        'reception@hospital.com', '$2a$10$tfgcjvY//Iv/ovGo4eyYT.FIsl3vLCB9Ul/cD8MAFbPr88QEHdzO.', 'receptionist');

INSERT INTO doctors (doctor_id, name, specialization, phone, email) VALUES
 ('D001', 'Dr. Sharma', 'Cardiologist',      '+91 98100 11111', 'sharma@hospital.com'),
 ('D002', 'Dr. Khan',   'Neurologist',       '+91 98100 22222', 'khan@hospital.com'),
 ('D003', 'Dr. Verma',  'General Physician', '+91 98100 33333', 'verma@hospital.com');

INSERT INTO patients (patient_id, name, age, gender, phone, email, address, blood_group) VALUES
 ('P1001', 'Rahul Sharma', 25, 'Male',   '+91 98765 43210', 'rahul.sharma@example.com', '12 Park Street, Greater Noida',  'B+'),
 ('P1002', 'Aman Khan',    42, 'Male',   '+91 98765 43211', 'aman.khan@example.com',     '45 Green Avenue, Noida',          'A+'),
 ('P1003', 'Sara Ali',     31, 'Female', '+91 98765 43212', 'sara.ali@example.com',      '7 Lake View, Greater Noida',      'O+'),
 ('P1004', 'Arjun Verma',  58, 'Male',   '+91 98765 43213', 'arjun.verma@example.com',   '88 Sector 62, Noida',             'AB+'),
 ('P1005', 'Priya Singh',  19, 'Female', '+91 98765 43214', 'priya.singh@example.com',   '23 College Road, Greater Noida',  'B-');

-- Appointments: priority 1 = Critical, 2 = Emergency, 3 = Normal
INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, priority, status) VALUES
 -- today (4)
 ('P1001', 'D001', CURRENT_DATE, '10:00', 1, 'Confirmed'),
 ('P1004', 'D003', CURRENT_DATE, '10:30', 3, 'Pending'),
 ('P1005', 'D003', CURRENT_DATE, '11:00', 3, 'Confirmed'),
 ('P1003', 'D002', CURRENT_DATE, '11:30', 3, 'Pending'),
 -- past
 ('P1002', 'D002', CURRENT_DATE - 3,  '09:30', 2, 'Completed'),
 ('P1001', 'D003', CURRENT_DATE - 10, '14:00', 3, 'Completed'),
 ('P1004', 'D001', CURRENT_DATE - 7,  '16:00', 3, 'Completed'),
 -- upcoming
 ('P1002', 'D003', CURRENT_DATE + 2,  '10:00', 3, 'Pending'),
 ('P1004', 'D002', CURRENT_DATE + 1,  '12:00', 3, 'Cancelled'),
 ('P1005', 'D001', CURRENT_DATE + 5,  '15:30', 3, 'Confirmed'),
 ('P1003', 'D002', CURRENT_DATE + 7,  '11:00', 3, 'Pending');

-- Medical history (each visit becomes a node of a linked list in the app)
INSERT INTO medical_history (patient_id, doctor_id, visit_date, diagnosis, treatment, notes) VALUES
 ('P1001', 'D003', CURRENT_DATE - 120, 'Seasonal allergy',   'Antihistamine tablets',          'Symptoms improve with medication.'),
 ('P1001', 'D003', CURRENT_DATE - 60,  'Common cold',        'Rest, fluids and paracetamol',   'Advised to return if fever lasts more than 3 days.'),
 ('P1001', 'D001', CURRENT_DATE - 10,  'Chest pain (check-up)', 'ECG and stress test',         'ECG normal. Follow-up in 3 months.'),
 ('P1002', 'D003', CURRENT_DATE - 90,  'Viral fever',        'Paracetamol and hydration',      NULL),
 ('P1002', 'D002', CURRENT_DATE - 3,   'Migraine',           'Pain relief and trigger diary',  'Avoid screen time late at night.'),
 ('P1003', 'D002', CURRENT_DATE - 45,  'Tension headache',   'Stress management, analgesic',   NULL),
 ('P1003', 'D003', CURRENT_DATE - 15,  'Vitamin D deficiency','Vitamin D3 supplement',          'Re-test after 8 weeks.'),
 ('P1004', 'D003', CURRENT_DATE - 200, 'Type 2 diabetes review', 'Diet plan and metformin',     'HbA1c checked.'),
 ('P1004', 'D001', CURRENT_DATE - 100, 'Hypertension',       'Amlodipine and low-salt diet',   'Monitor blood pressure weekly.'),
 ('P1004', 'D001', CURRENT_DATE - 7,   'Hypertension follow-up', 'Continue current medication','Blood pressure well controlled.'),
 ('P1005', 'D003', CURRENT_DATE - 30,  'Mild asthma',        'Inhaler as needed',              'Avoid dust and cold air.');

INSERT INTO prescriptions (patient_id, doctor_id, medicine, dosage, duration, instructions) VALUES
 ('P1001', 'D001', 'Aspirin',          '75 mg once daily',     '30 days', 'Take after breakfast.'),
 ('P1001', 'D003', 'Paracetamol',      '500 mg when needed',   '5 days',  'Maximum 3 tablets per day.'),
 ('P1002', 'D002', 'Sumatriptan',      '50 mg at onset',       '14 days', 'Do not exceed 2 doses in 24 hours.'),
 ('P1003', 'D003', 'Vitamin D3',       '60000 IU weekly',      '8 weeks', 'Take with a fatty meal.'),
 ('P1004', 'D001', 'Amlodipine',       '5 mg once daily',      '90 days', 'Take at the same time every day.'),
 ('P1004', 'D003', 'Metformin',        '500 mg twice daily',   '90 days', 'Take with meals.'),
 ('P1005', 'D003', 'Salbutamol inhaler','2 puffs when needed', '60 days', 'Rinse mouth after use.');

-- Emergency queue. Sara arrived FIRST but is Normal priority, Rahul arrived LAST but is Critical,
-- so the priority queue serves Rahul -> Aman -> Sara.
INSERT INTO emergency_queue (patient_id, priority, reason, status, arrived_at) VALUES
 ('P1003', 3, 'Persistent headache',            'Waiting',   NOW() - INTERVAL '18 minutes'),
 ('P1002', 2, 'Severe migraine with vomiting',  'Waiting',   NOW() - INTERVAL '12 minutes'),
 ('P1001', 1, 'Chest pain and breathlessness',  'Waiting',   NOW() - INTERVAL '5 minutes');
INSERT INTO emergency_queue (patient_id, priority, reason, status, arrived_at, processed_at) VALUES
 ('P1005', 2, 'Asthma attack', 'Processed', NOW() - INTERVAL '95 minutes', NOW() - INTERVAL '80 minutes');
