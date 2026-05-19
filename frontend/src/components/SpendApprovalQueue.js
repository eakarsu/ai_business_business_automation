'use client';

import React, { useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export default function SpendApprovalQueue() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentDraft, setCommentDraft] = useState({});
  const [busyId, setBusyId] = useState(null);

  const load = () => {
    setLoading(true);
    fetch(`${API_URL}/api/custom-views/approval-queue`)
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setRows(j.all || []);
        else setError('Failed to load approval queue');
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const act = async (id, action) => {
    setBusyId(id);
    try {
      const res = await fetch(`${API_URL}/api/custom-views/approval-queue/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, comment: commentDraft[id] || '' }),
      });
      const j = await res.json();
      if (j.success) {
        setRows((prev) => prev.map((p) => (p.id === id ? j.po : p)));
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setBusyId(null);
    }
  };

  const statusColor = (s) => {
    if (s === 'APPROVED') return 'bg-green-100 text-green-800';
    if (s === 'REJECTED') return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Spend Approval Queue</h2>
          <p className="text-sm text-gray-500">Pending purchase orders awaiting approval.</p>
        </div>
        <button onClick={load} className="text-sm px-3 py-1.5 border rounded">
          Refresh
        </button>
      </div>

      {loading && <div className="text-sm text-gray-500">Loading queue...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left border-b text-gray-600">
                <th className="py-2 px-2">PO</th>
                <th className="py-2 px-2">Vendor</th>
                <th className="py-2 px-2">Category</th>
                <th className="py-2 px-2">Amount</th>
                <th className="py-2 px-2">Requester</th>
                <th className="py-2 px-2">Status</th>
                <th className="py-2 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b align-top">
                  <td className="py-2 px-2 font-mono">{p.id}</td>
                  <td className="py-2 px-2">{p.vendor}</td>
                  <td className="py-2 px-2">{p.category}</td>
                  <td className="py-2 px-2">${p.amount.toLocaleString()}</td>
                  <td className="py-2 px-2">{p.requester}</td>
                  <td className="py-2 px-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${statusColor(p.status)}`}>
                      {p.status}
                    </span>
                    {p.comment && (
                      <div className="text-xs text-gray-500 mt-1">"{p.comment}"</div>
                    )}
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex flex-col gap-1 min-w-[220px]">
                      <input
                        type="text"
                        placeholder="comment (optional)"
                        value={commentDraft[p.id] || ''}
                        onChange={(e) =>
                          setCommentDraft((d) => ({ ...d, [p.id]: e.target.value }))
                        }
                        className="border rounded px-2 py-1 text-xs"
                      />
                      <div className="flex gap-1">
                        <button
                          disabled={busyId === p.id || p.status !== 'PENDING'}
                          onClick={() => act(p.id, 'APPROVE')}
                          className="px-2 py-1 text-xs rounded bg-green-600 text-white disabled:opacity-40"
                        >
                          Approve
                        </button>
                        <button
                          disabled={busyId === p.id || p.status !== 'PENDING'}
                          onClick={() => act(p.id, 'REJECT')}
                          className="px-2 py-1 text-xs rounded bg-red-600 text-white disabled:opacity-40"
                        >
                          Reject
                        </button>
                        <button
                          disabled={busyId === p.id}
                          onClick={() => act(p.id, 'COMMENT')}
                          className="px-2 py-1 text-xs rounded bg-gray-600 text-white disabled:opacity-40"
                        >
                          Comment
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
