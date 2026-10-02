/**
 * Creates the database (if it does not exist), then runs database/schema.sql and database/seed.sql.
 *   Usage (from the /backend folder):   npm run db:setup
 *   Schema only:                        npm run db:setup -- --no-seed
 * WARNING: schema.sql drops and recreates all tables.
 */
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const env = require('../src/config/env');

const root = path.resolve(__dirname, '../../database');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

async function ensureDatabase() {
  const url = new URL(env.databaseUrl);
  const dbName = decodeURIComponent(url.pathname.slice(1));
  const probe = new Client({ connectionString: env.databaseUrl });
  try {
    await probe.connect();
    await probe.end();
    return;
  } catch (err) {
    if (err.code !== '3D000') throw err; // 3D000 = database does not exist
  }
  console.log(`Database "${dbName}" does not exist - creating it...`);
  url.pathname = '/postgres';
  const admin = new Client({ connectionString: url.toString() });
  await admin.connect();
  await admin.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
  await admin.end();
}

(async () => {
  try {
    await ensureDatabase();
    const client = new Client({ connectionString: env.databaseUrl });
    await client.connect();
    console.log('Running schema.sql ...');
    await client.query(read('schema.sql'));
    if (!process.argv.includes('--no-seed')) {
      console.log('Running seed.sql ...');
      await client.query(read('seed.sql'));
    }
    const counts = await client.query(
      `SELECT (SELECT COUNT(*) FROM patients) AS patients, (SELECT COUNT(*) FROM doctors) AS doctors,
              (SELECT COUNT(*) FROM appointments) AS appointments, (SELECT COUNT(*) FROM users) AS users`
    );
    console.log('Done. Rows:', counts.rows[0]);
    await client.end();
  } catch (err) {
    console.error('\nDatabase setup failed:', err.message);
    console.error('Check that PostgreSQL is running and that DATABASE_URL in .env is correct.\n');
    process.exit(1);
  }
})();
