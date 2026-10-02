-- =====================================================================
-- Seed demo data for PRMS
-- =====================================================================

TRUNCATE emergency_queue, prescriptions, medical_history, appointments, users, doctors, patients, hospitals RESTART IDENTITY CASCADE;

-- 1. 10 Fictional Hospitals
INSERT INTO hospitals (hospital_id, name, email, phone, address, city, status) VALUES
 ('H001', 'Apex Multi-Specialty Hospital',    'apex@hospital.com',     '+91 11 2345 6780', '12 Health Boulevard, Sector 15', 'New Delhi', 'approved'),
 ('H002', 'City Care Hospital',                'citycare@hospital.com', '+91 22 2345 6781', '45 Marine Drive, Nariman Point', 'Mumbai',    'approved'),
 ('H003', 'Metro Health Institute',            'metro@hospital.com',    '+91 80 2345 6782', '88 Tech Park Road, Whitefield',   'Bengaluru', 'approved'),
 ('H004', 'Apollo Care Medical Center',        'apollo@hospital.com',   '+91 44 2345 6783', '101 Greams Road, Thousand Lights','Chennai',   'approved'),
 ('H005', 'St. Jude Memorial Hospital',        'stjude@hospital.com',   '+91 40 2345 6784', '23 Banjara Hills, Road No. 2',    'Hyderabad', 'approved'),
 ('H006', 'Lifeline Super Specialty',          'lifeline@hospital.com', '+91 33 2345 6785', '77 Park Street, Elgin',           'Kolkata',   'approved'),
 ('H007', 'Sunshine Healthcare',               'sunshine@hospital.com', '+91 20 2345 6786', '19 FC Road, Shivajinagar',       'Pune',      'approved'),
 ('H008', 'Fortis Care Center',                'fortis@hospital.com',   '+91 79 2345 6787', '55 SG Highway, Thaltej',          'Ahmedabad', 'approved'),
 ('H009', 'Global Health Hospital',            'global@hospital.com',   '+91 14 2345 6788', '33 Tonk Road, Bapu Nagar',        'Jaipur',    'approved'),
 ('H010', 'Hope Medical Research Institute',   'hope@hospital.com',     '+91 52 2345 6789', '90 Hazratganj, Park Avenue',      'Lucknow',   'approved');

-- 2. Doctors (associated with specific hospitals)
INSERT INTO doctors (doctor_id, hospital_id, name, specialization, phone, email, status) VALUES
 ('D001', 'H001', 'Dr. Rajesh Sharma',  'Cardiology',       '+91 98765 00001', 'rajesh.sharma@hospital.com', 'approved'),
 ('D002', 'H001', 'Dr. Ananya Khan',    'Neurology',        '+91 98765 00002', 'ananya.khan@hospital.com',   'approved'),
 ('D003', 'H002', 'Dr. Vikram Verma',   'General Medicine', '+91 98765 00003', 'vikram.verma@hospital.com',  'approved');

-- 3. Patients
INSERT INTO patients (patient_id, hospital_id, name, age, gender, phone, email, address, blood_group) VALUES
 ('P1001', 'H001', 'Rahul Sharma', 35, 'Male',   '+91 98765 43210', 'rahul.sharma@example.com', '12 Park Street, Delhi',          'B+'),
 ('P1002', 'H001', 'Aman Khan',    42, 'Male',   '+91 98765 43211', 'aman.khan@example.com',     '45 Green Avenue, Noida',          'A+'),
 ('P1003', 'H001', 'Sara Ali',     31, 'Female', '+91 98765 43212', 'sara.ali@example.com',      '7 Lake View, Greater Noida',      'O+'),
 ('P1004', 'H002', 'Arjun Verma',  58, 'Male',   '+91 98765 43213', 'arjun.verma@example.com',   '88 Sector 62, Noida',             'AB+'),
 ('P1005', 'H002', 'Priya Singh',  19, 'Female', '+91 98765 43214', 'priya.singh@example.com',   '23 College Road, Greater Noida',  'B-');

-- 4. Users (Authentication Accounts)
-- Main Admin (admin@shaquib / ABcd@1234)
INSERT INTO users (name, email, password_hash, role, status) VALUES
 ('Mohammed Shaquib (Main Admin)', 'admin@shaquib', '$2a$10$adb5Do9Zq1wpYYLQ.RBZcehWjf1YzEg9fyvVQ.piwI5v6Zu26VDQe', 'admin', 'approved');

-- Hospital Users (Password: Hospital@123)
INSERT INTO users (name, email, password_hash, role, hospital_id, status) VALUES
 ('Apex Hospital Admin',   'apex@hospital.com',     '$2a$10$rLHwOfmCc40ewDipSPRed.fK/5G3DOeTyCvZeyCfzoN2jfsJOp7I.', 'hospital', 'H001', 'approved'),
 ('City Care Admin',       'citycare@hospital.com', '$2a$10$rLHwOfmCc40ewDipSPRed.fK/5G3DOeTyCvZeyCfzoN2jfsJOp7I.', 'hospital', 'H002', 'approved'),
 ('Metro Health Admin',    'metro@hospital.com',    '$2a$10$rLHwOfmCc40ewDipSPRed.fK/5G3DOeTyCvZeyCfzoN2jfsJOp7I.', 'hospital', 'H003', 'approved'),
 ('Apollo Care Admin',     'apollo@hospital.com',   '$2a$10$rLHwOfmCc40ewDipSPRed.fK/5G3DOeTyCvZeyCfzoN2jfsJOp7I.', 'hospital', 'H004', 'approved'),
 ('St. Jude Admin',        'stjude@hospital.com',   '$2a$10$rLHwOfmCc40ewDipSPRed.fK/5G3DOeTyCvZeyCfzoN2jfsJOp7I.', 'hospital', 'H005', 'approved');

-- Doctor Users (Password: Doctor@123) - Attached to their specific hospital
INSERT INTO users (name, email, password_hash, role, hospital_id, doctor_id, status) VALUES
 ('Dr. Rajesh Sharma',  'rajesh.sharma@hospital.com', '$2a$10$l5P4x53KZ3Oh4Ejx9kJHueoZcvDjpeEqoiNYI22qcokUBGFEmZqEG', 'doctor', 'H001', 'D001', 'approved'),
 ('Dr. Ananya Khan',    'ananya.khan@hospital.com',   '$2a$10$l5P4x53KZ3Oh4Ejx9kJHueoZcvDjpeEqoiNYI22qcokUBGFEmZqEG', 'doctor', 'H001', 'D002', 'approved'),
 ('Dr. Vikram Verma',   'vikram.verma@hospital.com',  '$2a$10$l5P4x53KZ3Oh4Ejx9kJHueoZcvDjpeEqoiNYI22qcokUBGFEmZqEG', 'doctor', 'H002', 'D003', 'approved');

-- Patient User (Password: Patient@123)
INSERT INTO users (name, email, password_hash, role, hospital_id, patient_id, status) VALUES
 ('Rahul Sharma', 'rahul@patient.com', '$2a$10$KB3jSSGNIuX0LpoAk20.ieh/NKughB/CbHBoCBeoyWkl0zdCBfey.', 'patient', 'H001', 'P1001', 'approved');

-- 5. Appointments
INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, priority, status) VALUES
 ('P1001', 'D001', CURRENT_DATE, '10:00', 1, 'Confirmed'),
 ('P1004', 'D003', CURRENT_DATE, '10:30', 3, 'Pending'),
 ('P1005', 'D003', CURRENT_DATE, '11:00', 3, 'Confirmed'),
 ('P1003', 'D002', CURRENT_DATE, '11:30', 3, 'Pending'),
 ('P1002', 'D002', CURRENT_DATE - 3,  '09:30', 2, 'Completed'),
 ('P1001', 'D003', CURRENT_DATE - 10, '14:00', 3, 'Completed'),
 ('P1004', 'D001', CURRENT_DATE - 7,  '16:00', 3, 'Completed'),
 ('P1002', 'D003', CURRENT_DATE + 2,  '10:00', 3, 'Pending'),
 ('P1004', 'D002', CURRENT_DATE + 1,  '12:00', 3, 'Cancelled'),
 ('P1005', 'D001', CURRENT_DATE + 5,  '15:30', 3, 'Confirmed'),
 ('P1003', 'D002', CURRENT_DATE + 7,  '11:00', 3, 'Pending');

-- 6. Medical History (Linked List Nodes)
INSERT INTO medical_history (patient_id, doctor_id, visit_date, diagnosis, treatment, notes) VALUES
 ('P1001', 'D003', CURRENT_DATE - 120, 'Seasonal allergy',       'Antihistamine tablets',          'Symptoms improve with medication.'),
 ('P1001', 'D003', CURRENT_DATE - 60,  'Common cold',            'Rest, fluids and paracetamol',   'Advised to return if fever lasts more than 3 days.'),
 ('P1001', 'D001', CURRENT_DATE - 10,  'Chest pain (check-up)', 'ECG and stress test',             'ECG normal. Follow-up in 3 months.'),
 ('P1002', 'D003', CURRENT_DATE - 90,  'Viral fever',            'Paracetamol and hydration',      NULL),
 ('P1002', 'D002', CURRENT_DATE - 3,   'Migraine',               'Pain relief and trigger diary',  'Avoid screen time late at night.'),
 ('P1003', 'D002', CURRENT_DATE - 45,  'Tension headache',       'Stress management, analgesic',   NULL),
 ('P1003', 'D003', CURRENT_DATE - 15,  'Vitamin D deficiency',   'Vitamin D3 supplement',          'Re-test after 8 weeks.');

-- 7. Prescriptions
INSERT INTO prescriptions (patient_id, doctor_id, medicine, dosage, duration, instructions) VALUES
 ('P1001', 'D001', 'Atorvastatin 10mg',  'Once daily at bedtime', '30 days', 'Take after food. Avoid grapefruit.'),
 ('P1001', 'D001', 'Aspirin 75mg',       'Once daily with water', '30 days', 'Take in the morning with a full glass of water.'),
 ('P1002', 'D002', 'Sumatriptan 50mg',   'At onset of migraine',  'As needed', 'Do not take more than two tablets in 24 hours.'),
 ('P1003', 'D003', 'Cholecalciferol 60k','Once a week for 8 wks', '8 weeks', 'Take with milk after a meal.'),
 ('P1004', 'D003', 'Metformin 500mg',    'Twice daily with meals','60 days', 'Keep regular meal timings.');

-- 8. Emergency Queue (Priority Queue / Binary Heap)
INSERT INTO emergency_queue (patient_id, appointment_id, priority, reason, status, arrived_at) VALUES
 ('P1003', NULL, 3, 'Severe abdominal pain (normal emergency)', 'Waiting', NOW() - INTERVAL '45 minutes'),
 ('P1002', NULL, 2, 'Fracture suspected after a fall',           'Waiting', NOW() - INTERVAL '30 minutes'),
 ('P1001', 1,    1, 'Acute chest pain with shortness of breath', 'Waiting', NOW() - INTERVAL '15 minutes');
