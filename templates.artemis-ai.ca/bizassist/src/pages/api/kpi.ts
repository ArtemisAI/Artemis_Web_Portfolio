import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    // Example KPI: total sales count
    const result = await pool.query('SELECT COUNT(*) AS total_sales FROM sales');
    const totalSales = result.rows[0]?.total_sales || '0';
    return res.status(200).json({ totalSales });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}