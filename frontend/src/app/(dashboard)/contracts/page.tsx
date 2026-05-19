'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout';
import { Button, DataTable, Badge, SearchInput, Modal, Input, Select, TableSkeleton, ConfirmModal, BulkActionsBar, ExportButtons, useToast } from '@/components/ui';
import { getStatusVariant } from '@/components/ui/Badge';
import { ContractModal } from '@/components/entities/ContractModal';
import type { Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { API_URL } from '@/lib/api';
import { validateForm, required } from '@/lib/validation';

interface Contract {
  id: string;
  title: string;
  contractNumber: string;
  vendorId?: string;
  vendorName: string;
  category: string;
  startDate: string;
  endDate: string;
  totalValue: number;
  status: string;
  riskLevel?: string;
  paymentTerms: string;
  deliveryTerms?: string;
  terms?: string;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [newContract, setNewContract] = useState({
    title: '',
    vendorName: '',
    category: '',
    totalValue: '',
    paymentTerms: 'Net 30',
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
    fetchContracts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, searchQuery, statusFilter]);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const response = await fetch(`${API_URL}/api/contracts?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setContracts(data.contracts || data.data || []);
        setTotal(data.total || data.pagination?.total || 0);
        setTotalPages(data.totalPages || data.pagination?.totalPages || 1);
      } else {
        showToast('Failed to load contracts', 'error');
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      showToast('Failed to load contracts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddContract = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(newContract, {
      title: [required('Contract Title')],
      vendorName: [required('Vendor Name')],
    });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIsAdding(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/contracts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newContract,
          contractNumber: `CON-${Date.now()}`,
          vendorId: 'manual-entry',
          totalValue: parseFloat(newContract.totalValue) || 0,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'DRAFT',
        }),
      });
      if (response.ok) {
        setNewContract({
          title: '',
          vendorName: '',
          category: '',
          totalValue: '',
          paymentTerms: 'Net 30',
        });
        setShowAddModal(false);
        fetchContracts();
        showToast('Contract created successfully', 'success');
      } else {
        showToast('Failed to create contract', 'error');
      }
    } catch (error) {
      console.error('Error adding contract:', error);
      showToast('Failed to create contract', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleContractUpdate = (updatedContract: Contract) => {
    setContracts((prev) =>
      prev.map((c) => (c.id === updatedContract.id ? updatedContract : c))
    );
    setSelectedContract(updatedContract);
    showToast('Contract updated successfully', 'success');
  };

  const handleContractDelete = (_id: string) => {
    fetchContracts();
    showToast('Contract deleted successfully', 'success');
  };

  const handleRowClick = (contract: Contract) => {
    setSelectedContract(contract);
    setIsModalOpen(true);
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/contracts/bulk`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (response.ok) {
        fetchContracts();
        showToast(`${selectedIds.size} contract(s) deleted`, 'success');
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
      const response = await fetch(`${API_URL}/api/contracts/bulk`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(selectedIds), data: { status } }),
      });
      if (response.ok) {
        setContracts((prev) =>
          prev.map((c) =>
            selectedIds.has(c.id) ? { ...c, status } : c
          )
        );
        showToast(`${selectedIds.size} contract(s) updated`, 'success');
        setSelectedIds(new Set());
      } else {
        showToast('Bulk update failed', 'error');
      }
    } catch (error) {
      showToast('Bulk update failed', 'error');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  const columns: Column<Contract>[] = [
    {
      key: 'title',
      header: 'Contract',
      sortable: true,
      render: (contract) => (
        <div>
          <p className="font-medium text-gray-900">{contract.title}</p>
          <p className="text-sm text-gray-500">{contract.contractNumber}</p>
        </div>
      ),
    },
    {
      key: 'vendorName',
      header: 'Vendor',
      sortable: true,
      render: (contract) => (
        <span className="text-gray-600">{contract.vendorName}</span>
      ),
    },
    {
      key: 'totalValue',
      header: 'Value',
      sortable: true,
      render: (contract) => (
        <span className="font-medium text-success">
          ${contract.totalValue?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (contract) => (
        <Badge variant={getStatusVariant(contract.status)}>
          {contract.status}
        </Badge>
      ),
    },
    {
      key: 'endDate',
      header: 'Expires',
      sortable: true,
      render: (contract) => {
        const endDate = new Date(contract.endDate);
        const now = new Date();
        const daysUntil = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const isExpiringSoon = daysUntil <= 30 && daysUntil > 0;
        const isExpired = daysUntil <= 0;

        return (
          <span className={`text-sm ${isExpired ? 'text-danger' : isExpiringSoon ? 'text-warning' : 'text-gray-500'}`}>
            {formatDate(contract.endDate)}
            {isExpiringSoon && <span className="block text-xs">({daysUntil} days)</span>}
            {isExpired && <span className="block text-xs">Expired</span>}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (contract) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(contract);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'NEGOTIATING', label: 'Negotiating' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'TERMINATED', label: 'Terminated' },
  ];

  return (
    <>
      <PageHeader
        title="Contracts"
        subtitle="Manage vendor contracts and negotiations"
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
            New Contract
          </Button>
        }
      />

      <div className="p-6">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                placeholder="Search contracts..."
                onSearch={setSearchQuery}
              />
            </div>
            <div className="w-48">
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={setStatusFilter}
              />
            </div>
            <ExportButtons entity="contracts" />
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
                data={contracts}
                keyExtractor={(contract) => contract.id}
                onRowClick={handleRowClick}
                isLoading={false}
                emptyMessage="No contracts found"
                emptyAction={{ label: 'New Contract', onClick: () => setShowAddModal(true) }}
                searchQuery={searchQuery}
                selectedKey={selectedContract?.id}
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
        entityName="contract"
        updateOptions={[
          { value: 'DRAFT', label: 'Draft' },
          { value: 'NEGOTIATING', label: 'Negotiating' },
          { value: 'ACTIVE', label: 'Active' },
          { value: 'EXPIRED', label: 'Expired' },
          { value: 'TERMINATED', label: 'Terminated' },
        ]}
      />

      {/* Bulk Delete Confirm */}
      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Contracts"
        message={`Are you sure you want to delete ${selectedIds.size} contract(s)? This action cannot be undone.`}
        confirmText="Delete All"
        isLoading={isBulkDeleting}
      />

      {/* Contract Detail Modal */}
      <ContractModal
        contract={selectedContract}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedContract(null);
        }}
        onUpdate={handleContractUpdate}
        onDelete={handleContractDelete}
      />

      {/* Add Contract Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setFormErrors({}); }}
        title="Create New Contract"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowAddModal(false); setFormErrors({}); }}>
              Cancel
            </Button>
            <Button onClick={handleAddContract} isLoading={isAdding}>
              Create Contract
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddContract} className="space-y-4">
          <div>
            <Input
              label="Contract Title"
              value={newContract.title}
              onChange={(e) => setNewContract({ ...newContract, title: e.target.value })}
              required
            />
            {formErrors.title && <p className="text-sm text-danger mt-1">{formErrors.title}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Vendor Name"
                value={newContract.vendorName}
                onChange={(e) => setNewContract({ ...newContract, vendorName: e.target.value })}
                required
              />
              {formErrors.vendorName && <p className="text-sm text-danger mt-1">{formErrors.vendorName}</p>}
            </div>
            <Input
              label="Category"
              value={newContract.category}
              onChange={(e) => setNewContract({ ...newContract, category: e.target.value })}
            />
            <Input
              label="Total Value"
              type="number"
              value={newContract.totalValue}
              onChange={(e) => setNewContract({ ...newContract, totalValue: e.target.value })}
            />
            <Select
              label="Payment Terms"
              value={newContract.paymentTerms}
              onChange={(value) => setNewContract({ ...newContract, paymentTerms: value })}
              options={[
                { value: 'Net 15', label: 'Net 15' },
                { value: 'Net 30', label: 'Net 30' },
                { value: 'Net 45', label: 'Net 45' },
                { value: 'Net 60', label: 'Net 60' },
                { value: 'Due on Receipt', label: 'Due on Receipt' },
              ]}
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
