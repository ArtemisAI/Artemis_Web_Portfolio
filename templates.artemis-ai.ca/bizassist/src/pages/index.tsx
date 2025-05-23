import ChatWidget from '../components/ChatWidget';
import Dashboard from '../components/Dashboard';

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>BizAssist Dashboard Template</h1>
      <section style={{ marginTop: '2rem' }}>
        <h2>Chat Assistant</h2>
        <ChatWidget />
      </section>
      <section style={{ marginTop: '2rem' }}>
        <h2>KPI Dashboard</h2>
        <Dashboard />
      </section>
    </main>
  );
}