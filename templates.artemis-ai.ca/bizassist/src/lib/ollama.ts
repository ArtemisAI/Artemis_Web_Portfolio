/**
 * Ollama API client
 * TODO: refine request/response types, add streaming support
 */
export async function chatWithOllama(prompt: string) {
  const url = process.env.OLLAMA_URL;
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
  const data = await res.json();
  return data;
}