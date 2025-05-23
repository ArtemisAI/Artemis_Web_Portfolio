/**
 * TODO:
 * - Render booking chat interface
 * - Connect to /api/reservations and n8n webhook
 */
import React, { useState, useRef, useEffect } from 'react';

type Message = { id: number; role: 'user' | 'assistant'; content: string };

export default function ReservationWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { id: Date.now(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage.content }),
      });
      const data = await res.json();
      const assistantContent = data.response ?? data.error ?? JSON.stringify(data);
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: assistantContent,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Error: ${err.message || err}`,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div
        ref={containerRef}
        style={{
          border: '1px solid #ddd',
          padding: '1rem',
          height: '300px',
          overflowY: 'auto',
          backgroundColor: '#fdfdfd',
        }}
      >
        {messages.map(msg => (
          <div
            key={msg.id}
            style={{
              textAlign: msg.role === 'user' ? 'right' : 'left',
              margin: '0.5rem 0',
            }}
          >
            <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong> {msg.content}
          </div>
        ))}
        {loading && <div>Loading reservation...</div>}
      </div>
      <div style={{ marginTop: '0.5rem', display: 'flex' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          style={{ flex: 1, padding: '0.5rem', fontSize: '1rem' }}
          disabled={loading}
          placeholder="Type your reservation request..."
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{ padding: '0.5rem 1rem', marginLeft: '0.5rem' }}
        >
          Book
        </button>
      </div>
    </div>
  );
}