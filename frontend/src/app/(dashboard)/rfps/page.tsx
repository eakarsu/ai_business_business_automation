'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout';
import { Button, DataTable, Badge, SearchInput, Modal, Input, Textarea, TableSkeleton, ConfirmModal, BulkActionsBar, ExportButtons, useToast } from '@/components/ui';
import { getStatusVariant } from '@/components/ui/Badge';
import { RFPModal } from '@/components/entities/RFPModal';
import type { Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { API_URL } from '@/lib/api';
import { validateForm, required } from '@/lib/validation';

interface RFP {
  id: string;
  title: string;
  rfpNumber: string;
  description: string;
  category: string;
  budget: number;
  deadline: string;
  status: string;
  requirements?: any;
  evaluationCriteria?: any;
  createdAt: string;
}

export default function RFPsPage() {
  const [rfps, setRFPs] = useState<RFP[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRFP, setSelectedRFP] = useState<RFP | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [newRFP, setNewRFP] = useState({
    title: '',
    category: '',
    budget: '',
    description: '',
    requirements: '',
  });
  const [isAdding, setIsAdding] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  useEffect(() => {
    fetchRFPs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, searchQuery]);

  const fetchRFPs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (searchQuery) params.set('search', searchQuery);

      const response = await fetch(`${API_URL}/api/rfps?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRFPs(data.rfps || data.data || []);
        setTotal(data.total || data.pagination?.total || 0);
        setTotalPages(data.totalPages || data.pagination?.totalPages || 1);
      } else {
        showToast('Failed to load RFPs', 'error');
      }
    } catch (error) {
      console.error('Error fetching RFPs:', error);
      showToast('Failed to load RFPs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRFP = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(newRFP, {
      title: [required('Title')],
    });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIsAdding(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/rfps`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newRFP,
          rfpNumber: `RFP-${Date.now()}`,
          budget: parseFloat(newRFP.budget) || 0,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'DRAFT',
        }),
      });
      if (response.ok) {
        setNewRFP({
          title: '',
          category: '',
          budget: '',
          description: '',
          requirements: '',
        });
        setShowAddModal(false);
        fetchRFPs();
        showToast('RFP created successfully', 'success');
      } else {
        showToast('Failed to create RFP', 'error');
      }
    } catch (error) {
      console.error('Error adding RFP:', error);
      showToast('Failed to create RFP', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRFPUpdate = (updatedRFP: RFP) => {
    setRFPs((prev) => prev.map((r) => (r.id === updatedRFP.id ? updatedRFP : r)));
    setSelectedRFP(updatedRFP);
    showToast('RFP updated successfully', 'success');
  };

  const handleRFPDelete = (_id: string) => {
    fetchRFPs();
    showToast('RFP deleted successfully', 'success');
  };

  const handleRowClick = (rfp: RFP) => {
    setSelectedRFP(rfp);
    setIsModalOpen(true);
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/rfps/bulk`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (response.ok) {
        fetchRFPs();
        showToast(`${selectedIds.size} RFP(s) deleted`, 'success');
        setSelectedIds(new Set());
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
      const response = await fetch(`${API_URL}/api/rfps/bulk`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(selectedIds), data: { status } }),
      });
      if (response.ok) {
        setRFPs((prev) =>
          prev.map((r) =>
            selectedIds.has(r.id) ? { ...r, status } : r
          )
        );
        showToast(`${selectedIds.size} RFP(s) updated`, 'success');
        setSelectedIds(new Set());
      } else {
        showToast('Bulk update failed', 'error');
      }
    } catch (error) {
      showToast('Bulk update failed', 'error');
    }
  };

  const columns: Column<RFP>[] = [
    {
      key: 'title',
      header: 'RFP',
      sortable: true,
      render: (rfp) => (
        <div>
          <p className="font-medium text-gray-900">{rfp.title}</p>
          <p className="text-sm text-gray-500">{rfp.rfpNumber}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (rfp) => <span className="text-gray-600">{rfp.category || '-'}</span>,
    },
    {
      key: 'budget',
      header: 'Budget',
      sortable: true,
      render: (rfp) => (
        <span className="font-medium text-success">
          ${rfp.budget?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (rfp) => (
        <Badge variant={getStatusVariant(rfp.status)}>{rfp.status}</Badge>
      ),
    },
    {
      key: 'deadline',
      header: 'Deadline',
      sortable: true,
      render: (rfp) => (
        <span className="text-sm text-gray-500">
          {new Date(rfp.deadline).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (rfp) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(rfp);
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
        title="RFPs"
        subtitle="Manage Request for Proposals"
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
            Generate RFP
          </Button>
        }
      />

      <div className="p-6">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                placeholder="Search RFPs..."
                onSearch={setSearchQuery}
              />
            </div>
            <ExportButtons entity="rfps" />
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
                data={rfps}
                keyExtractor={(rfp) => rfp.id}
                onRowClick={handleRowClick}
                isLoading={false}
                emptyMessage="No RFPs found"
                emptyAction={{ label: 'Generate RFP', onClick: () => setShowAddModal(true) }}
                searchQuery={searchQuery}
                selectedKey={selectedRFP?.id}
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
        entityName="RFP"
        updateOptions={[
          { value: 'DRAFT', label: 'Draft' },
          { value: 'PUBLISHED', label: 'Published' },
          { value: 'CLOSED', label: 'Closed' },
          { value: 'AWARDED', label: 'Awarded' },
        ]}
      />

      {/* Bulk Delete Confirm */}
      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected RFPs"
        message={`Are you sure you want to delete ${selectedIds.size} RFP(s)? This action cannot be undone.`}
        confirmText="Delete All"
        isLoading={isBulkDeleting}
      />

      {/* RFP Detail Modal */}
      <RFPModal
        rfp={selectedRFP}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedRFP(null);
        }}
        onUpdate={handleRFPUpdate}
        onDelete={handleRFPDelete}
      />

      {/* Add RFP Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setFormErrors({}); }}
        title="Generate New RFP"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowAddModal(false); setFormErrors({}); }}>
              Cancel
            </Button>
            <Button onClick={handleAddRFP} isLoading={isAdding}>
              Create RFP
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddRFP} className="space-y-4">
          <div>
            <Input
              label="RFP Title"
              value={newRFP.title}
              onChange={(e) => setNewRFP({ ...newRFP, title: e.target.value })}
              required
            />
            {formErrors.title && <p className="text-sm text-danger mt-1">{formErrors.title}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Category"
              value={newRFP.category}
              onChange={(e) => setNewRFP({ ...newRFP, category: e.target.value })}
            />
            <Input
              label="Budget"
              type="number"
              value={newRFP.budget}
              onChange={(e) => setNewRFP({ ...newRFP, budget: e.target.value })}
            />
          </div>
          <Textarea
            label="Description"
            value={newRFP.description}
            onChange={(e) => setNewRFP({ ...newRFP, description: e.target.value })}
            rows={3}
          />
          <Textarea
            label="Requirements"
            value={newRFP.requirements}
            onChange={(e) => setNewRFP({ ...newRFP, requirements: e.target.value })}
            rows={4}
            helperText="Enter key requirements for vendors"
          />
        </form>
      </Modal>
    </>
  );
}
