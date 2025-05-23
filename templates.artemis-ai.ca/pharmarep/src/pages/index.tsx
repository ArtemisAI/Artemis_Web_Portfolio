import SalesDashboard from '../components/SalesDashboard';

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>PharmaRep CRM & Insights Template</h1>
      <section style={{ marginTop: '2rem' }}>
        <SalesDashboard />
      </section>
    </main>
  );
}