'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout';
import { Button, DataTable, Badge, SearchInput, Modal, Tabs, Input, Select, Textarea, TableSkeleton, ConfirmModal, BulkActionsBar, ExportButtons, useToast } from '@/components/ui';
import { getStatusVariant } from '@/components/ui/Badge';
import { BidModal } from '@/components/entities/BidModal';
import type { Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { API_URL } from '@/lib/api';
import { validateForm, required } from '@/lib/validation';

interface Vendor {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku?: string;
}

interface Bid {
  id: string;
  title: string;
  description: string;
  rfpNumber: string;
  vendorId: string;
  vendor: Vendor;
  productId?: string;
  product?: Product;
  proposedAmount: number;
  proposedTimeline: number;
  technicalApproach: string;
  status: string;
  submittedAt: string;
  technicalScore?: number;
  costScore?: number;
  timelineScore?: number;
  riskScore?: number;
  overallScore?: number;
}

const statusTabs = [
  { id: 'all', label: 'All' },
  { id: 'SUBMITTED', label: 'Submitted' },
  { id: 'UNDER_EVALUATION', label: 'Under Evaluation' },
  { id: 'EVALUATED', label: 'Evaluated' },
  { id: 'AWARDED', label: 'Awarded' },
  { id: 'REJECTED', label: 'Rejected' },
];

export default function BidsPage() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [newBid, setNewBid] = useState({
    title: '',
    description: '',
    vendorId: '',
    productId: '',
    proposedAmount: '',
    proposedTimeline: '',
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
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, searchQuery, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const [bidsRes, vendorsRes, productsRes] = await Promise.all([
        fetch(`${API_URL}/api/bids?${params}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/vendors?limit=200`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/products?limit=200`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (bidsRes.ok) {
        const data = await bidsRes.json();
        setBids(data.data || data.bids || []);
        setTotal(data.total || data.pagination?.total || 0);
        setTotalPages(data.totalPages || data.pagination?.totalPages || 1);
      }
      if (vendorsRes.ok) {
        const data = await vendorsRes.json();
        setVendors(data.vendors || data.data || []);
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || data.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddBid = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(newBid, {
      title: [required('Title')],
      vendorId: [required('Vendor')],
    });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIsAdding(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/bids`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newBid,
          proposedAmount: parseFloat(newBid.proposedAmount) || 0,
          proposedTimeline: parseInt(newBid.proposedTimeline) || 30,
        }),
      });
      if (response.ok) {
        setNewBid({ title: '', description: '', vendorId: '', productId: '', proposedAmount: '', proposedTimeline: '' });
        setShowAddModal(false);
        fetchData();
        showToast('Bid created successfully', 'success');
      } else {
        showToast('Failed to create bid', 'error');
      }
    } catch (error) {
      showToast('Failed to create bid', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleBidUpdate = (updatedBid: Bid) => {
    setBids((prev) => prev.map((b) => (b.id === updatedBid.id ? updatedBid : b)));
    setSelectedBid(updatedBid);
    showToast('Bid updated successfully', 'success');
  };

  const handleBidDelete = (_id: string) => {
    fetchData();
    showToast('Bid deleted successfully', 'success');
  };

  const handleRowClick = (bid: Bid) => {
    setSelectedBid(bid);
    setIsModalOpen(true);
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/bids/bulk`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (response.ok) {
        fetchData();
        showToast(`${selectedIds.size} bid(s) deleted`, 'success');
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
      const response = await fetch(`${API_URL}/api/bids/bulk`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selectedIds), data: { status } }),
      });
      if (response.ok) {
        setBids((prev) => prev.map((b) => selectedIds.has(b.id) ? { ...b, status } : b));
        showToast(`${selectedIds.size} bid(s) updated`, 'success');
        setSelectedIds(new Set());
      } else {
        showToast('Bulk update failed', 'error');
      }
    } catch (error) {
      showToast('Bulk update failed', 'error');
    }
  };

  const columns: Column<Bid>[] = [
    {
      key: 'title',
      header: 'Bid',
      sortable: true,
      render: (bid) => (
        <div>
          <p className="font-medium text-gray-900">{bid.title}</p>
          <p className="text-sm text-gray-500">{bid.vendor?.name}</p>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      render: (bid) => (
        <span className="text-gray-600">{bid.product?.name || '-'}</span>
      ),
    },
    {
      key: 'proposedAmount',
      header: 'Amount',
      sortable: true,
      render: (bid) => (
        <span className="font-medium text-success">
          ${bid.proposedAmount?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (bid) => (
        <Badge variant={getStatusVariant(bid.status)}>
          {bid.status.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'overallScore',
      header: 'Score',
      sortable: true,
      render: (bid) => {
        if (!bid.overallScore) return <span className="text-gray-400">-</span>;
        const score = bid.overallScore;
        const colorClass = score >= 80 ? 'text-success' : score >= 60 ? 'text-warning' : 'text-danger';
        return <span className={`text-lg font-bold ${colorClass}`}>{score.toFixed(1)}</span>;
      },
    },
    {
      key: 'submittedAt',
      header: 'Submitted',
      sortable: true,
      render: (bid) => (
        <span className="text-sm text-gray-500">
          {new Date(bid.submittedAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (bid) => (
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleRowClick(bid); }}>
          View
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Bids"
        subtitle="Manage procurement bids and evaluations"
        actions={
          <Button onClick={() => setShowAddModal(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Bid
          </Button>
        }
      />

      <div className="p-6">
        {/* Filter Tabs */}
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <Tabs tabs={statusTabs} activeTab={statusFilter} onChange={setStatusFilter} />
        </div>

        {/* Search + Export */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <SearchInput placeholder="Search bids..." onSearch={setSearchQuery} />
            </div>
            <ExportButtons entity="bids" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-gray-200">
          {loading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : (
            <>
              <DataTable
                columns={columns}
                data={bids}
                keyExtractor={(bid) => bid.id}
                onRowClick={handleRowClick}
                emptyMessage="No bids found"
                emptyAction={{ label: 'New Bid', onClick: () => setShowAddModal(true) }}
                searchQuery={searchQuery}
                selectedKey={selectedBid?.id}
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

      <BulkActionsBar
        selectedCount={selectedIds.size}
        onBulkDelete={() => setShowBulkDeleteConfirm(true)}
        onBulkUpdate={handleBulkUpdate}
        onClearSelection={() => setSelectedIds(new Set())}
        entityName="bid"
        updateOptions={[
          { value: 'SUBMITTED', label: 'Submitted' },
          { value: 'UNDER_EVALUATION', label: 'Under Evaluation' },
          { value: 'EVALUATED', label: 'Evaluated' },
          { value: 'AWARDED', label: 'Awarded' },
          { value: 'REJECTED', label: 'Rejected' },
        ]}
      />

      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Bids"
        message={`Are you sure you want to delete ${selectedIds.size} bid(s)? This action cannot be undone.`}
        confirmText="Delete All"
        isLoading={isBulkDeleting}
      />

      <BidModal
        bid={selectedBid}
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setSelectedBid(null); }}
        onUpdate={handleBidUpdate}
        onDelete={handleBidDelete}
      />

      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setFormErrors({}); }}
        title="Create New Bid"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowAddModal(false); setFormErrors({}); }}>Cancel</Button>
            <Button onClick={handleAddBid} isLoading={isAdding}>Create Bid</Button>
          </>
        }
      >
        <form onSubmit={handleAddBid} className="space-y-4">
          <div>
            <Input label="Title" value={newBid.title} onChange={(e) => setNewBid({ ...newBid, title: e.target.value })} required />
            {formErrors.title && <p className="text-sm text-danger mt-1">{formErrors.title}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select
                label="Vendor"
                value={newBid.vendorId}
                onChange={(value) => setNewBid({ ...newBid, vendorId: value })}
                options={[{ value: '', label: 'Select Vendor' }, ...vendors.map((v) => ({ value: v.id, label: v.name }))]}
                required
              />
              {formErrors.vendorId && <p className="text-sm text-danger mt-1">{formErrors.vendorId}</p>}
            </div>
            <Select
              label="Product (Optional)"
              value={newBid.productId}
              onChange={(value) => setNewBid({ ...newBid, productId: value })}
              options={[{ value: '', label: 'Select Product' }, ...products.map((p) => ({ value: p.id, label: p.name }))]}
            />
            <Input label="Proposed Amount" type="number" value={newBid.proposedAmount} onChange={(e) => setNewBid({ ...newBid, proposedAmount: e.target.value })} />
            <Input label="Timeline (days)" type="number" value={newBid.proposedTimeline} onChange={(e) => setNewBid({ ...newBid, proposedTimeline: e.target.value })} />
          </div>
          <Textarea label="Description" value={newBid.description} onChange={(e) => setNewBid({ ...newBid, description: e.target.value })} rows={3} />
        </form>
      </Modal>
    </>
  );
}
