'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function VendorComparison() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/api/custom-views/vendor-comparison`)
      .then((r) => r.json())
      .then((j) => {
        if (!active) return;
        if (j.success) setData(j.vendors || []);
        else setError('Failed to load vendor comparison');
      })
      .catch((e) => active && setError(String(e)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Vendor Comparison</h2>
        <p className="text-sm text-gray-500">
          Vendors scored across price, quality, lead-time, and risk (higher = better,
          except risk which is lower = better).
        </p>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading vendor data...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && (
        <div style={{ width: '100%', height: 360 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="price" fill="#3b82f6" name="Price Score" />
              <Bar dataKey="quality" fill="#10b981" name="Quality" />
              <Bar dataKey="leadTime" fill="#f59e0b" name="Lead Time" />
              <Bar dataKey="risk" fill="#ef4444" name="Risk (lower better)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
