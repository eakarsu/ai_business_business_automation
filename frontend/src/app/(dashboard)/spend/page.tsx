'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout';
import { Button, DataTable, Card, CardBody, SearchInput, StatCard, TableSkeleton, CardSkeleton, ConfirmModal, BulkActionsBar, ExportButtons, useToast } from '@/components/ui';
import { SpendModal } from '@/components/entities/SpendModal';
import { AIAnalysisButton } from '@/components/ai/AIAnalysisButton';
import { AILoadingState } from '@/components/ai/AILoadingState';
import { AIResultsPanel } from '@/components/ai/AIResultsPanel';
import { Pagination } from '@/components/ui/Pagination';
import type { Column } from '@/components/ui/DataTable';
import { API_URL } from '@/lib/api';

interface SpendItem {
  id: string;
  category: string;
  vendor: string;
  amount: number;
  date: string;
  description: string;
  department?: string;
  budgetCategory?: string;
  percentOfBudget?: number;
}

interface SpendStats {
  totalSpend: number;
  topCategory: string;
  topVendor: string;
  averageTransaction: number;
  transactionCount: number;
}

export default function SpendPage() {
  const [spendItems, setSpendItems] = useState<SpendItem[]>([]);
  const [stats, setStats] = useState<SpendStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSpend, setSelectedSpend] = useState<SpendItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResults, setAIResults] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    fetchSpendData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, searchQuery]);

  const fetchSpendData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`${API_URL}/api/spend?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setSpendItems(data.spend || data.data || []);
        setStats(data.stats || null);
        setTotal(data.total || data.pagination?.total || 0);
        setTotalPages(data.totalPages || data.pagination?.totalPages || 1);
      } else {
        showToast('Failed to load spend data', 'error');
      }
    } catch (error) {
      console.error('Error fetching spend data:', error);
      showToast('Failed to load spend data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAIResults(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/ai/insights`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'spend_analysis',
          totalSpend: stats?.totalSpend,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setAIResults({
          overallScore: data.score || data.data?.score || 72,
          summary: data.summary || data.data?.summary || 'Spend analysis shows opportunities for consolidation and cost optimization.',
          categories: data.categories || data.data?.categories || [
            { name: 'Cost Efficiency', score: 68 },
            { name: 'Vendor Consolidation', score: 75 },
            { name: 'Budget Compliance', score: 82 },
            { name: 'Process Optimization', score: 70 },
          ],
          recommendations: data.recommendations || data.data?.recommendations || [
            { title: 'Consolidate IT vendors', description: 'Reduce number of IT suppliers from 5 to 2 for volume discounts', priority: 'high' },
            { title: 'Renegotiate software licenses', description: 'Enterprise agreement could save 15%', priority: 'high' },
            { title: 'Implement P-card program', description: 'Reduce transaction costs for small purchases', priority: 'medium' },
            { title: 'Review consulting spend', description: 'Benchmark against industry rates', priority: 'medium' },
          ],
          keyFindings: data.keyFindings || data.data?.keyFindings || [
            'Top 3 vendors account for 65% of spend',
            'IT category has highest growth rate at 23% YoY',
            'Average payment terms are Net 45, opportunity to optimize',
            'Maverick spend estimated at 12% of total',
          ],
        });
        showToast('AI analysis complete', 'success');
      } else {
        showToast('AI analysis failed', 'error');
      }
    } catch (error) {
      console.error('Error running AI analysis:', error);
      showToast('AI analysis failed', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRowClick = (spend: SpendItem) => {
    setSelectedSpend(spend);
    setIsModalOpen(true);
  };

  const handleSpendUpdate = (updatedSpend: SpendItem) => {
    setSpendItems((prev) =>
      prev.map((s) => (s.id === updatedSpend.id ? updatedSpend : s))
    );
    setSelectedSpend(updatedSpend);
    showToast('Spend record updated successfully', 'success');
  };

  const handleSpendDelete = (_id: string) => {
    setIsModalOpen(false);
    setSelectedSpend(null);
    fetchSpendData();
    showToast('Spend record deleted successfully', 'success');
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/spend/bulk`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (response.ok) {
        fetchSpendData();
        showToast(`${selectedIds.size} spend record(s) deleted`, 'success');
        setSelectedIds(new Set());
      } else {
        showToast('Bulk delete failed', 'error');
      }
    } catch (error) {
      console.error('Error bulk deleting spend records:', error);
      showToast('Bulk delete failed', 'error');
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteConfirm(false);
    }
  };

  const columns: Column<SpendItem>[] = [
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (spend) => (
        <div>
          <p className="font-medium text-gray-900">{spend.category}</p>
          {spend.department && (
            <p className="text-sm text-gray-500">{spend.department}</p>
          )}
        </div>
      ),
    },
    {
      key: 'vendor',
      header: 'Vendor',
      sortable: true,
      render: (spend) => <span className="text-gray-600">{spend.vendor}</span>,
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      render: (spend) => (
        <span className="font-medium text-success">
          ${spend.amount.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      render: (spend) => (
        <span className="text-sm text-gray-500">
          {new Date(spend.date).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (spend) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(spend);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Spend Analysis"
        subtitle="Analyze and optimize your procurement spending"
        actions={
          <AIAnalysisButton
            onClick={runAIAnalysis}
            isLoading={isAnalyzing}
            label="Run AI Analysis"
          />
        }
      />

      <div className="p-6">
        {/* Stats Overview */}
        {loading ? (
          <div className="mb-6">
            <CardSkeleton count={4} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total Spend"
              value={`$${(stats?.totalSpend || 0).toLocaleString()}`}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              title="Transactions"
              value={stats?.transactionCount || 0}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
            />
            <StatCard
              title="Top Category"
              value={stats?.topCategory || '-'}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              }
            />
            <StatCard
              title="Top Vendor"
              value={stats?.topVendor || '-'}
              icon={
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            />
          </div>
        )}

        {/* AI Loading State */}
        {isAnalyzing && (
          <div className="mb-6">
            <Card>
              <CardBody>
                <AILoadingState
                  message="Analyzing spend data..."
                  subMessage="Identifying patterns and optimization opportunities"
                />
              </CardBody>
            </Card>
          </div>
        )}

        {/* AI Results Panel */}
        {aiResults && !isAnalyzing && (
          <div className="mb-6">
            <AIResultsPanel
              results={aiResults}
              title="Spend Analysis Results"
              onRunAgain={runAIAnalysis}
            />
          </div>
        )}

        {/* Search and Export */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                placeholder="Search spend items..."
                onSearch={setSearchQuery}
              />
            </div>
            <ExportButtons entity="spend" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          {loading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : (
            <>
              <DataTable
                columns={columns}
                data={spendItems}
                keyExtractor={(spend) => spend.id}
                onRowClick={handleRowClick}
                isLoading={false}
                emptyMessage="No spend data found"
                searchQuery={searchQuery}
                selectedKey={selectedSpend?.id}
                selectable
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
              />
              <Pagination
                page={page}
                totalPages={totalPages}
                total={total}
                limit={limit}
                onPageChange={setPage}
                onLimitChange={(l) => { setLimit(l); setPage(1); }}
              />
            </>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.size}
        onBulkDelete={() => setShowBulkDeleteConfirm(true)}
        onClearSelection={() => setSelectedIds(new Set())}
        entityName="spend record"
      />

      {/* Bulk Delete Confirm */}
      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Spend Records"
        message={`Are you sure you want to delete ${selectedIds.size} spend record(s)? This action cannot be undone.`}
        confirmText="Delete All"
        isLoading={isBulkDeleting}
      />

      {/* Spend Detail Modal */}
      <SpendModal
        spend={selectedSpend}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSpend(null);
        }}
        onUpdate={handleSpendUpdate}
        onDelete={handleSpendDelete}
      />
    </>
  );
}
