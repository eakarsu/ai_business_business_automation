'use client';

import { useEffect, useState } from 'react';
import { PageHeader } from '@/components/layout';
import { Button, DataTable, Badge, SearchInput, Modal, Input, Select, Textarea, Card, CardBody, TableSkeleton, ConfirmModal, BulkActionsBar, ExportButtons, useToast } from '@/components/ui';
import { ProductModal } from '@/components/entities/ProductModal';
import type { Column } from '@/components/ui/DataTable';
import { API_URL } from '@/lib/api';
import { validateForm, required } from '@/lib/validation';

interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  price: number;
  currency: string;
  stockQuantity: number;
  unit: string;
  vendorId?: string;
  vendorName?: string;
  specifications?: string;
  status: string;
  createdAt: string;
}

interface Vendor {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBidModal, setShowBidModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    category: '',
    price: '',
    stockQuantity: '',
    unit: 'unit',
    vendorId: '',
    description: '',
    specifications: '',
  });
  const [isAdding, setIsAdding] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let filtered = products;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku?.toLowerCase().includes(query) ||
          p.vendorName?.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, categoryFilter]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [productsRes, vendorsRes] = await Promise.all([
        fetch(`${API_URL}/api/products`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/vendors`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products || data.data || []);
      } else {
        showToast('Failed to load products', 'error');
      }
      if (vendorsRes.ok) {
        const data = await vendorsRes.json();
        setVendors(data.vendors || data.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm(newProduct, {
      name: [required('Product Name')],
    });
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});
    setIsAdding(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newProduct,
          price: parseFloat(newProduct.price) || 0,
          stockQuantity: parseInt(newProduct.stockQuantity) || 0,
        }),
      });
      if (response.ok) {
        setNewProduct({
          name: '',
          sku: '',
          category: '',
          price: '',
          stockQuantity: '',
          unit: 'unit',
          vendorId: '',
          description: '',
          specifications: '',
        });
        setShowAddModal(false);
        fetchData();
        showToast('Product added successfully', 'success');
      } else {
        showToast('Failed to add product', 'error');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      showToast('Failed to add product', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleProductUpdate = (updatedProduct: Product) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p))
    );
    setSelectedProduct(updatedProduct);
    showToast('Product updated successfully', 'success');
  };

  const handleProductDelete = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    showToast('Product deleted successfully', 'success');
  };

  const handleRowClick = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCreateBid = (productId: string) => {
    setIsModalOpen(false);
    setShowBidModal(true);
  };

  const handleBulkDelete = async () => {
    setIsBulkDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/products/bulk`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      if (response.ok) {
        setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
        showToast(`${selectedIds.size} product(s) deleted`, 'success');
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
      const response = await fetch(`${API_URL}/api/products/bulk`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: Array.from(selectedIds), data: { status } }),
      });
      if (response.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            selectedIds.has(p.id) ? { ...p, status } : p
          )
        );
        showToast(`${selectedIds.size} product(s) updated`, 'success');
        setSelectedIds(new Set());
      } else {
        showToast('Bulk update failed', 'error');
      }
    } catch (error) {
      showToast('Bulk update failed', 'error');
    }
  };

  const categories = [...new Set(products.map((p) => p.category).filter(Boolean))];

  const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'neutral' => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'in_stock':
        return 'success';
      case 'low_stock':
        return 'warning';
      case 'out_of_stock':
      case 'discontinued':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const columns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Product',
      sortable: true,
      render: (product) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <p className="font-medium text-gray-900">{product.name}</p>
            <p className="text-sm text-gray-500">SKU: {product.sku}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (product) => <span className="text-gray-600">{product.category || '-'}</span>,
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      render: (product) => (
        <span className="font-medium text-success">
          ${product.price?.toLocaleString() || 0}
        </span>
      ),
    },
    {
      key: 'stockQuantity',
      header: 'Stock',
      sortable: true,
      render: (product) => (
        <span className="text-gray-600">
          {product.stockQuantity?.toLocaleString() || 0} {product.unit || 'units'}
        </span>
      ),
    },
    {
      key: 'vendorName',
      header: 'Vendor',
      render: (product) => <span className="text-gray-600">{product.vendorName || '-'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (product) => (
        <Badge variant={getStatusVariant(product.status || 'active')}>
          {product.status?.replace('_', ' ') || 'Active'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      render: (product) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(product);
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
        title="Products"
        subtitle="Manage product catalog"
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
            Add Product
          </Button>
        }
      />

      <div className="p-6">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <SearchInput
                placeholder="Search products..."
                onSearch={setSearchQuery}
              />
            </div>
            <div className="w-48">
              <Select
                options={[
                  { value: 'all', label: 'All Categories' },
                  ...categories.map((c) => ({ value: c, label: c })),
                ]}
                value={categoryFilter}
                onChange={setCategoryFilter}
              />
            </div>
            <ExportButtons entity="products" />
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'list' ? (
          <div className="bg-white rounded-lg border border-gray-200">
            {loading ? (
              <TableSkeleton rows={8} cols={7} />
            ) : (
              <DataTable
                columns={columns}
                data={filteredProducts}
                keyExtractor={(product) => product.id}
                onRowClick={handleRowClick}
                emptyMessage="No products found"
                emptyAction={{ label: 'Add Product', onClick: () => setShowAddModal(true) }}
                searchQuery={searchQuery}
                selectedKey={selectedProduct?.id}
                selectable
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
              />
            )}
          </div>
        ) : loading ? (
          <TableSkeleton rows={8} cols={4} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                hoverable
                onClick={() => handleRowClick(product)}
                className="cursor-pointer"
              >
                <CardBody>
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                    <p className="text-lg font-bold text-success mt-2">
                      ${product.price?.toLocaleString() || 0}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <Badge variant={getStatusVariant(product.status || 'active')} size="sm">
                        {product.status?.replace('_', ' ') || 'Active'}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        {product.stockQuantity || 0} in stock
                      </span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Bulk Actions Bar */}
      <BulkActionsBar
        selectedCount={selectedIds.size}
        onBulkDelete={() => setShowBulkDeleteConfirm(true)}
        onBulkUpdate={handleBulkUpdate}
        onClearSelection={() => setSelectedIds(new Set())}
        entityName="product"
        updateOptions={[
          { value: 'active', label: 'Active' },
          { value: 'low_stock', label: 'Low Stock' },
          { value: 'out_of_stock', label: 'Out of Stock' },
          { value: 'discontinued', label: 'Discontinued' },
        ]}
      />

      {/* Bulk Delete Confirm */}
      <ConfirmModal
        isOpen={showBulkDeleteConfirm}
        onClose={() => setShowBulkDeleteConfirm(false)}
        onConfirm={handleBulkDelete}
        title="Delete Selected Products"
        message={`Are you sure you want to delete ${selectedIds.size} product(s)? This action cannot be undone.`}
        confirmText="Delete All"
        isLoading={isBulkDeleting}
      />

      {/* Product Detail Modal */}
      <ProductModal
        product={selectedProduct}
        vendors={vendors}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onUpdate={handleProductUpdate}
        onDelete={handleProductDelete}
        onCreateBid={handleCreateBid}
      />

      {/* Add Product Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); setFormErrors({}); }}
        title="Add New Product"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setShowAddModal(false); setFormErrors({}); }}>
              Cancel
            </Button>
            <Button onClick={handleAddProduct} isLoading={isAdding}>
              Add Product
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddProduct} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Product Name"
                value={newProduct.name}
                onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                required
              />
              {formErrors.name && <p className="text-sm text-danger mt-1">{formErrors.name}</p>}
            </div>
            <Input
              label="SKU"
              value={newProduct.sku}
              onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
            />
            <Input
              label="Category"
              value={newProduct.category}
              onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
            />
            <Input
              label="Price"
              type="number"
              value={newProduct.price}
              onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
            />
            <Input
              label="Stock Quantity"
              type="number"
              value={newProduct.stockQuantity}
              onChange={(e) => setNewProduct({ ...newProduct, stockQuantity: e.target.value })}
            />
            <Input
              label="Unit"
              value={newProduct.unit}
              onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
            />
            <Select
              label="Vendor"
              value={newProduct.vendorId}
              onChange={(value) => setNewProduct({ ...newProduct, vendorId: value })}
              options={[
                { value: '', label: 'Select Vendor' },
                ...vendors.map((v) => ({ value: v.id, label: v.name })),
              ]}
            />
          </div>
          <Textarea
            label="Description"
            value={newProduct.description}
            onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
            rows={3}
          />
          <Textarea
            label="Specifications"
            value={newProduct.specifications}
            onChange={(e) => setNewProduct({ ...newProduct, specifications: e.target.value })}
            rows={3}
          />
        </form>
      </Modal>
    </>
  );
}
