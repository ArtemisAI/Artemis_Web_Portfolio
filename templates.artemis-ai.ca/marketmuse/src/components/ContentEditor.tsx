/**
 * TODO:
 * - Render content editor UI (title, body, channel selection)
 * - Connect to /api/content for drafts and schedules
 */
import React, { useState, useEffect, useRef } from 'react';

type Message = { id: number; role: 'user' | 'assistant'; content: string };

export default function ContentEditor() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleGenerate = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { id: Date.now(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/content', {
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
          backgroundColor: '#fefefe',
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
            <strong>{msg.role === 'user' ? 'Prompt' : 'Generated'}:</strong> {msg.content}
          </div>
        ))}
        {loading && <div>Generating content...</div>}
      </div>
      <div style={{ marginTop: '0.5rem', display: 'flex' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleGenerate()}
          style={{ flex: 1, padding: '0.5rem', fontSize: '1rem' }}
          disabled={loading}
          placeholder="Enter a prompt for content generation..."
        />
        <button
          onClick={handleGenerate}
          disabled={loading || !input.trim()}
          style={{ padding: '0.5rem 1rem', marginLeft: '0.5rem' }}
        >
          Generate
        </button>
      </div>
    </div>
  );
}