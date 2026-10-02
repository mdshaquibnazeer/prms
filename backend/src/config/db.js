const { Pool, types } = require('pg');
const env = require('./env');

// Return DATE columns as plain 'YYYY-MM-DD' strings (not JS Date objects) to avoid timezone shifts.
types.setTypeParser(1082, (v) => v);

const pool = new Pool({ connectionString: env.databaseUrl });

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
