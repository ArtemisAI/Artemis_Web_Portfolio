import type { NextApiRequest, NextApiResponse } from 'next';

import type { NextApiRequest, NextApiResponse } from 'next';
import { chatWithOllama } from '../../lib/ollama';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { prompt } = req.body;
  if (typeof prompt !== 'string' || !prompt.trim()) {
    return res.status(400).json({ error: 'Invalid prompt' });
  }
  try {
    const aiResponse = await chatWithOllama(prompt);
    return res.status(200).json(aiResponse);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}