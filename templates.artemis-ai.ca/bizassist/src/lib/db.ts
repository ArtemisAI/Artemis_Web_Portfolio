import { Pool } from 'pg';

/**
 * Database connection pool
 * TODO: define schema (tables: users, sales, tasks, conversations, messages)
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;