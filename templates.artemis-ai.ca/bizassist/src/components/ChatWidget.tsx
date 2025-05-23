/**
 * TODO:
 * - Render chat UI (message list, input field)
 * - Connect to /api/chat via fetch or SSE
 */
import React, { useState, useRef, useEffect } from 'react';

type Message = { id: number; role: 'user' | 'assistant'; content: string };

export default function ChatWidget() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { id: Date.now(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userMessage.content }),
      });
      const data = await res.json();
      const assistantContent =
        data.choices?.[0]?.message?.content ?? data.content ?? JSON.stringify(data);
      const assistantMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: assistantContent,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: `Error: ${err.message || err}`,
      };
      setMessages(prev => [...prev, errorMessage]);
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
          backgroundColor: '#fafafa',
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
            <strong>{msg.role === 'user' ? 'You' : 'Assistant'}:</strong> {msg.content}
          </div>
        ))}
        {loading && <div>Loading...</div>}
      </div>
      <div style={{ marginTop: '0.5rem', display: 'flex' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          style={{ flex: 1, padding: '0.5rem', fontSize: '1rem' }}
          disabled={loading}
          placeholder="Type your message..."
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{ padding: '0.5rem 1rem', marginLeft: '0.5rem' }}
        >
          Send
        </button>
      </div>
    </div>
  );
}