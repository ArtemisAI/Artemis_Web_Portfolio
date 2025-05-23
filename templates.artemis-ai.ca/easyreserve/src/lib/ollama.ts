/**
 * Ollama API client for EasyReserve
 * TODO: handle streaming and RAG context
 */
export async function chatWithOllama(prompt: string) {
  const url = process.env.NEXT_PUBLIC_OLLAMA_URL || process.env.OLLAMA_URL;
  if (!url) throw new Error('OLLAMA_URL is not defined');
  const res = await fetch(`${url}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'llama-3', messages: [{ role: 'user', content: prompt }] }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Ollama error: ${text}`);
  }
  return res.json();
}