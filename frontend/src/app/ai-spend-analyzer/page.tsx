'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';

interface SpendRecord {
  id: string;
  vendorName: string;
  category: string;
  amount: number;
  transactionDate: string;
  department: string;
  description: string;
}

interface SpendAnalytics {
  totalSpend: number;
  transactionCount: number;
  averageTransaction: number;
  spendByCategory: { category: string; _sum: { amount: number }; _count: number }[];
  spendByDepartment: { department: string; _sum: { amount: number } }[];
  topVendors: { vendorName: string; _sum: { amount: number } }[];
}

interface AIAnalysis {
  executiveSummary?: string;
  keyFindings?: string[];
  savingsOpportunities?: { area: string; potentialSavings: number; recommendation: string }[];
  recommendations?: { priority: string; category: string; recommendation: string; expectedImpact: string }[];
  overallHealthScore?: number;
}

export default function AISpendAnalyzerPage() {
  const [records, setRecords] = useState<SpendRecord[]>([]);
  const [analytics, setAnalytics] = useState<SpendAnalytics | null>(null);
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<SpendRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newRecord, setNewRecord] = useState({
    vendorName: '', category: 'IT_EQUIPMENT', amount: '', department: '', description: ''
  });
  const router = useRouter();

  const categories = ['IT_EQUIPMENT', 'SOFTWARE', 'OFFICE_SUPPLIES', 'PROFESSIONAL_SERVICES', 'CONSTRUCTION', 'HEALTHCARE', 'MANUFACTURING', 'LOGISTICS', 'MARKETING', 'UTILITIES', 'MAINTENANCE', 'TRAVEL', 'OTHER'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetchData(token);
  }, [router]);

  const fetchData = async (token: string) => {
    try {
      const [recordsRes, analyticsRes] = await Promise.all([
        fetch(`${API_URL}/api/spend`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/spend/analytics/summary`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (recordsRes.ok) {
        const data = await recordsRes.json();
        setRecords(data.spendRecords || []);
      }
      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data.analytics);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const runAIAnalysis = async () => {
    setAnalyzing(true);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/spend/analyze`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ focusAreas: ['cost optimization', 'vendor consolidation', 'compliance'] }),
      });
      if (response.ok) {
        const data = await response.json();
        const analysis = data.data?.analysis;
        if (analysis && !analysis.parseError) {
          setAIAnalysis(analysis);
        } else {
          setError('AI returned an invalid response. Please try again.');
        }
      } else {
        setError('Analysis failed. Please try again.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_URL}/api/spend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRecord,
          amount: parseFloat(newRecord.amount),
          transactionDate: new Date(),
        }),
      });
      setShowForm(false);
      setNewRecord({ vendorName: '', category: 'IT_EQUIPMENT', amount: '', department: '', description: '' });
      fetchData(token!);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this record?')) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_URL}/api/spend/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
      });
      setRecords(records.filter(r => r.id !== id));
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const formatCurrency = (amount: number) => `$${amount?.toLocaleString() || 0}`;

  const maxCategoryAmount = analytics?.spendByCategory?.reduce((max, cat) => Math.max(max, cat._sum?.amount || 0), 0) || 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50 flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-5">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">AI Spend Analyzer</h1>
                <p className="text-sm text-gray-500">Analyze spending patterns and identify opportunities</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={runAIAnalysis} disabled={analyzing}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-5 py-2.5 rounded-xl hover:from-emerald-700 hover:to-green-700 disabled:opacity-50 transition-all shadow-sm">
              {analyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Run AI Analysis
                </>
              )}
            </button>
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Add Record
            </button>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-600 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-white transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* New Record Form */}
        {showForm && (
          <div className="bg-white shadow-lg rounded-2xl p-6 mb-6 border border-gray-100">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              New Spend Record
            </h3>
            <form onSubmit={handleCreate} className="grid grid-cols-3 gap-4">
              <input placeholder="Vendor Name" value={newRecord.vendorName} onChange={e => setNewRecord({...newRecord, vendorName: e.target.value})} className="border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" required />
              <select value={newRecord.category} onChange={e => setNewRecord({...newRecord, category: e.target.value})} className="border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none">
                {categories.map(c => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
              </select>
              <input placeholder="Amount" type="number" value={newRecord.amount} onChange={e => setNewRecord({...newRecord, amount: e.target.value})} className="border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" required />
              <input placeholder="Department" value={newRecord.department} onChange={e => setNewRecord({...newRecord, department: e.target.value})} className="border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none" />
              <input placeholder="Description" value={newRecord.description} onChange={e => setNewRecord({...newRecord, description: e.target.value})} className="border border-gray-300 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none col-span-2" />
              <div className="col-span-3 flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all">Save Record</button>
              </div>
            </form>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">Total Spend</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(analytics?.totalSpend || 0)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">Transactions</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{analytics?.transactionCount || 0}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">Avg Transaction</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(analytics?.averageTransaction || 0)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">AI Health Score</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {aiAnalysis?.overallHealthScore ? (
                <span className={aiAnalysis.overallHealthScore >= 70 ? 'text-emerald-600' : aiAnalysis.overallHealthScore >= 40 ? 'text-amber-600' : 'text-red-600'}>
                  {aiAnalysis.overallHealthScore}/100
                </span>
              ) : (
                <span className="text-gray-400">--</span>
              )}
            </p>
          </div>
        </div>

        {/* AI Analysis Results */}
        {analyzing && (
          <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-8 mb-6">
            <div className="text-center">
              <div className="relative mx-auto w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
                <div className="absolute inset-3 rounded-full bg-emerald-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <p className="font-medium text-gray-900">Analyzing spending patterns...</p>
              <p className="text-sm text-gray-500 mt-1">AI is reviewing transactions, vendors, and identifying optimization opportunities</p>
            </div>
          </div>
        )}

        {error && !analyzing && (
          <div className="bg-white shadow-sm rounded-2xl border border-red-100 p-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-red-800">{error}</p>
              </div>
              <button onClick={runAIAnalysis} className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 text-sm font-medium transition-colors">
                Retry
              </button>
            </div>
          </div>
        )}

        {aiAnalysis && !analyzing && (
          <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden mb-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-white">AI Spend Analysis</h3>
                </div>
                <button onClick={runAIAnalysis} className="text-sm text-emerald-100 hover:text-white flex items-center gap-1 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Re-analyze
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Executive Summary */}
              {aiAnalysis.executiveSummary && (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-emerald-900 mb-1">Executive Summary</h4>
                      <p className="text-sm text-emerald-800 leading-relaxed">{aiAnalysis.executiveSummary}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Key Findings */}
              {aiAnalysis.keyFindings && aiAnalysis.keyFindings.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Key Findings
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {aiAnalysis.keyFindings.map((finding, i) => (
                      <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-700">{finding}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Savings Opportunities */}
              {aiAnalysis.savingsOpportunities && aiAnalysis.savingsOpportunities.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Savings Opportunities
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium ml-1">
                      {formatCurrency(aiAnalysis.savingsOpportunities.reduce((sum, o) => sum + (o.potentialSavings || 0), 0))} total
                    </span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    {aiAnalysis.savingsOpportunities.map((opp, i) => (
                      <div key={i} className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-amber-900">{opp.area}</span>
                          <span className="text-lg font-bold text-emerald-600">{formatCurrency(opp.potentialSavings)}</span>
                        </div>
                        <p className="text-sm text-amber-800">{opp.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Recommendations
                  </h4>
                  <div className="space-y-3">
                    {aiAnalysis.recommendations.map((rec, i) => (
                      <div key={i} className={`rounded-xl p-4 border-l-4 ${
                        rec.priority === 'high' ? 'border-red-500 bg-red-50/50' :
                        rec.priority === 'medium' ? 'border-amber-500 bg-amber-50/50' :
                        'border-blue-500 bg-blue-50/50'
                      }`}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-medium text-gray-900">{rec.category}</span>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                            rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {rec.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{rec.recommendation}</p>
                        {rec.expectedImpact && (
                          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            Expected Impact: {rec.expectedImpact}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Analytics Grid */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Spend by Category */}
          <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-5">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              By Category
            </h4>
            <div className="space-y-3">
              {analytics?.spendByCategory?.slice(0, 8).map((cat) => (
                <div key={cat.category}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium text-gray-600">{cat.category.replace(/_/g, ' ')}</span>
                    <span className="text-xs font-semibold text-gray-900">{formatCurrency(cat._sum?.amount || 0)}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${((cat._sum?.amount || 0) / maxCategoryAmount) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Vendors */}
          <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-5">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Top Vendors
            </h4>
            <div className="space-y-3">
              {analytics?.topVendors?.slice(0, 8).map((vendor, i) => (
                <div key={vendor.vendorName} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-700 truncate flex-1">{vendor.vendorName}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(vendor._sum?.amount || 0)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* By Department */}
          <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-5">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              By Department
            </h4>
            <div className="space-y-3">
              {analytics?.spendByDepartment?.slice(0, 8).map((dept, i) => (
                <div key={dept.department} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-sm text-gray-700 truncate flex-1">{dept.department}</span>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(dept._sum?.amount || 0)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Records Table */}
        <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Recent Spend Records
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{records.length}</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50/80">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {records.slice(0, 20).map((record) => (
                  <tr key={record.id} className="hover:bg-emerald-50/30 cursor-pointer transition-colors" onClick={() => setSelectedRecord(record)}>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{record.vendorName}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">{record.category?.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-emerald-700">{formatCurrency(record.amount)}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{record.department}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(record.transactionDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(record.id); }}
                        className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal */}
        {selectedRecord && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setSelectedRecord(null)}>
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full m-4 border border-gray-100" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-5">
                <h3 className="text-lg font-semibold text-gray-900">Spend Record Details</h3>
                <button onClick={() => setSelectedRecord(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              <div className="bg-emerald-50 rounded-xl p-4 mb-4 text-center">
                <p className="text-sm text-emerald-600 font-medium">Amount</p>
                <p className="text-3xl font-bold text-emerald-700">{formatCurrency(selectedRecord.amount)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div><p className="text-xs text-gray-500 font-medium uppercase">Vendor</p><p className="mt-1 text-sm font-medium text-gray-900">{selectedRecord.vendorName}</p></div>
                <div><p className="text-xs text-gray-500 font-medium uppercase">Category</p><p className="mt-1 text-sm text-gray-900">{selectedRecord.category?.replace(/_/g, ' ')}</p></div>
                <div><p className="text-xs text-gray-500 font-medium uppercase">Department</p><p className="mt-1 text-sm text-gray-900">{selectedRecord.department || '-'}</p></div>
                <div><p className="text-xs text-gray-500 font-medium uppercase">Date</p><p className="mt-1 text-sm text-gray-900">{new Date(selectedRecord.transactionDate).toLocaleDateString()}</p></div>
              </div>
              {selectedRecord.description && (
                <div className="mb-4">
                  <p className="text-xs text-gray-500 font-medium uppercase mb-1">Description</p>
                  <p className="text-sm text-gray-700">{selectedRecord.description}</p>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button onClick={() => handleDelete(selectedRecord.id)} className="px-4 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 text-sm font-medium transition-colors">Delete</button>
                <button onClick={() => setSelectedRecord(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-sm font-medium transition-colors">Close</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
