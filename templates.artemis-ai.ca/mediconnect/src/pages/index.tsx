import SymptomChecker from '../components/SymptomChecker';

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>MediConnect Health Companion Template</h1>
      <section style={{ marginTop: '2rem' }}>
        <SymptomChecker />
      </section>
    </main>
  );
}