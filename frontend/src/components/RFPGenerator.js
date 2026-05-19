'use client';

import React, { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const CATEGORIES = [
  'IT Hardware & Software',
  'Office Supplies',
  'Logistics & Freight',
  'Professional Services',
  'Manufacturing Materials',
  'Marketing Services',
];

export default function RFPGenerator() {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [requirementsText, setRequirementsText] = useState(
    '24/7 vendor support\nCompliance with ISO 9001\nDelivery within 30 days'
  );
  const [deadline, setDeadline] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const reqList = requirementsText
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);

  const next = () => setStep((s) => Math.min(s + 1, 3));
  const prev = () => setStep((s) => Math.max(s - 1, 1));

  const generate = async () => {
    setBusy(true);
    setStatus('Generating PDF...');
    try {
      const res = await fetch(`${API_URL}/api/custom-views/rfp-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          requirements: reqList,
          deadline,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RFP_${(title || category).replace(/[^a-z0-9]+/gi, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatus('RFP PDF downloaded.');
    } catch (e) {
      setStatus(`Error: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900">RFP Generator</h2>
        <p className="text-sm text-gray-500">Step {step} of 3 — produce a downloadable RFP PDF.</p>
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">RFP Title (optional)</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. 2026 Laptop Refresh"
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Requirements (one per line)</label>
          <textarea
            value={requirementsText}
            onChange={(e) => setRequirementsText(e.target.value)}
            rows={8}
            className="w-full border rounded px-3 py-2 text-sm font-mono"
          />
          <div className="text-xs text-gray-500">{reqList.length} requirement(s) detected.</div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Submission Deadline</label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full border rounded px-3 py-2 text-sm"
          />
          <div className="bg-gray-50 border rounded p-3 text-sm">
            <div><strong>Title:</strong> {title || '(none)'}</div>
            <div><strong>Category:</strong> {category}</div>
            <div><strong>Requirements:</strong> {reqList.length}</div>
            <div><strong>Deadline:</strong> {deadline || 'TBD'}</div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-5">
        <button
          onClick={prev}
          disabled={step === 1 || busy}
          className="px-3 py-2 text-sm border rounded disabled:opacity-50"
        >
          Back
        </button>

        {step < 3 ? (
          <button
            onClick={next}
            className="px-3 py-2 text-sm rounded bg-blue-600 text-white"
          >
            Next
          </button>
        ) : (
          <button
            onClick={generate}
            disabled={busy}
            className="px-3 py-2 text-sm rounded bg-green-600 text-white disabled:opacity-50"
          >
            {busy ? 'Generating...' : 'Generate RFP PDF'}
          </button>
        )}
      </div>

      {status && <div className="text-sm mt-3 text-gray-700">{status}</div>}
    </div>
  );
}
