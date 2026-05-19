'use client';

import React, { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const COLORS = {
  IT: '#3b82f6',
  Office: '#10b981',
  Logistics: '#f59e0b',
  Services: '#8b5cf6',
};

export default function SpendTrend() {
  const [series, setSeries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`${API_URL}/api/custom-views/spend-trend`)
      .then((r) => r.json())
      .then((j) => {
        if (!active) return;
        if (j.success) {
          setSeries(j.series || []);
          setCategories(j.categories || []);
        } else setError('Failed to load spend trend');
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
        <h2 className="text-lg font-semibold text-gray-900">Monthly Spend Trend</h2>
        <p className="text-sm text-gray-500">Stacked monthly spend by procurement category.</p>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading spend data...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && (
        <div style={{ width: '100%', height: 360 }}>
          <ResponsiveContainer>
            <AreaChart data={series} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => `$${Number(v).toLocaleString()}`} />
              <Legend />
              {categories.map((cat) => (
                <Area
                  key={cat}
                  type="monotone"
                  dataKey={cat}
                  stackId="1"
                  stroke={COLORS[cat] || '#999'}
                  fill={COLORS[cat] || '#999'}
                  fillOpacity={0.6}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
