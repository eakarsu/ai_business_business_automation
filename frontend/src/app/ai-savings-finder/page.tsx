'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';

interface SavingsOpportunity {
  id: string;
  title: string;
  description: string;
  category: string;
  savingsType: string;
  currentSpend: number;
  projectedSavings: number;
  savingsPercentage: number;
  confidence: number;
  implementationEffort: string;
  timeToRealize: number;
  riskLevel: string;
  status: string;
  vendorName: string;
  aiRecommendation: string;
  actionItems: string[];
}

interface SavingsSummary {
  totalOpportunities: number;
  totalProjectedSavings: number;
  totalRealizedSavings: number;
  averageConfidence: number;
  byStatus: Record<string, { count: number; amount: number }>;
  byType: Record<string, { count: number; amount: number }>;
}

export default function AISavingsFinderPage() {
  const [opportunities, setOpportunities] = useState<SavingsOpportunity[]>([]);
  const [summary, setSummary] = useState<SavingsSummary | null>(null);
  const [selectedOpp, setSelectedOpp] = useState<SavingsOpportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [finding, setFinding] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetchData(token);
  }, [router]);

  const fetchData = async (token: string) => {
    try {
      const [oppRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/api/savings`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_URL}/api/savings/analytics/summary`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (oppRes.ok) {
        const data = await oppRes.json();
        setOpportunities(data.opportunities || []);
      }
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data.summary);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const findSavings = async () => {
    setFinding(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/savings/find`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (response.ok) {
        fetchData(token!);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setFinding(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_URL}/api/savings/${id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      fetchData(token!);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this opportunity?')) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_URL}/api/savings/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
      });
      setOpportunities(opportunities.filter(o => o.id !== id));
      if (selectedOpp?.id === id) setSelectedOpp(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const formatCurrency = (amount: number) => `$${amount?.toLocaleString() || 0}`;

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; dot: string }> = {
      IDENTIFIED: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
      UNDER_REVIEW: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
      APPROVED: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
      IMPLEMENTING: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
      REALIZED: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
      REJECTED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
    };
    return configs[status] || { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-500' };
  };

  const getRiskConfig = (risk: string) => {
    const configs: Record<string, { bg: string; text: string; icon: string }> = {
      LOW: { bg: 'bg-green-50 border-green-200', text: 'text-green-700', icon: 'text-green-500' },
      MEDIUM: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: 'text-amber-500' },
      HIGH: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: 'text-red-500' },
    };
    return configs[risk] || { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-700', icon: 'text-gray-500' };
  };

  const getEffortConfig = (effort: string) => {
    const configs: Record<string, { color: string; label: string; width: string }> = {
      low: { color: 'bg-green-500', label: 'Low Effort', width: 'w-1/3' },
      medium: { color: 'bg-amber-500', label: 'Medium Effort', width: 'w-2/3' },
      high: { color: 'bg-red-500', label: 'High Effort', width: 'w-full' },
    };
    return configs[effort] || { color: 'bg-gray-500', label: effort, width: 'w-1/2' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-100"></div>
          <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">AI Savings Finder</h1>
              <p className="text-sm text-gray-500">Discover cost-saving opportunities with AI</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={findSavings} disabled={finding}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition-all shadow-sm">
              {finding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Finding Savings...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Find Savings
                </>
              )}
            </button>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-gray-600 px-4 py-2.5 rounded-xl border border-gray-200 hover:bg-white transition-all">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">Opportunities Found</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{summary?.totalOpportunities || opportunities.length || 0}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">Projected Savings</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(summary?.totalProjectedSavings || 0)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">Realized Savings</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{formatCurrency(summary?.totalRealizedSavings || 0)}</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                </svg>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-500">Avg Confidence</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{(summary?.averageConfidence || 0).toFixed(0)}%</p>
          </div>
        </div>

        {/* Status Pipeline */}
        {summary?.byStatus && Object.keys(summary.byStatus).length > 0 && (
          <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-5 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Savings Pipeline
            </h3>
            <div className="flex gap-3">
              {Object.entries(summary.byStatus).map(([status, data]) => {
                const config = getStatusConfig(status);
                return (
                  <div key={status} className={`flex-1 ${config.bg} rounded-xl p-4 border border-gray-100`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-2 h-2 rounded-full ${config.dot}`}></div>
                      <p className={`text-xs font-semibold ${config.text} uppercase tracking-wide`}>{status.replace(/_/g, ' ')}</p>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{data.count}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{formatCurrency(data.amount)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Finding animation */}
        {finding && (
          <div className="bg-white shadow-sm rounded-2xl border border-gray-100 p-8 mb-6">
            <div className="text-center">
              <div className="relative mx-auto w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
                <div className="absolute inset-3 rounded-full bg-emerald-50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
              <p className="font-medium text-gray-900">AI is searching for savings opportunities...</p>
              <p className="text-sm text-gray-500 mt-1">Analyzing spend patterns, vendor contracts, and market data</p>
            </div>
          </div>
        )}

        {/* Opportunities List + Detail */}
        <div className="flex gap-6">
          <div className={selectedOpp ? 'w-5/12' : 'w-full'}>
            <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  Savings Opportunities
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium">{opportunities.length}</span>
                </h3>
              </div>
              <ul className="divide-y divide-gray-50 max-h-[70vh] overflow-y-auto">
                {opportunities.length === 0 ? (
                  <li className="p-8 text-center">
                    <div className="inline-flex p-4 bg-emerald-50 rounded-full mb-3">
                      <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 mb-2">No opportunities found yet</p>
                    <button onClick={findSavings} className="text-sm text-emerald-600 font-medium hover:text-emerald-700">
                      Click &quot;Find Savings&quot; to discover opportunities
                    </button>
                  </li>
                ) : opportunities.map(opp => {
                  const statusConfig = getStatusConfig(opp.status);
                  const riskConfig = getRiskConfig(opp.riskLevel);
                  return (
                    <li key={opp.id}
                      className={`p-4 hover:bg-emerald-50/30 cursor-pointer transition-colors ${selectedOpp?.id === opp.id ? 'bg-emerald-50/50 border-l-3 border-emerald-500' : ''}`}
                      onClick={() => setSelectedOpp(opp)}>
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{opp.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{opp.category?.replace(/_/g, ' ')} &middot; {opp.vendorName || 'Multiple vendors'}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-lg font-bold text-emerald-600">{formatCurrency(opp.projectedSavings)}</span>
                            <span className="text-xs text-gray-400">({opp.savingsPercentage?.toFixed(1)}% savings)</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}></span>
                            {opp.status.replace(/_/g, ' ')}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${riskConfig.bg} ${riskConfig.text}`}>
                            {opp.riskLevel} risk
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          {/* Detail Panel */}
          {selectedOpp && (
            <div className="w-7/12">
              <div className="bg-white shadow-sm rounded-2xl border border-gray-100 overflow-hidden">
                {/* Detail Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{selectedOpp.title}</h3>
                      <p className="text-emerald-100 text-sm mt-0.5">{selectedOpp.category?.replace(/_/g, ' ')} &middot; {selectedOpp.savingsType?.replace(/_/g, ' ')}</p>
                    </div>
                    <button onClick={() => setSelectedOpp(null)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                  {/* Savings Summary */}
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <p className="text-xs text-emerald-200">Current Spend</p>
                      <p className="text-xl font-bold text-white mt-0.5">{formatCurrency(selectedOpp.currentSpend)}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <p className="text-xs text-emerald-200">Projected Savings</p>
                      <p className="text-xl font-bold text-white mt-0.5">{formatCurrency(selectedOpp.projectedSavings)}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <p className="text-xs text-emerald-200">Savings Rate</p>
                      <p className="text-xl font-bold text-white mt-0.5">{selectedOpp.savingsPercentage?.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-2">Confidence Score</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                          <div className={`h-2.5 rounded-full transition-all ${
                            selectedOpp.confidence >= 70 ? 'bg-emerald-500' :
                            selectedOpp.confidence >= 40 ? 'bg-amber-500' : 'bg-red-500'
                          }`} style={{ width: `${selectedOpp.confidence}%` }}></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{selectedOpp.confidence}%</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-2">Implementation Effort</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                          <div className={`h-2.5 rounded-full ${getEffortConfig(selectedOpp.implementationEffort).color} ${getEffortConfig(selectedOpp.implementationEffort).width}`}></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{getEffortConfig(selectedOpp.implementationEffort).label}</span>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Time to Realize</p>
                      <p className="text-lg font-bold text-gray-900">{selectedOpp.timeToRealize} <span className="text-sm font-normal text-gray-500">days</span></p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Vendor</p>
                      <p className="text-sm font-medium text-gray-900">{selectedOpp.vendorName || 'Multiple vendors'}</p>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedOpp.description && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Description</h4>
                      <p className="text-sm text-gray-700 leading-relaxed">{selectedOpp.description}</p>
                    </div>
                  )}

                  {/* AI Recommendation */}
                  {selectedOpp.aiRecommendation && (
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-semibold text-blue-900 text-sm mb-1">AI Recommendation</h4>
                          <p className="text-sm text-blue-800 leading-relaxed">{selectedOpp.aiRecommendation}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Items */}
                  {selectedOpp.actionItems && selectedOpp.actionItems.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Action Items</h4>
                      <div className="space-y-2">
                        {selectedOpp.actionItems.map((item, i) => (
                          <div key={i} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                              {i + 1}
                            </span>
                            <span className="text-sm text-gray-700 mt-0.5">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Status Update */}
                  <div className="border-t border-gray-100 pt-5">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Update Status</h4>
                    <div className="flex flex-wrap gap-2">
                      {['IDENTIFIED', 'UNDER_REVIEW', 'APPROVED', 'IMPLEMENTING', 'REALIZED', 'REJECTED'].map(status => {
                        const config = getStatusConfig(status);
                        const isActive = selectedOpp.status === status;
                        return (
                          <button key={status} onClick={() => updateStatus(selectedOpp.id, status)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              isActive
                                ? `${config.bg} ${config.text} ring-2 ring-offset-1 ring-current`
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? config.dot : 'bg-gray-400'}`}></span>
                            {status.replace(/_/g, ' ')}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button onClick={() => handleDelete(selectedOpp.id)}
                      className="px-4 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 text-sm font-medium transition-colors">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
