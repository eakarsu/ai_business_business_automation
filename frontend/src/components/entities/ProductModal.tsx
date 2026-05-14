'use client';

import React, { useState, useEffect } from 'react';
import { Modal, ConfirmModal } from '../ui/Modal';
import { Tabs, TabContent } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { API_URL } from '@/lib/api';

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

interface ProductModalProps {
  product: Product | null;
  vendors: Vendor[];
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (product: Product) => void;
  onDelete: (id: string) => void;
  onCreateBid?: (productId: string) => void;
}

export function ProductModal({
  product,
  vendors,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onCreateBid,
}: ProductModalProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Product>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (product) {
      setEditData(product);
      setActiveTab('details');
      setIsEditing(false);
    }
  }, [product]);

  if (!product) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });
      if (response.ok) {
        const data = await response.json();
        onUpdate(data.product || data.data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating product:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/products/${product.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      onDelete(product.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error deleting product:', error);
    } finally {
      setIsDeleting(false);
    }
  };

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

  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'vendor', label: 'Vendor' },
    { id: 'edit', label: 'Edit' },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={product.name}
        size="lg"
        footer={
          activeTab === 'edit' && isEditing ? (
            <>
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} isLoading={isSaving}>
                Save Changes
              </Button>
            </>
          ) : activeTab === 'details' ? (
            <>
              <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                Delete
              </Button>
              {onCreateBid && (
                <Button variant="primary" onClick={() => onCreateBid(product.id)}>
                  Create Bid
                </Button>
              )}
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </>
          ) : null
        }
      >
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <TabContent>
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* SKU and Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  SKU: <span className="font-medium text-gray-900">{product.sku}</span>
                </span>
                <Badge variant={getStatusVariant(product.status)} size="md">
                  {product.status?.replace('_', ' ') || 'Active'}
                </Badge>
              </div>

              {/* Price */}
              <div className="p-4 bg-primary-50 rounded-lg">
                <p className="text-sm text-primary-600">Price</p>
                <p className="text-3xl font-bold text-primary-700">
                  {product.currency || '$'}{product.price?.toLocaleString() || 0}
                  <span className="text-sm font-normal text-primary-600"> / {product.unit || 'unit'}</span>
                </p>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Category</p>
                  <p className="mt-1 text-sm text-gray-900">{product.category || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Stock Quantity</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {product.stockQuantity?.toLocaleString() || 0} {product.unit || 'units'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Vendor</p>
                  <p className="mt-1 text-sm text-gray-900">{product.vendorName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Added</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Description</p>
                  <p className="text-sm text-gray-700">{product.description}</p>
                </div>
              )}

              {/* Specifications */}
              {product.specifications && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Specifications</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{product.specifications}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vendor' && (
            <div className="space-y-6">
              {product.vendorName ? (
                <>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-lg font-semibold text-primary-600">
                          {product.vendorName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{product.vendorName}</p>
                        <p className="text-sm text-gray-500">Product Supplier</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      View Vendor Profile
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      View Other Products
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Contact Vendor
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No vendor associated with this product</p>
                  <Button variant="outline">Assign Vendor</Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'edit' && (
            <div className="space-y-4">
              {!isEditing ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Click the button below to edit product details</p>
                  <Button onClick={() => setIsEditing(true)}>Edit Product</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Input
                    label="Name"
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="SKU"
                      value={editData.sku || ''}
                      onChange={(e) => setEditData({ ...editData, sku: e.target.value })}
                    />
                    <Input
                      label="Category"
                      value={editData.category || ''}
                      onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                    />
                    <Input
                      label="Price"
                      type="number"
                      value={editData.price || ''}
                      onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) || 0 })}
                    />
                    <Input
                      label="Stock Quantity"
                      type="number"
                      value={editData.stockQuantity || ''}
                      onChange={(e) => setEditData({ ...editData, stockQuantity: parseInt(e.target.value) || 0 })}
                    />
                    <Input
                      label="Unit"
                      value={editData.unit || ''}
                      onChange={(e) => setEditData({ ...editData, unit: e.target.value })}
                    />
                    <Select
                      label="Vendor"
                      value={editData.vendorId || ''}
                      onChange={(value) => setEditData({ ...editData, vendorId: value })}
                      options={[
                        { value: '', label: 'Select Vendor' },
                        ...vendors.map((v) => ({ value: v.id, label: v.name })),
                      ]}
                    />
                  </div>
                  <Textarea
                    label="Description"
                    value={editData.description || ''}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={3}
                  />
                  <Textarea
                    label="Specifications"
                    value={editData.specifications || ''}
                    onChange={(e) => setEditData({ ...editData, specifications: e.target.value })}
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}
        </TabContent>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </>
  );
}
