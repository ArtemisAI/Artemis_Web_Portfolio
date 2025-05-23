/**
 * n8n webhook trigger
 * TODO: support multiple flows, error handling, retries
 */
export async function triggerN8n(payload: any) {
  const webhook = process.env.NEXT_PUBLIC_N8N_WEBHOOK || process.env.N8N_WEBHOOK_URL;
  if (!webhook) throw new Error('N8N_WEBHOOK_URL is not defined');
  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`n8n webhook error: ${text}`);
  }
  return res.json();
}