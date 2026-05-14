'use client';

import { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/layout';
import { Button, DataTable, Badge, SearchInput, StatCard, Card, CardBody, TableSkeleton, CardSkeleton, ConfirmModal, BulkActionsBar, ExportButtons, useToast } from '@/components/ui';
import { SavingsModal } from '@/components/entities/SavingsModal';
import { AIAnalysisButton } from '@/components/ai/AIAnalysisButton';
import { AILoadingState } from '@/components/ai/AILoadingState';
import { Pagination } from '@/components/ui/Pagination';
import type { Column } from '@/components/ui/DataTable';
import { API_URL } from '@/lib/api';

interface SavingsOpportunity {
  id: string;
  title: string;
  category: string;
  type: string;
  potentialSavings: number;
  currentSpend: number;
  targetSpend: number;
  status: 'identified' | 'in_progress' | 'realized' | 'dismissed';
  vendor?: string;
  description?: string;
  implementationSteps?: string[];
  createdAt: string;
}

interface SavingsStats {
  totalOpportunities: number;
  projectedSavings: number;
  realizedSavings: number;
  inProgress: number;
}

// Mock data for demonstration
const mockSavingsData: SavingsOpportunity[] = [
  { id: '1', title: 'IT Vendor Consolidation', category: 'IT', type: 'Consolidation', potentialSavings: 125000, currentSpend: 500000, targetSpend: 375000, status: 'identified', vendor: 'Multiple', description: 'Consolidate 5 IT vendors into 2 preferred suppliers', createdAt: '2024-01-10' },
  { id: '2', title: 'Software License Optimization', category: 'IT', type: 'Optimization', potentialSavings: 45000, currentSpend: 180000, targetSpend: 135000, status: 'in_progress', vendor: 'Microsoft', description: 'Optimize license allocation based on actual usage', createdAt: '2024-01-12' },
  { id: '3', title: 'Office Supplies Renegotiation', category: 'Operations', type: 'Renegotiation', potentialSavings: 12000, currentSpend: 60000, targetSpend: 48000, status: 'realized', vendor: 'OfficeMax', description: 'Renegotiated contract for 20% discount', createdAt: '2024-01-05' },
  { id: '4', title: 'Travel Policy Update', category: 'HR', type: 'Policy', potentialSavings: 75000, currentSpend: 300000, targetSpend: 225000, status: 'identified', description: 'Implement stricter travel policy guidelines', createdAt: '2024-01-15' },
  { id: '5', title: 'Cloud Migration Savings', category: 'IT', type: 'Migration', potentialSavings: 200000, currentSpend: 600000, targetSpend: 400000, status: 'in_progress', vendor: 'AWS', description: 'Migrate legacy systems to cloud for cost reduction', createdAt: '2024-01-08' },
];

export default function SavingsPage() {
  const [savings, setSavings] = useState<SavingsOpportunity[]>([]);
  const [stats, setStats] = useState<SavingsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSavings, setSelectedSavings] = useState<SavingsOpportunity | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isFinding, setIsFinding] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const { showToast } = useToast();

  const calculateStats = useCallback((data: SavingsOpportunity[]) => {
    setStats({
      totalOpportunities: data.length,
      projectedSavings: data.reduce((sum, s) => sum + s.potentialSavings, 0),
      realizedSavings: data
        .filter((s) => s.status === 'realized')
        .reduce((sum, s) => sum + s.potentialSavings, 0),
      inProgress: data.filter((s) => s.status === 'in_progress').length,
    });
  }, []);

  const fetchSavingsData = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`${API_URL}/api/savings?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const items = data.savings || data.data || mockSavingsData;
        setSavings(items);
        calculateStats(items);
        setTotal(data.total || data.pagination?.total || items.length);
        setTotalPages(data.totalPages || data.pagination?.totalPages || 1);
      } else {
        setSavings(mockSavingsData);
        calculateStats(mockSavingsData);
      }
    } catch (error) {
      console.error('Error fetching savings:', error);
      setSavings(mockSavingsData);
      calculateStats(mockSavingsData);
    } finally {
      setLoading(false);
    }
  }, [calculateStats, page, limit, searchQuery]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    fetchSavingsData();
  }, [fetchSavingsData]);

  const findSavings = async () => {
    setIsFinding(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/ai/insights`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'savings_finder',
        }),
      });
      if (response.ok) {
        showToast('AI savings analysis complete', 'success');
        fetchSavingsData();
      } else {
        showToast('Failed to run AI savings analysis', 'error');
      }
    } catch (error) {
      console.error('Error finding savings:', error);
      showToast('Failed to run AI savings analysis', 'error');
    } finally {
      setIsFinding(false);
    }
  };

  const handleSavingsUpdate = (updatedSavings: SavingsOpportunity) => {
    const updated = savings.map((s) =>
      s.id === updatedSavings.id ? updatedSavings : s
    );
    setSavings(updated);
    setSelectedSavings(updatedSavings);
    calculateStats(updated);
    showToast('Savings opportunity updated successfully', 'success');
  };

  const handleSavingsDelete = (_id: string) => {
    fetchSavingsData();
    showToast('Savings opportunity deleted successfully', 'success');
  };

  const handleRowClick = (saving: SavingsOpportunity) => {
    setSelectedSavings(saving);
    setIsModalOpen(true);
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/savings/bulk`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (response.ok) {
        fetchSavingsData();
        showToast(`${selectedIds.size} savings opportunity(s) deleted`, 'success');
        setSelectedIds(new Set());
      } else {
        showToast('Bulk delete failed', 'error');
      }
    } catch (error) {
      console.error('Error bulk deleting savings:', error);
      showToast('Bulk delete failed', 'error');
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteConfirm(false);
    }
  };

  const handleBulkUpdate = async (status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/savings/bulk`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          data: { status },
        }),
      });
      if (response.ok) {
        const updated = savings.map((s) =>
          selectedIds.has(s.id)
            ? { ...s, status: status as SavingsOpportunity['status'] }
            : s
        );
        setSavings(updated);
        calculateStats(updated);
        showToast(`${selectedIds.size} savings opportunity(s) updated`, 'success');
        setSelectedIds(new Set());
      } else {
        showToast('Bulk update failed', 'error');
      }
    } catch (error) {
      console.error('Error bulk updating savings:', error);
      showToast('Bulk update failed', 'error');
    }
  };

  const getStatusVariant = (
    status: string
  ): 'success' | 'warning' | 'info' | 'neutral' => {
    switch (status) {
      case 'realized':
        return 'success';
      case 'in_progress':
        return 'warning';
      case 'identified':
        return 'info';
      case 'dismissed':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const columns: Column<SavingsOpportunity>[] = [
    {
      key: 'title',
      header: 'Opportunity',
      sortable: true,
      render: (saving) => (
        <div>
          <p className="font-medium text-gray-900">{saving.title}</p>
          <p className="text-sm text-gray-500">
            {saving.category} - {saving.type}
          </p>
        </div>
      ),
    },
    {
      key: 'vendor',
      header: 'Vendor',
      render: (saving) => (
        <span className="text-gray-600">{saving.vendor || '-'}</span>
      ),
    },
    {
      key: 'potentialSavings',
      header: 'Potential Savings',
      sortable: true,
      render: (saving) => (
        <span className="font-medium text-success">
          ${saving.potentialSavings.toLocaleString()}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (saving) => (
        <Badge variant={getStatusVariant(saving.status)}>
          {saving.status
            .replace('_', ' ')
            .charAt(0)
            .toUpperCase() + saving.status.replace('_', ' ').slice(1)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (saving) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(saving);
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
        title="Savings"
        subtitle="Discover and track cost-saving opportunities"
        actions={
          <AIAnalysisButton
            onClick={findSavings}
            isLoading={isFinding}
            label="Find Savings"
          />
        }
      />

      <div className="p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          {loading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : (
            <>
              <StatCard
                title="Total Opportunities"
                value={stats?.totalOpportunities || 0}
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                }
              />
              <StatCard
                title="Projected Savings"
                value={`$${(stats?.projectedSavings || 0).toLocaleString()}`}
                icon={
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                }
              />
              <StatCard
                title="Realized Savings"
                value={`$${(stats?.realizedSavings || 0).toLocaleString()}`}
                icon={
                  <svg
                    className="w-6 h-6 text-success"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />
              <StatCard
                title="In Progress"
                value={stats?.inProgress || 0}
                icon={
                  <svg
                    className="w-6 h-6 text-warning"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                }
              />
            </>
          )}
        </div>

        {/* Finding Savings Loading */}
        {isFinding && (
          <div className="mb-6">
            <Card>
              <CardBody>
                <AILoadingState
                  message="Finding savings opportunities..."
                  subMessage="Analyzing spend data and vendor contracts"
                />
              </CardBody>
            </Card>
          </div>
        )}

        {/* Search and Export */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                placeholder="Search savings opportunities..."
                onSearch={setSearchQuery}
              />
            </div>
            <ExportButtons entity="savings" />
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
                data={savings}
                keyExtractor={(saving) => saving.id}
                onRowClick={handleRowClick}
                isLoading={false}
                emptyMessage="No savings opportunities found"
                emptyAction={{ label: 'Find Savings', onClick: findSavings }}
                searchQuery={searchQuery}
                selectedKey={selectedSavings?.id}
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
        onBulkUpdate={handleBulkUpdate}
        onClearSelection={() => setSelectedIds(new Set())}
        entityName="savings opportunity"
        updateOptions={[
          { value: 'identified', label: 'Identified' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'realized', label: 'Realized' },
          { value: 'dismissed', label: 'Dismissed' },
        ]}
      />

      {/* Bulk Delete Confirm */}
      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Savings Opportunities"
        message={`Are you sure you want to delete ${selectedIds.size} savings opportunity(s)? This action cannot be undone.`}
        confirmText="Delete All"
        isLoading={isBulkDeleting}
      />

      {/* Savings Detail Modal */}
      <SavingsModal
        savings={selectedSavings}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSavings(null);
        }}
        onUpdate={handleSavingsUpdate}
        onDelete={handleSavingsDelete}
      />
    </>
  );
}
