import type { NextApiRequest, NextApiResponse } from 'next';
import { chatWithOllama } from '../../lib/ollama';
import { triggerN8n } from '../../lib/n8n';

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
    // AI for symptom triage
    const aiData = await chatWithOllama(prompt);
    const assistantContent =
      aiData.choices?.[0]?.message?.content ?? aiData.content ?? JSON.stringify(aiData);
    // Trigger appointment workflow
    await triggerN8n({ prompt, response: assistantContent });
    return res.status(200).json({ response: assistantContent });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}