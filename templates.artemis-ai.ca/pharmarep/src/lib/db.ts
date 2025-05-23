import { Pool } from 'pg';

/**
 * Database connection pool for PharmaRep
 * TODO: Define tables (users, hcp, products, visits, sales_data, tasks)
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;