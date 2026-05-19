'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout';
import { Button, DataTable, Badge, SearchInput, Modal, Tabs, Input, Select, Textarea, StatCard, TableSkeleton, CardSkeleton, ConfirmModal, BulkActionsBar, ExportButtons, useToast } from '@/components/ui';
import { CircularProgress } from '@/components/ui/ProgressBar';
import { ComplianceModal } from '@/components/entities/ComplianceModal';
import { Pagination } from '@/components/ui/Pagination';
import type { Column } from '@/components/ui/DataTable';
import { API_URL } from '@/lib/api';
import { validateForm, required } from '@/lib/validation';

interface ComplianceCheck {
  id: number;
  title: string;
  category: string;
  status: 'passed' | 'failed' | 'pending' | 'warning';
  last_check: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  vendor_id?: number;
  vendor_name?: string;
}

interface ComplianceStats {
  total_checks: number;
  passed: number;
  failed: number;
  pending: number;
  warnings: number;
  compliance_score: number;
  critical_issues: number;
}

const statusTabs = [
  { id: 'all', label: 'All' },
  { id: 'passed', label: 'Passed' },
  { id: 'failed', label: 'Failed' },
  { id: 'pending', label: 'Pending' },
  { id: 'warning', label: 'Warnings' },
];

export default function CompliancePage() {
  const [checks, setChecks] = useState<ComplianceCheck[]>([]);
  const [stats, setStats] = useState<ComplianceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCheck, setSelectedCheck] = useState<ComplianceCheck | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [newCheck, setNewCheck] = useState<{
    title: string;
    category: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    vendor_name: string;
  }>({
    title: '',
    category: '',
    description: '',
    severity: 'medium',
    vendor_name: '',
  });
  const [isAdding, setIsAdding] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchComplianceData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, searchQuery, statusFilter]);

  const fetchComplianceData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const [checksResponse, statsResponse] = await Promise.all([
        fetch(`${API_URL}/api/compliance/checks?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/compliance/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (checksResponse.ok) {
        const data = await checksResponse.json();
        setChecks(data.checks || []);
        setTotal(data.total || data.pagination?.total || 0);
        setTotalPages(data.totalPages || data.pagination?.totalPages || 1);
      } else {
        showToast('Failed to load compliance checks', 'error');
      }

      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data);
      } else {
        showToast('Failed to load compliance stats', 'error');
      }
    } catch (error) {
      console.error('Error fetching compliance data:', error);
      showToast('Failed to load compliance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(newCheck, {
      title: [required('Title')],
      category: [required('Category')],
    });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIsAdding(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/compliance/checks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCheck),
      });

      if (response.ok) {
        setNewCheck({
          title: '',
          category: '',
          description: '',
          severity: 'medium',
          vendor_name: '',
        });
        setShowAddModal(false);
        fetchComplianceData();
        showToast('Compliance check added successfully', 'success');
      } else {
        showToast('Failed to add compliance check', 'error');
      }
    } catch (error) {
      console.error('Error adding compliance check:', error);
      showToast('Failed to add compliance check', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleCheckUpdate = (updatedCheck: ComplianceCheck) => {
    setChecks((prev) =>
      prev.map((c) => (c.id === updatedCheck.id ? updatedCheck : c))
    );
    setSelectedCheck(updatedCheck);
    showToast('Compliance check updated successfully', 'success');
    // Refresh stats
    fetchComplianceData();
  };

  const handleCheckDelete = (id: number) => {
    setChecks((prev) => prev.filter((c) => c.id !== id));
    showToast('Compliance check deleted successfully', 'success');
    fetchComplianceData();
  };

  const handleRowClick = (check: ComplianceCheck) => {
    setSelectedCheck(check);
    setIsModalOpen(true);
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/compliance/bulk`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (response.ok) {
        setChecks((prev) => prev.filter((c) => !selectedIds.has(c.id.toString())));
        showToast(`${selectedIds.size} compliance check(s) deleted`, 'success');
        setSelectedIds(new Set());
        fetchComplianceData();
      } else {
        showToast('Bulk delete failed', 'error');
      }
    } catch (error) {
      showToast('Bulk delete failed', 'error');
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteConfirm(false);
    }
  };

  const handleBulkUpdate = async (status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/compliance/bulk`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(selectedIds), data: { status } }),
      });
      if (response.ok) {
        setChecks((prev) =>
          prev.map((c) =>
            selectedIds.has(c.id.toString())
              ? { ...c, status: status as ComplianceCheck['status'] }
              : c
          )
        );
        showToast(`${selectedIds.size} compliance check(s) updated`, 'success');
        setSelectedIds(new Set());
        fetchComplianceData();
      } else {
        showToast('Bulk update failed', 'error');
      }
    } catch (error) {
      showToast('Bulk update failed', 'error');
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' => {
    switch (status) {
      case 'passed': return 'success';
      case 'failed': return 'danger';
      case 'pending': return 'warning';
      case 'warning': return 'warning';
      default: return 'neutral';
    }
  };

  const getSeverityVariant = (severity: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' => {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'neutral';
    }
  };

  const columns: Column<ComplianceCheck>[] = [
    {
      key: 'title',
      header: 'Check',
      sortable: true,
      render: (check) => (
        <div>
          <p className="font-medium text-gray-900">{check.title}</p>
          <p className="text-sm text-gray-500">{check.category}</p>
        </div>
      ),
    },
    {
      key: 'vendor_name',
      header: 'Vendor',
      render: (check) => (
        <span className="text-gray-600">{check.vendor_name || 'System-wide'}</span>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      sortable: true,
      render: (check) => (
        <Badge variant={getSeverityVariant(check.severity)}>
          {check.severity.charAt(0).toUpperCase() + check.severity.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (check) => (
        <Badge variant={getStatusVariant(check.status)}>
          {check.status.charAt(0).toUpperCase() + check.status.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'last_check',
      header: 'Last Check',
      sortable: true,
      render: (check) => (
        <span className="text-sm text-gray-500">
          {new Date(check.last_check).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (check) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(check);
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
        title="Compliance"
        subtitle="Monitor regulatory compliance and audit trails"
        actions={
          <Button onClick={() => setShowAddModal(true)}>
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Check
          </Button>
        }
      />

      <div className="p-6">
        {/* Stats Overview */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <CardSkeleton />
            <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {/* Compliance Score Donut */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col items-center justify-center">
              <CircularProgress
                value={stats?.compliance_score || 0}
                size={140}
                strokeWidth={12}
                variant={
                  (stats?.compliance_score || 0) >= 80
                    ? 'success'
                    : (stats?.compliance_score || 0) >= 60
                    ? 'warning'
                    : 'danger'
                }
                label="Score"
              />
              <p className="mt-2 text-sm text-gray-500">Compliance Score</p>
            </div>

            {/* Other Stats */}
            <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Total Checks"
                value={stats?.total_checks || 0}
                icon={
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
              />
              <StatCard
                title="Passed"
                value={stats?.passed || 0}
                icon={
                  <svg className="w-6 h-6 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                }
              />
              <StatCard
                title="Failed"
                value={stats?.failed || 0}
                icon={
                  <svg className="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                }
              />
              <StatCard
                title="Critical Issues"
                value={stats?.critical_issues || 0}
                icon={
                  <svg className="w-6 h-6 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                }
              />
            </div>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <Tabs
            tabs={statusTabs}
            activeTab={statusFilter}
            onChange={setStatusFilter}
          />
        </div>

        {/* Search + Export */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                placeholder="Search compliance checks..."
                onSearch={setSearchQuery}
              />
            </div>
            <ExportButtons entity="compliance" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          {loading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : (
            <>
              <DataTable
                columns={columns}
                data={checks}
                keyExtractor={(check) => check.id.toString()}
                onRowClick={handleRowClick}
                isLoading={false}
                emptyMessage="No compliance checks found"
                emptyAction={{ label: 'Add Check', onClick: () => setShowAddModal(true) }}
                searchQuery={searchQuery}
                selectedKey={selectedCheck?.id?.toString()}
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
        entityName="compliance check"
        updateOptions={[
          { value: 'passed', label: 'Passed' },
          { value: 'failed', label: 'Failed' },
          { value: 'pending', label: 'Pending' },
          { value: 'warning', label: 'Warning' },
        ]}
      />

      {/* Bulk Delete Confirm */}
      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Compliance Checks"
        message={`Are you sure you want to delete ${selectedIds.size} compliance check(s)? This action cannot be undone.`}
        confirmText="Delete All"
        isLoading={isBulkDeleting}
      />

      {/* Compliance Check Detail Modal */}
      <ComplianceModal
        check={selectedCheck}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedCheck(null);
        }}
        onUpdate={handleCheckUpdate}
        onDelete={handleCheckDelete}
      />

      {/* Add Compliance Check Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setFormErrors({}); }}
        title="Add Compliance Check"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowAddModal(false); setFormErrors({}); }}>
              Cancel
            </Button>
            <Button onClick={handleAddCheck} isLoading={isAdding}>
              Add Check
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddCheck} className="space-y-4">
          <div>
            <Input
              label="Check Title"
              value={newCheck.title}
              onChange={(e) => setNewCheck({ ...newCheck, title: e.target.value })}
              required
            />
            {formErrors.title && <p className="text-sm text-danger mt-1">{formErrors.title}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select
                label="Category"
                value={newCheck.category}
                onChange={(value) => setNewCheck({ ...newCheck, category: value })}
                options={[
                  { value: '', label: 'Select Category' },
                  { value: 'Financial', label: 'Financial' },
                  { value: 'Legal', label: 'Legal' },
                  { value: 'Security', label: 'Security' },
                  { value: 'Quality', label: 'Quality' },
                  { value: 'Environmental', label: 'Environmental' },
                  { value: 'Data Protection', label: 'Data Protection' },
                ]}
                required
              />
              {formErrors.category && <p className="text-sm text-danger mt-1">{formErrors.category}</p>}
            </div>
            <Select
              label="Severity"
              value={newCheck.severity}
              onChange={(value) => setNewCheck({ ...newCheck, severity: value as 'low' | 'medium' | 'high' | 'critical' })}
              options={[
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
                { value: 'critical', label: 'Critical' },
              ]}
            />
          </div>
          <Input
            label="Vendor Name (Optional)"
            value={newCheck.vendor_name}
            onChange={(e) => setNewCheck({ ...newCheck, vendor_name: e.target.value })}
          />
          <Textarea
            label="Description"
            value={newCheck.description}
            onChange={(e) => setNewCheck({ ...newCheck, description: e.target.value })}
            rows={3}
          />
        </form>
      </Modal>
    </>
  );
}
