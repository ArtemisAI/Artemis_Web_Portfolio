import ReservationWidget from '../components/ReservationWidget';

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>EasyReserve Reservation Template</h1>
      <section style={{ marginTop: '2rem' }}>
        <ReservationWidget />
      </section>
    </main>
  );
}