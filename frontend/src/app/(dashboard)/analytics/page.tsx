'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout';
import { Card } from '@/components/ui';
import { API_URL } from '@/lib/api';

interface DashboardStats {
  totalVendors: number;
  activeBids: number;
  pendingApprovals: number;
  completedProcurements: number;
  monthlySpending: number;
  complianceScore: number;
}

interface FinancialData {
  totalSpend: number;
  transactionCount: number;
  savingsAchieved: number;
  projectedSavings: number;
  spendByCategory: { category: string; amount: number }[];
  monthlySpend: { month: string; amount: number }[];
}

interface BidData {
  total: number;
  active: number;
  completed: number;
  awarded: number;
  rejected: number;
  byMonth: { month: string; count: number }[];
}

interface VendorData {
  total: number;
  active: number;
  byQualification: { qualified: number; pending: number; disqualified: number };
  topVendors: { name: string; overallScore: number; riskLevel: string }[];
}

interface ComplianceData {
  total: number;
  compliant: number;
  nonCompliant: number;
  pending: number;
  avgScore: number;
}

function KPICard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-5 ${color ? `border-l-4 ${color}` : ''}`}>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export default function AnalyticsDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [financial, setFinancial] = useState<FinancialData | null>(null);
  const [bids, setBids] = useState<BidData | null>(null);
  const [vendors, setVendors] = useState<VendorData | null>(null);
  const [compliance, setCompliance] = useState<ComplianceData | null>(null);
  const [aiStats, setAiStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API_URL}/api/dashboard/stats`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/api/dashboard/financial`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/api/dashboard/bids`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/api/dashboard/vendors`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/api/dashboard/compliance`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/api/ai/stats`, { headers }).then(r => r.json()),
    ])
      .then(([s, f, b, v, c, a]) => {
        setStats(s);
        setFinancial(f.data);
        setBids(b.data);
        setVendors(v.data);
        setCompliance(c.data);
        setAiStats(a.data?.stats);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const winRate = bids && bids.total > 0 ? Math.round((bids.awarded / bids.total) * 100) : 0;
  const vendorQualRate = vendors && vendors.total > 0
    ? Math.round(((vendors.byQualification?.qualified || 0) / vendors.total) * 100)
    : 0;

  return (
    <>
      <PageHeader
        title="Executive Analytics"
        subtitle="Cross-entity KPIs and procurement performance overview"
      />
      <div className="p-6 space-y-8">

        {/* Top KPIs */}
        <section>
          <h2 className="text-base font-semibold text-gray-700 mb-3">Key Performance Indicators</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard label="Total Vendors" value={vendors?.total ?? '—'} sub={`${vendors?.active ?? 0} active`} color="border-blue-500" />
            <KPICard label="Active Bids" value={bids?.active ?? '—'} sub={`${bids?.total ?? 0} total bids`} color="border-indigo-500" />
            <KPICard label="Bid Win Rate" value={`${winRate}%`} sub={`${bids?.awarded ?? 0} awarded`} color="border-green-500" />
            <KPICard label="Compliance Score" value={`${compliance?.avgScore ?? stats?.complianceScore ?? '—'}%`} sub={`${compliance?.total ?? 0} checks`} color="border-yellow-500" />
          </div>
        </section>

        {/* Financial KPIs */}
        <section>
          <h2 className="text-base font-semibold text-gray-700 mb-3">Financial Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <KPICard label="Total Spend" value={financial ? formatCurrency(financial.totalSpend) : '—'} sub={`${financial?.transactionCount ?? 0} transactions`} color="border-purple-500" />
            <KPICard label="Savings Achieved" value={financial ? formatCurrency(financial.savingsAchieved) : '—'} color="border-green-600" />
            <KPICard label="Projected Savings" value={financial ? formatCurrency(financial.projectedSavings) : '—'} color="border-teal-500" />
            <KPICard label="Pending Compliance" value={stats?.pendingApprovals ?? '—'} sub="require review" color="border-orange-500" />
          </div>
        </section>

        {/* Spend by Category */}
        {financial?.spendByCategory && financial.spendByCategory.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-700 mb-3">Spend by Category (Top 8)</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="space-y-2">
                {financial.spendByCategory.slice(0, 8).map((item, i) => {
                  const max = financial.spendByCategory[0]?.amount || 1;
                  const pct = Math.round((item.amount / max) * 100);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-xs text-gray-500 w-36 truncate">{item.category.replace(/_/g, ' ')}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-3">
                        <div className="bg-indigo-500 h-3 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-medium text-gray-700 w-20 text-right">{formatCurrency(item.amount)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Vendor Quality & AI Stats */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Vendors */}
          {vendors?.topVendors && vendors.topVendors.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-base font-semibold text-gray-700 mb-3">Top Vendor Scorecards</h2>
              <div className="space-y-2">
                {vendors.topVendors.map((v, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400 w-4">{i + 1}</span>
                      <span className="text-sm font-medium text-gray-900 truncate max-w-[160px]">{v.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${v.riskLevel === 'LOW' ? 'bg-green-100 text-green-700' : v.riskLevel === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {v.riskLevel}
                      </span>
                      <span className="text-sm font-bold text-indigo-600">{v.overallScore?.toFixed(0) ?? '—'}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex gap-3 text-xs text-gray-500">
                <span>Qualified: <strong>{vendors.byQualification?.qualified ?? 0}</strong></span>
                <span>Pending: <strong>{vendors.byQualification?.pending ?? 0}</strong></span>
                <span>Qualification Rate: <strong>{vendorQualRate}%</strong></span>
              </div>
            </div>
          )}

          {/* AI Statistics */}
          {aiStats && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h2 className="text-base font-semibold text-gray-700 mb-3">AI Analysis Statistics</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded p-3 text-center">
                  <p className="text-xl font-bold text-indigo-600">{aiStats.totalAnalyses ?? 0}</p>
                  <p className="text-xs text-gray-500">Total Analyses</p>
                </div>
                <div className="bg-gray-50 rounded p-3 text-center">
                  <p className="text-xl font-bold text-green-600">{aiStats.complianceChecks ?? 0}</p>
                  <p className="text-xs text-gray-500">Compliance Checks</p>
                </div>
                <div className="bg-gray-50 rounded p-3 text-center">
                  <p className="text-xl font-bold text-blue-600">{Math.round(aiStats.complianceImprovement ?? 0)}%</p>
                  <p className="text-xs text-gray-500">Compliance Rate</p>
                </div>
                <div className="bg-gray-50 rounded p-3 text-center">
                  <p className="text-xl font-bold text-purple-600">{aiStats.vendorAnalyses ?? 0}</p>
                  <p className="text-xs text-gray-500">Vendor Analyses</p>
                </div>
              </div>
              {aiStats.riskMitigation && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1">Risk Distribution</p>
                  <div className="flex gap-2 text-xs">
                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">Low: {aiStats.riskMitigation.lowRiskVendors}</span>
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Med: {aiStats.riskMitigation.mediumRiskVendors}</span>
                    <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded">High: {aiStats.riskMitigation.highRiskVendors}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Monthly Spend Trend */}
        {financial?.monthlySpend && financial.monthlySpend.length > 0 && (
          <section>
            <h2 className="text-base font-semibold text-gray-700 mb-3">Monthly Spend Trend</h2>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-end gap-2 h-32">
                {financial.monthlySpend.slice(-12).map((m, i) => {
                  const max = Math.max(...financial.monthlySpend.map(x => x.amount), 1);
                  const pct = (m.amount / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-xs text-gray-400" title={formatCurrency(m.amount)}>{formatCurrency(m.amount)}</span>
                      <div className="w-full bg-indigo-100 rounded-t" style={{ height: `${Math.max(pct, 4)}%`, minHeight: '4px' }}>
                        <div className="w-full h-full bg-indigo-500 rounded-t opacity-80" />
                      </div>
                      <span className="text-xs text-gray-400">{m.month.slice(5)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
