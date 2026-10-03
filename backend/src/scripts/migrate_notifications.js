const db = require('../config/db');

(async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS patient_notifications (
        notification_id SERIAL PRIMARY KEY,
        patient_id VARCHAR(20) NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
        hospital_id VARCHAR(30) REFERENCES hospitals(hospital_id) ON DELETE SET NULL,
        sender_name VARCHAR(150) NOT NULL,
        title VARCHAR(150) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_notifications_patient ON patient_notifications(patient_id);
    `);
    console.log('patient_notifications table created successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err);
    process.exit(1);
  }
})();
