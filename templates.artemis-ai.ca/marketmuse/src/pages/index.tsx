import ContentEditor from '../components/ContentEditor';

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>MarketMuse Content Studio Template</h1>
      <section style={{ marginTop: '2rem' }}>
        <ContentEditor />
      </section>
    </main>
  );
}