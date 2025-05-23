import type { NextApiRequest, NextApiResponse } from 'next';

// TODO: Fetch KPI metrics from database or cache
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(501).json({ error: 'Not implemented' });
}