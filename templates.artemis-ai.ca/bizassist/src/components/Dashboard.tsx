"use client";

/**
 * TODO:
 * - Display business KPIs with charts
 * - Fetch data from /api/kpi
 */
import React, { useEffect, useState } from 'react';

export default function Dashboard() {
  const [totalSales, setTotalSales] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/kpi')
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        setTotalSales(Number(data.totalSales));
      })
      .catch(err => {
        setError(err.message);
      });
  }, []);

  return (
    <div>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {totalSales === null ? (
        <p>Loading KPI...</p>
      ) : (
        <div style={{ fontSize: '1.25rem' }}>
          Total Sales: <strong>{totalSales}</strong>
        </div>
      )}
    </div>
  );
}