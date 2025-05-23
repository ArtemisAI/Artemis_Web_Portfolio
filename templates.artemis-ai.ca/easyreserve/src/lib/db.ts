import { Pool } from 'pg';

/**
 * Database connection pool for EasyReserve
 * TODO: Define tables (restaurants, customers, reservations, waitlist)
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;