'use client';

// Apply pass 5 — Backlog II AI Center.
// Surfaces the additional backlog endpoints introduced in `backend/src/routes/aiBacklog2.ts`.
// Each tab is intentionally minimal so the page stays compileable even if the
// backend returns 503 (NEEDS-CREDS endpoints) or the LLM is offline.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';

type TabKey = 'capabilities' | 'esg-feed' | 'catalog' | 'geo' | 'ariba' | 'coupa' | 'anomaly' | 'po-match' | 'negotiation' | 'counter';

const TABS: { key: TabKey; label: string; category: string }[] = [
  { key: 'capabilities', label: 'Capabilities', category: 'MECHANICAL' },
  { key: 'esg-feed', label: 'ESG Feed', category: 'NEEDS-CREDS' },
  { key: 'catalog', label: 'Catalog Enrich', category: 'NEEDS-CREDS' },
  { key: 'geo', label: 'Geo Risk', category: 'NEEDS-CREDS' },
  { key: 'ariba', label: 'Ariba Sync', category: 'NEEDS-CREDS' },
  { key: 'coupa', label: 'Coupa Sync', category: 'NEEDS-CREDS' },
  { key: 'anomaly', label: 'Spend Anomalies', category: 'TOO-RISKY (stub)' },
  { key: 'po-match', label: 'Invoice ↔ PO Match', category: 'TOO-RISKY (stub)' },
  { key: 'negotiation', label: 'Negotiation Workspace', category: 'TOO-RISKY (stub)' },
  { key: 'counter', label: 'AI Counter Suggest', category: 'NEEDS-PRODUCT-DECISION' },
];

export default function AIBacklog2Page() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('capabilities');
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const [recordsJson, setRecordsJson] = useState('[\n  { "vendor": "Acme", "amount": 15000, "date": "2026-04-30T11:00:00Z" }\n]');
  const [poJson, setPoJson] = useState('{\n  "id": "PO-1",\n  "vendor": "Acme",\n  "total": 1000,\n  "lines": [{"sku":"A","unitPrice":10,"quantity":100}]\n}');
  const [invJson, setInvJson] = useState('{\n  "id": "INV-1",\n  "vendor": "Acme",\n  "total": 1010,\n  "lines": [{"sku":"A","unitPrice":10.1,"quantity":100}]\n}');
  const [topic, setTopic] = useState('Q3 hardware refresh - price ceiling');
  const [sessionId, setSessionId] = useState('');
  const [msgFrom, setMsgFrom] = useState('buyer');
  const [msgText, setMsgText] = useState('We need 10% off list.');

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) { router.push('/login'); return; }
    setToken(t);
  }, [router]);

  const call = async (method: string, path: string, body?: any) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/ai-backlog2/${path}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined,
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 503) {
        setError(`${j.error || 'Service unavailable'}${j.missing ? ` (missing: ${j.missing})` : ''}`);
        setResult(j);
        return;
      }
      if (!res.ok) { setError(j.error || `HTTP ${res.status}`); return; }
      setResult(j);
    } catch (e: any) {
      setError(e?.message || 'request failed');
    } finally {
      setLoading(false);
    }
  };

  const ta = (v: string, set: (s: string) => void, rows = 8) => (
    <textarea value={v} onChange={(e) => set(e.target.value)} rows={rows}
      style={{ width: '100%', fontFamily: 'monospace', fontSize: 12, padding: 8 }} />
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 20, fontFamily: 'system-ui' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h1 style={{ margin: 0, fontSize: 22 }}>AI Backlog II</h1>
        <Link href="/ai-backlog" style={{ color: '#0070f3' }}>← AI Backlog I</Link>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key); setError(null); setResult(null); }}
            style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd',
              background: tab === t.key ? '#0070f3' : '#fff', color: tab === t.key ? '#fff' : '#222', cursor: 'pointer', fontSize: 12 }}>
            {t.label} <span style={{ opacity: 0.6, marginLeft: 4, fontSize: 10 }}>{t.category}</span>
          </button>
        ))}
      </div>

      {tab === 'capabilities' && (
        <button disabled={loading} onClick={() => call('GET', '_capabilities')}>List capabilities</button>
      )}
      {tab === 'esg-feed' && (
        <button disabled={loading} onClick={() => call('POST', 'esg-score-feed', {})}>Probe ESG feed (expects 503)</button>
      )}
      {tab === 'catalog' && (
        <button disabled={loading} onClick={() => call('POST', 'catalog-enrich', {})}>Probe catalog enrich (expects 503)</button>
      )}
      {tab === 'geo' && (
        <button disabled={loading} onClick={() => call('POST', 'geo-risk', {})}>Probe geo risk (expects 503)</button>
      )}
      {tab === 'ariba' && (
        <button disabled={loading} onClick={() => call('POST', 'ariba-sync', {})}>Probe Ariba (expects 503)</button>
      )}
      {tab === 'coupa' && (
        <button disabled={loading} onClick={() => call('POST', 'coupa-sync', {})}>Probe Coupa (expects 503)</button>
      )}
      {tab === 'anomaly' && (
        <div>
          <label>Records (JSON array)</label>
          {ta(recordsJson, setRecordsJson)}
          <button disabled={loading} onClick={() => {
            try { call('POST', 'spend-anomaly-batch', { records: JSON.parse(recordsJson) }); }
            catch (e: any) { setError(e?.message || 'invalid JSON'); }
          }}>Score anomalies</button>
        </div>
      )}
      {tab === 'po-match' && (
        <div>
          <label>PO</label>{ta(poJson, setPoJson)}
          <label>Invoice</label>{ta(invJson, setInvJson)}
          <button disabled={loading} onClick={() => {
            try { call('POST', 'invoice-po-match', { po: JSON.parse(poJson), invoice: JSON.parse(invJson) }); }
            catch (e: any) { setError(e?.message || 'invalid JSON'); }
          }}>Match</button>
        </div>
      )}
      {tab === 'negotiation' && (
        <div>
          <label>Topic</label>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} style={{ width: '100%', padding: 6 }} />
          <button disabled={loading} onClick={() => call('POST', 'negotiation/session', { topic })}>Create session</button>
          <hr style={{ margin: '12px 0' }} />
          <label>Session id</label>
          <input value={sessionId} onChange={(e) => setSessionId(e.target.value)} style={{ width: '100%', padding: 6 }} />
          <label>From</label>
          <input value={msgFrom} onChange={(e) => setMsgFrom(e.target.value)} style={{ width: '100%', padding: 6 }} />
          <label>Message</label>
          {ta(msgText, setMsgText, 3)}
          <button disabled={loading || !sessionId} onClick={() => call('POST', `negotiation/${sessionId}/message`, { from: msgFrom, text: msgText })}>Append message</button>{' '}
          <button disabled={loading || !sessionId} onClick={() => call('GET', `negotiation/${sessionId}`)}>Fetch session</button>{' '}
          <button disabled={loading || !sessionId} onClick={() => call('POST', `negotiation/${sessionId}/close`, {})}>Close session</button>
        </div>
      )}
      {tab === 'counter' && (
        <div>
          <label>Session id</label>
          <input value={sessionId} onChange={(e) => setSessionId(e.target.value)} style={{ width: '100%', padding: 6 }} />
          <button disabled={loading || !sessionId} onClick={() => call('POST', `negotiation/${sessionId}/suggest-counter`, {})}>Suggest counter (LLM)</button>
        </div>
      )}

      {loading && <p style={{ color: '#888' }}>Working…</p>}
      {error && <pre style={{ color: '#b00020', whiteSpace: 'pre-wrap', background: '#fff5f5', padding: 12 }}>{error}</pre>}
      {result && <pre style={{ background: '#f6f8fa', padding: 12, borderRadius: 6, fontSize: 12, overflow: 'auto' }}>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
