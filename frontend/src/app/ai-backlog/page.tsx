'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';

type TabKey = 'simplify' | 'esg' | 'classify' | 'translate' | 'onboarding';

const TABS: { key: TabKey; label: string; description: string }[] = [
  { key: 'simplify', label: 'Contract Simplifier', description: 'Plain-English summary of legal contract language.' },
  { key: 'esg', label: 'ESG Score', description: 'Score a supplier on Environmental / Social / Governance pillars.' },
  { key: 'classify', label: 'Spend Classifier', description: 'Auto-classify invoice line items into spend categories.' },
  { key: 'translate', label: 'RFP Translator', description: 'Translate an RFP into a target language with glossary.' },
  { key: 'onboarding', label: 'Onboarding Checklist', description: 'Generate a supplier onboarding checklist.' },
];

export default function AIBacklogPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('simplify');
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // form state
  const [contractText, setContractText] = useState('');
  const [audience, setAudience] = useState('a procurement manager');
  const [supplierJson, setSupplierJson] = useState('{\n  "name": "Acme Industries",\n  "country": "US",\n  "certifications": ["ISO 14001"],\n  "incidents": []\n}');
  const [lineItemsJson, setLineItemsJson] = useState('[\n  { "description": "Dell XPS 15 laptop", "amount": 2200 },\n  { "description": "Annual SaaS license - Slack", "amount": 12000 }\n]');
  const [taxonomyJson, setTaxonomyJson] = useState('');
  const [rfpText, setRfpText] = useState('');
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [supplierType, setSupplierType] = useState('hardware-vendor');
  const [jurisdiction, setJurisdiction] = useState('US');
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');

  useEffect(() => {
    const t = localStorage.getItem('token');
    if (!t) { router.push('/login'); return; }
    setToken(t);
  }, [router]);

  const callApi = async (path: string, body: any) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/ai-backlog/${path}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.status === 503) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || 'AI service unavailable: API key not configured');
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error || `Request failed (${res.status})`);
        return;
      }
      const j = await res.json();
      setResult(j.data);
    } catch (e: any) {
      setError(e?.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      switch (tab) {
        case 'simplify':
          return callApi('contract-simplify', { contractText, audience });
        case 'esg':
          return callApi('esg-score', { supplier: JSON.parse(supplierJson) });
        case 'classify': {
          const body: any = { lineItems: JSON.parse(lineItemsJson) };
          if (taxonomyJson.trim()) body.taxonomy = JSON.parse(taxonomyJson);
          return callApi('classify-spend', body);
        }
        case 'translate':
          return callApi('rfp-translate', { rfpText, targetLanguage });
        case 'onboarding':
          return callApi('onboarding-checklist', { supplierType, jurisdiction, riskLevel });
      }
    } catch (e: any) {
      setError(`Invalid JSON: ${e?.message}`);
    }
  };

  const current = TABS.find(t => t.key === tab)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-5">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">AI Backlog Center</h1>
            <p className="text-sm text-gray-500">Procurement-specific AI utilities</p>
          </div>
          <Link href="/dashboard" className="text-sm text-emerald-700 hover:text-emerald-900">Back to dashboard</Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-2 mb-6">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setResult(null); setError(null); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${tab === t.key ? 'bg-emerald-600 text-white' : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">{current.label}</h2>
            <p className="text-sm text-gray-500 mb-4">{current.description}</p>

            <form onSubmit={submit} className="space-y-4">
              {tab === 'simplify' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contract text</label>
                    <textarea value={contractText} onChange={e => setContractText(e.target.value)} required rows={10} className="w-full border border-gray-300 rounded-lg p-2 text-sm" placeholder="Paste contract clauses..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
                    <input value={audience} onChange={e => setAudience(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm" />
                  </div>
                </>
              )}
              {tab === 'esg' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier profile (JSON)</label>
                  <textarea value={supplierJson} onChange={e => setSupplierJson(e.target.value)} required rows={10} className="w-full border border-gray-300 rounded-lg p-2 font-mono text-xs" />
                </div>
              )}
              {tab === 'classify' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Line items (JSON array)</label>
                    <textarea value={lineItemsJson} onChange={e => setLineItemsJson(e.target.value)} required rows={8} className="w-full border border-gray-300 rounded-lg p-2 font-mono text-xs" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Taxonomy (optional JSON array)</label>
                    <textarea value={taxonomyJson} onChange={e => setTaxonomyJson(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg p-2 font-mono text-xs" placeholder='["IT_EQUIPMENT","SOFTWARE",...]' />
                  </div>
                </>
              )}
              {tab === 'translate' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RFP text</label>
                    <textarea value={rfpText} onChange={e => setRfpText(e.target.value)} required rows={10} className="w-full border border-gray-300 rounded-lg p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target language</label>
                    <input value={targetLanguage} onChange={e => setTargetLanguage(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm" />
                  </div>
                </>
              )}
              {tab === 'onboarding' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supplier type</label>
                    <input value={supplierType} onChange={e => setSupplierType(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jurisdiction</label>
                    <input value={jurisdiction} onChange={e => setJurisdiction(e.target.value)} className="w-full border border-gray-300 rounded-lg p-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Risk level</label>
                    <select value={riskLevel} onChange={e => setRiskLevel(e.target.value as any)} className="w-full border border-gray-300 rounded-lg p-2 text-sm">
                      <option value="low">low</option>
                      <option value="medium">medium</option>
                      <option value="high">high</option>
                    </select>
                  </div>
                </>
              )}

              <button type="submit" disabled={loading} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
                {loading ? 'Running...' : 'Run AI'}
              </button>
              {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            </form>
          </section>

          <section className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Result</h2>
            {!result && <p className="text-sm text-gray-500">No result yet. Submit the form to run.</p>}
            {result && (
              <pre className="text-xs bg-gray-50 border border-gray-200 rounded-lg p-3 overflow-auto max-h-[600px] whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
