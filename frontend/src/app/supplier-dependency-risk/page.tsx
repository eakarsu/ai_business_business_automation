'use client';

import { useState } from 'react';

export default function SupplierDependencyRiskPage() {
  const [form, setForm] = useState({ spendSharePct: 52, singleSource: true, deliveryDelayDays: 8, contractExitDays: 18, complianceFindings: 1 });
  const [result, setResult] = useState<any>(null);
  const submit = async () => {
    const response = await fetch('/api/supplier-dependency-risk/score', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` },
      body: JSON.stringify(form),
    });
    setResult(await response.json());
  };
  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl rounded-lg bg-white p-6 shadow">
        <h1 className="text-2xl font-bold">Supplier Dependency Risk</h1>
        {Object.entries(form).map(([key, value]) => (
          <label key={key} className="mt-4 block">
            {key.replace(/([A-Z])/g, ' $1')}
            {typeof value === 'boolean'
              ? <input className="ml-2" type="checkbox" checked={value} onChange={(event) => setForm({ ...form, [key]: event.target.checked })} />
              : <input className="mt-1 w-full rounded border p-2" type="number" value={value} onChange={(event) => setForm({ ...form, [key]: Number(event.target.value) })} />}
          </label>
        ))}
        <button className="mt-4 rounded bg-indigo-600 px-4 py-2 text-white" onClick={submit}>Score risk</button>
        {result && <section className="mt-6"><h2 className="font-semibold">{result.level.toUpperCase()} · {result.score}/100</h2><ul className="list-disc pl-5">{result.actions.map((action: string) => <li key={action}>{action}</li>)}</ul></section>}
      </div>
    </main>
  );
}
