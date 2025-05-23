import type { NextApiRequest, NextApiResponse } from 'next';

// TODO: Implement reservation management logic
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(501).json({ error: 'Not implemented' });
}