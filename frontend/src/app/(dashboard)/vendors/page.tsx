'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout';
import { Button, DataTable, Badge, SearchInput, Modal, TableSkeleton, ConfirmModal, BulkActionsBar, ExportButtons, useToast } from '@/components/ui';
import { Pagination } from '@/components/ui/Pagination';
import { getStatusVariant, getRiskVariant } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui';
import { VendorModal } from '@/components/entities/VendorModal';
import type { Column } from '@/components/ui/DataTable';
import { API_URL } from '@/lib/api';
import { validateForm, required, email as emailRule, minLength } from '@/lib/validation';

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  industryType: string;
  businessType: string;
  qualificationStatus: string;
  riskLevel: string;
  overallScore: number;
  financialScore: number;
  technicalScore: number;
  complianceScore: number;
  experienceScore: number;
  annualRevenue: number;
  employeeCount: number;
  yearEstablished: number;
  createdAt: string;
}

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  // Server-side pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [newVendor, setNewVendor] = useState({
    name: '',
    email: '',
    phone: '',
    industryType: '',
    businessType: '',
    annualRevenue: '',
    employeeCount: '',
  });
  const [isAdding, setIsAdding] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const { showToast } = useToast();

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter]);

  useEffect(() => {
    fetchVendors();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, searchQuery, statusFilter]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (searchQuery) params.set('search', searchQuery);
      if (statusFilter !== 'all') params.set('qualificationStatus', statusFilter);

      const response = await fetch(`${API_URL}/api/vendors?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
      } else {
        showToast('Failed to load vendors', 'error');
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
      showToast('Failed to load vendors', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(newVendor, {
      name: [required('Vendor Name'), minLength(2, 'Vendor Name')],
      email: [emailRule],
    });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIsAdding(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/vendors`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newVendor,
          annualRevenue: parseFloat(newVendor.annualRevenue) || 0,
          employeeCount: parseInt(newVendor.employeeCount) || 0,
        }),
      });
      if (response.ok) {
        setNewVendor({
          name: '',
          email: '',
          phone: '',
          industryType: '',
          businessType: '',
          annualRevenue: '',
          employeeCount: '',
        });
        setShowAddModal(false);
        setPage(1);
        fetchVendors();
        showToast('Vendor added successfully', 'success');
      } else {
        showToast('Failed to add vendor', 'error');
      }
    } catch (error) {
      console.error('Error adding vendor:', error);
      showToast('Failed to add vendor', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleVendorUpdate = (updatedVendor: Vendor) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === updatedVendor.id ? updatedVendor : v))
    );
    setSelectedVendor(updatedVendor);
    showToast('Vendor updated successfully', 'success');
  };

  const handleVendorDelete = (_id: string) => {
    fetchVendors(); // Refresh from server to keep pagination accurate
    showToast('Vendor deleted successfully', 'success');
  };

  const handleRowClick = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsModalOpen(true);
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/vendors/bulk`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (response.ok) {
        setVendors((prev) => prev.filter((v) => !selectedIds.has(v.id)));
        showToast(`${selectedIds.size} vendor(s) deleted`, 'success');
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
      const response = await fetch(`${API_URL}/api/vendors/bulk`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(selectedIds), data: { qualificationStatus: status } }),
      });
      if (response.ok) {
        setVendors((prev) =>
          prev.map((v) =>
            selectedIds.has(v.id) ? { ...v, qualificationStatus: status } : v
          )
        );
        showToast(`${selectedIds.size} vendor(s) updated`, 'success');
        setSelectedIds(new Set());
      } else {
        showToast('Bulk update failed', 'error');
      }
    } catch (error) {
      showToast('Bulk update failed', 'error');
    }
  };

  const columns: Column<Vendor>[] = [
    {
      key: 'name',
      header: 'Vendor',
      sortable: true,
      render: (vendor) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
            <span className="text-primary-600 font-semibold">
              {vendor.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-medium text-gray-900">{vendor.name}</p>
            <p className="text-sm text-gray-500">{vendor.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'industryType',
      header: 'Industry',
      sortable: true,
      render: (vendor) => (
        <span className="text-gray-600">{vendor.industryType || '-'}</span>
      ),
    },
    {
      key: 'qualificationStatus',
      header: 'Status',
      sortable: true,
      render: (vendor) => (
        <Badge variant={getStatusVariant(vendor.qualificationStatus)}>
          {vendor.qualificationStatus}
        </Badge>
      ),
    },
    {
      key: 'riskLevel',
      header: 'Risk',
      sortable: true,
      render: (vendor) => (
        <Badge variant={getRiskVariant(vendor.riskLevel)}>
          {vendor.riskLevel}
        </Badge>
      ),
    },
    {
      key: 'overallScore',
      header: 'Score',
      sortable: true,
      render: (vendor) => {
        const score = vendor.overallScore || 0;
        const colorClass =
          score >= 80
            ? 'text-success'
            : score >= 60
            ? 'text-warning'
            : 'text-danger';
        return (
          <span className={`text-lg font-bold ${colorClass}`}>
            {score.toFixed(1)}
          </span>
        );
      },
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (vendor) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(vendor);
          }}
        >
          View
        </Button>
      ),
    },
  ];

  const statusOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'QUALIFIED', label: 'Qualified' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'UNDER_REVIEW', label: 'Under Review' },
    { value: 'DISQUALIFIED', label: 'Disqualified' },
    { value: 'SUSPENDED', label: 'Suspended' },
  ];

  return (
    <>
      <PageHeader
        title="Vendors"
        subtitle="Manage your vendor relationships and qualifications"
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
            Add Vendor
          </Button>
        }
      />

      <div className="p-6">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                placeholder="Search vendors..."
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
            <ExportButtons entity="vendors" />
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
                data={vendors}
                keyExtractor={(vendor) => vendor.id}
                onRowClick={handleRowClick}
                isLoading={false}
                emptyMessage="No vendors found"
                emptyAction={{ label: 'Add Vendor', onClick: () => setShowAddModal(true) }}
                searchQuery={searchQuery}
                selectedKey={selectedVendor?.id}
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
        entityName="vendor"
        updateOptions={[
          { value: 'QUALIFIED', label: 'Qualified' },
          { value: 'PENDING', label: 'Pending' },
          { value: 'UNDER_REVIEW', label: 'Under Review' },
          { value: 'DISQUALIFIED', label: 'Disqualified' },
          { value: 'SUSPENDED', label: 'Suspended' },
        ]}
      />

      {/* Bulk Delete Confirm */}
      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Vendors"
        message={`Are you sure you want to delete ${selectedIds.size} vendor(s)? This action cannot be undone.`}
        confirmText="Delete All"
        isLoading={isBulkDeleting}
      />

      {/* Vendor Detail Modal */}
      <VendorModal
        vendor={selectedVendor}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedVendor(null);
        }}
        onUpdate={handleVendorUpdate}
        onDelete={handleVendorDelete}
      />

      {/* Add Vendor Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setFormErrors({}); }}
        title="Add New Vendor"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowAddModal(false); setFormErrors({}); }}>
              Cancel
            </Button>
            <Button onClick={handleAddVendor} isLoading={isAdding}>
              Add Vendor
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddVendor} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Vendor Name"
                value={newVendor.name}
                onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                required
              />
              {formErrors.name && <p className="text-sm text-danger mt-1">{formErrors.name}</p>}
            </div>
            <div>
              <Input
                label="Email"
                type="email"
                value={newVendor.email}
                onChange={(e) => setNewVendor({ ...newVendor, email: e.target.value })}
              />
              {formErrors.email && <p className="text-sm text-danger mt-1">{formErrors.email}</p>}
            </div>
            <Input
              label="Phone"
              value={newVendor.phone}
              onChange={(e) =>
                setNewVendor({ ...newVendor, phone: e.target.value })
              }
            />
            <Input
              label="Industry Type"
              value={newVendor.industryType}
              onChange={(e) =>
                setNewVendor({ ...newVendor, industryType: e.target.value })
              }
            />
            <Input
              label="Business Type"
              value={newVendor.businessType}
              onChange={(e) =>
                setNewVendor({ ...newVendor, businessType: e.target.value })
              }
            />
            <Input
              label="Annual Revenue"
              type="number"
              value={newVendor.annualRevenue}
              onChange={(e) =>
                setNewVendor({ ...newVendor, annualRevenue: e.target.value })
              }
            />
            <Input
              label="Employee Count"
              type="number"
              value={newVendor.employeeCount}
              onChange={(e) =>
                setNewVendor({ ...newVendor, employeeCount: e.target.value })
              }
            />
          </div>
        </form>
      </Modal>
    </>
  );
}
