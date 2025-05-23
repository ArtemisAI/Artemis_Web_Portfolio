import { Pool } from 'pg';

/**
 * Database connection pool for MediConnect
 * TODO: Define tables (patients, messages, appointments)
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;