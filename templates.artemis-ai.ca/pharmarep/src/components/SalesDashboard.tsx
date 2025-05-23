/**
 * TODO:
 * - Render sales KPIs and charts
 * - Fetch data from /api/sales
 */
import React, { useEffect, useState } from 'react';

type SalesData = { totalRevenue: number; visitCount: number };

export default function SalesDashboard() {
  const [data, setData] = useState<SalesData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/sales')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then((d: SalesData) => setData(d))
      .catch(err => setError(err.message));
  }, []);

  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!data) return <p>Loading sales data...</p>;

  return (
    <div style={{ display: 'flex', gap: '2rem' }}>
      <div>
        <h3>Total Revenue</h3>
        <p>${data.totalRevenue.toFixed(2)}</p>
      </div>
      <div>
        <h3>Visits Logged</h3>
        <p>{data.visitCount}</p>
      </div>
    </div>
  );
}