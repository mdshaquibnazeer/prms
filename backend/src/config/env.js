// Loads environment variables from the .env file in the PROJECT ROOT (prms/.env).
// Falls back to backend/.env if you prefer to keep it there.
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config(); // also read backend/.env (does not override values already set)

const required = ['DATABASE_URL', 'JWT_SECRET'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`\nMissing environment variables: ${missing.join(', ')}`);
  console.error('Copy .env.example to .env (project root) and fill in the values.\n');
  process.exit(1);
}

module.exports = {
  port: parseInt(process.env.PORT, 10) || 5000,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
