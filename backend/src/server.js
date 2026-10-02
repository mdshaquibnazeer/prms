const env = require('./config/env');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { pool } = require('./config/db');
const routes = require('./routes');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const patientService = require('./services/patientService');

const app = express();

app.use(helmet());
app.use(cors({ origin: env.clientUrl.split(',').map((s) => s.trim()), credentials: true }));
app.use(express.json({ limit: '200kb' }));

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ success: true, status: 'ok', database: 'connected' });
  } catch (e) {
    res.status(503).json({ success: false, status: 'error', database: 'unreachable' });
  }
});

app.use('/api', routes);
app.use(notFound);
app.use(errorHandler);

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('PostgreSQL connection OK');
    const n = await patientService.refreshIndex();
    console.log(`Hash Map index built from PostgreSQL: ${n} patient(s)`);
  } catch (err) {
    console.error('\nCould not connect to PostgreSQL / load data.');
    console.error(`Reason: ${err.message}`);
    console.error('Check DATABASE_URL in your .env file and make sure you ran: npm run db:setup (inside /backend)\n');
    process.exit(1);
  }
  app.listen(env.port, () => console.log(`API running at http://localhost:${env.port}/api`));
}

if (require.main === module) start();
module.exports = app;
