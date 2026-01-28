'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CounterOffer {
  id: string;
  proposedAmount?: number;
  proposedTimeline?: number;
  modifications: string;
  justification: string;
  technicalChanges?: string;
  alternativeApproach?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'UNDER_REVIEW';
  createdAt: string;
  respondedAt?: string;
  expiresAt?: string;
}

interface Vendor {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  category: string;
}

interface Bid {
  id: string;
  title: string;
  vendor: {
    name: string;
  };
  proposedAmount: number;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_EVALUATION' | 'EVALUATED' | 'AWARDED' | 'REJECTED' | 'WITHDRAWN' | 'COUNTER_OFFERED';
  submittedAt: string;
  description: string;
  productId?: string;
  product?: {
    id: string;
    name: string;
    sku?: string;
  };
  counterOffers?: CounterOffer[];
}

export default function BidsPage() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'UNDER_EVALUATION': return 'bg-yellow-100 text-yellow-800';
      case 'EVALUATED': return 'bg-purple-100 text-purple-800';
      case 'AWARDED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'WITHDRAWN': return 'bg-gray-100 text-gray-800';
      case 'COUNTER_OFFERED': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      router.push('/login');
      return;
    }
    
    fetchBids(token);
    fetchVendors(token);
    fetchProducts(token);
  }, [router]);

  const fetchBids = async (token: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/bids', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBids(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async (token: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/vendors', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setVendors(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch vendors:', error);
    }
  };

  const fetchProducts = async (token: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  const updateBidStatus = async (bidId: string, newStatus: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:3001/api/bids/${bidId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        fetchBids(token);
      }
    } catch (error) {
      console.error('Failed to update bid status:', error);
    }
  };

  const deleteBid = async (bidId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    if (!confirm('Are you sure you want to delete this bid?')) return;

    try {
      const response = await fetch(`http://localhost:3001/api/bids/${bidId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchBids(token);
      }
    } catch (error) {
      console.error('Failed to delete bid:', error);
    }
  };

  const createBid = async (formData: FormData) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsCreating(true);
    try {
      // Build form object manually to ensure all fields are included
      const formDataObj: any = {};
      for (let [key, value] of formData.entries()) {
        formDataObj[key] = value;
      }
      
      console.log('Form data being sent:', formDataObj);
      console.log('ProductId in formDataObj:', formDataObj.productId);
      console.log('ProductId type:', typeof formDataObj.productId);
      
      const response = await fetch('http://localhost:3001/api/bids', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formDataObj),
      });

      if (response.ok) {
        setShowCreateForm(false);
        fetchBids(token);
      } else {
        const errorData = await response.json();
        console.error('Failed to create bid:', errorData);
      }
    } catch (error) {
      console.error('Failed to create bid:', error);
    } finally {
      setIsCreating(false);
    }
  };
  
  // Add filteredBids calculation
  const filteredBids = bids.filter(bid => {
    if (filter === 'all') return true;
    return bid.status.toLowerCase() === filter;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-500 hover:text-gray-700 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Dashboard</span>
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">Bids</h1>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Bid</span>
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Create Bid Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Bid</h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const formData = new FormData(form);
                    
                    // Debug: log all form fields
                    for (let [key, value] of formData.entries()) {
                      console.log(`${key}: ${value}`);
                    }
                    
                    // Check if productId is empty string
                    const productIdValue = formData.get('productId');
                    console.log('ProductId value type:', typeof productIdValue);
                    console.log('ProductId is empty string:', productIdValue === '');
                    console.log('ProductId is null/undefined:', productIdValue === null || productIdValue === undefined);
                    console.log('Available products:', products.length);
                    
                    // Prevent submission if no product selected
                    if (!productIdValue || productIdValue === '') {
                      alert('Please select a product');
                      return;
                    }
                    
                    await createBid(formData);
                  }}
                >
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      name="title"
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea
                      name="description"
                      required
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
                    <input
                      type="number"
                      name="budget"
                      step="0.01"
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
                    <select
                      name="vendorId"
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="">Select Vendor</option>
                      {vendors.map((vendor) => (
                        <option key={vendor.id} value={vendor.id}>
                          {vendor.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Product * (Available: {products.length})</label>
                    <select
                      name="productId"
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      onChange={(e) => console.log('Product selected:', e.target.value)}
                    >
                      <option value="">Select Product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} {product.sku && `(${product.sku})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md disabled:opacity-50"
                    >
                      {isCreating ? 'Creating...' : 'Create Bid'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        
        {/* Filter Tabs */}
        <div className="bg-white shadow sm:rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'all', label: 'All Bids' },
                { key: 'submitted', label: 'Submitted' },
                { key: 'under_evaluation', label: 'Under Evaluation' },
                { key: 'awarded', label: 'Awarded' },
                { key: 'rejected', label: 'Rejected' },
                { key: 'withdrawn', label: 'Withdrawn' },
                { key: 'counter_offered', label: 'Counter Offered' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
        
        {/* Bids List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Bids ({filteredBids.length})
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Manage procurement bids and track their status
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {filteredBids.length === 0 ? (
              <li className="px-4 py-4 text-center text-gray-500">
                No bids found. Click "Add Bid" to get started.
              </li>
            ) : (
              filteredBids.map((bid) => (
                <li key={bid.id} className="px-4 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="text-lg font-medium text-gray-900">
                              {bid.title}
                            </h4>
                            <Link
                              href={`/products/${bid.productId}?from=bids`}
                              className="text-sm bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 transition-colors font-medium"
                            >
                              View Product
                            </Link>
                          </div>
                          {bid.product && (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">
                                Product: {bid.product.name}
                              </span>
                              {bid.product.sku && (
                                <span className="text-xs text-gray-400">
                                  (SKU: {bid.product.sku})
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bid.status)}`}>
                          {bid.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                        <div>
                          <strong>Vendor:</strong> {bid.vendor.name}
                        </div>
                        <div>
                          <strong>Amount:</strong> ${bid.proposedAmount?.toLocaleString()}
                        </div>
                        <div>
                          <strong>Submitted:</strong> {new Date(bid.submittedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>{bid.description}</p>
                      </div>
                      {/* Counter offers section */}
                      {bid.counterOffers && bid.counterOffers.length > 0 && (
                        <div className="mt-3 border-t pt-3">
                          <h5 className="text-sm font-medium text-gray-900 mb-2">Counter Offers ({bid.counterOffers.length})</h5>
                          <div className="space-y-2">
                            {bid.counterOffers.slice(0, 2).map((offer) => (
                              <div key={offer.id} className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                <div className="flex justify-between items-center">
                                  <span>Amount: ${offer.proposedAmount?.toLocaleString()}</span>
                                  <span className={`px-2 py-1 text-xs rounded-full ${
                                    offer.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                                    offer.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                    offer.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {offer.status}
                                  </span>
                                </div>
                                <p className="mt-1">{offer.modifications}</p>
                              </div>
                            ))}
                            {bid.counterOffers.length > 2 && (
                              <p className="text-xs text-gray-500">+{bid.counterOffers.length - 2} more offers</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                      {/* Status dropdown */}
                      <select
                        value={bid.status}
                        onChange={(e) => updateBidStatus(bid.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="UNDER_EVALUATION">Under Evaluation</option>
                        <option value="EVALUATED">Evaluated</option>
                        <option value="AWARDED">Awarded</option>
                        <option value="REJECTED">Rejected</option>
                        <option value="WITHDRAWN">Withdrawn</option>
                        <option value="COUNTER_OFFERED">Counter Offered</option>
                      </select>
                      
                      {/* Delete button */}
                      <button
                        onClick={() => deleteBid(bid.id)}
                        className="text-red-600 hover:text-red-800 p-1"
                        title="Delete bid"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </main>
    </div>
  );
}
