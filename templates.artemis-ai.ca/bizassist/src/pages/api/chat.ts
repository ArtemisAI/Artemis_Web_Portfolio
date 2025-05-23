import type { NextApiRequest, NextApiResponse } from 'next';

// TODO: Validate prompt and forward request to Ollama at process.env.OLLAMA_URL
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(501).json({ error: 'Not implemented' });
}