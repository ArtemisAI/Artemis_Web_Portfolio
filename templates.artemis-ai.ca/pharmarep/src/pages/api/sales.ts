import type { NextApiRequest, NextApiResponse } from 'next';

import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    // Example: fetch total sales and count of visits
    const salesRes = await pool.query('SELECT SUM(amount) AS total_revenue FROM sales_data');
    const visitsRes = await pool.query('SELECT COUNT(*) AS visit_count FROM visits');
    const totalRevenue = salesRes.rows[0]?.total_revenue || 0;
    const visitCount = visitsRes.rows[0]?.visit_count || '0';
    return res.status(200).json({ totalRevenue: Number(totalRevenue), visitCount: Number(visitCount) });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}