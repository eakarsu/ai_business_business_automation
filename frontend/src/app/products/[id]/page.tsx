'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  subcategory: string;
  sku: string;
  manufacturer: string;
  model: string;
  imageUrl: string;
  unitPrice: number;
  minOrderQty: number;
  maxOrderQty: number;
  currency: string;
  specifications: any;
  dimensions: any;
  weight: number;
  certifications: string[];
  isActive: boolean;
  inStock: boolean;
  stockQuantity: number;
  leadTime: number;
  complianceStandards: string[];
  qualityRatings: any;
  vendor: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function ProductDetailsPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showBidModal, setShowBidModal] = useState(false);
  const [newBid, setNewBid] = useState({
    title: '',
    vendor_name: '',
    amount: '',
    description: '',
    category: '',
    status: 'submitted' as const,
    deadline: ''
  });
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchProduct(token);
  }, [params.id, router]);

  const fetchProduct = async (token: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/products/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProduct(data.product);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(price);
  };

  const handleCreateBid = () => {
    if (!product) return;
    
    setNewBid({
      title: `Bid for ${product.name}`,
      vendor_name: product.vendor.name,
      amount: product.unitPrice ? product.unitPrice.toString() : '',
      description: `Bid for ${product.name} - ${product.description}`,
      category: product.category,
      status: 'submitted',
      deadline: ''
    });
    setShowBidModal(true);
  };

  const handleSubmitBid = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!token) return;

    try {
      const response = await fetch('http://localhost:3001/api/bids', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newBid.title,
          description: newBid.description,
          budget: parseFloat(newBid.amount) * quantity,
          deadline: newBid.deadline,
          vendorId: product?.vendor.id
        }),
      });

      if (response.ok) {
        setNewBid({ title: '', vendor_name: '', amount: '', description: '', category: '', status: 'submitted', deadline: '' });
        setShowBidModal(false);
        alert('Bid created successfully!');
      } else {
        const errorData = await response.json();
        alert('Failed to create bid: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating bid:', error);
      alert('Error creating bid. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h2>
          <Link href="/products" className="text-blue-600 hover:text-blue-800">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-4">
            <Link href="/products" className="text-blue-600 hover:text-blue-800 mr-4">
              ← Back to Products
            </Link>
            <div className="text-sm text-gray-500">
              Products &gt; {product.category} &gt; {product.name}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
              {product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <svg className="mx-auto h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg">{product.category} Image</p>
                  </div>
                </div>
              )}
            </div>
            {/* Thumbnail gallery */}
            <div className="flex space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 text-xs">
                  {i}
                </div>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Title and Price */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <div className="flex items-center space-x-2 mb-4">
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-sm font-medium">
                  Top Rated Plus
                </span>
                <span className="text-blue-600 hover:text-blue-800 cursor-pointer text-sm">
                  {product.vendor.name}
                </span>
              </div>
              
              <div className="text-4xl font-bold text-gray-900 mb-2">
                {formatPrice(product.unitPrice, product.currency)}
              </div>
              <div className="text-green-600 font-medium">Free shipping</div>
            </div>

            {/* Key Details */}
            <div className="border-t border-gray-200 pt-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Category</dt>
                  <dd className="text-sm text-gray-900">{product.category}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">SKU</dt>
                  <dd className="text-sm text-gray-900">{product.sku || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Manufacturer</dt>
                  <dd className="text-sm text-gray-900">{product.manufacturer || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Model</dt>
                  <dd className="text-sm text-gray-900">{product.model || 'N/A'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Stock</dt>
                  <dd className="text-sm text-gray-900">
                    {product.inStock ? `${product.stockQuantity} available` : 'Out of stock'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Lead Time</dt>
                  <dd className="text-sm text-gray-900">{product.leadTime || 'N/A'} days</dd>
                </div>
              </dl>
            </div>

            {/* Quantity and Actions */}
            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center space-x-4 mb-4">
                <label className="text-sm font-medium text-gray-900">Quantity:</label>
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  {Array.from({ length: Math.min(product.maxOrderQty || 10, 10) }, (_, i) => i + 1).map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
                <span className="text-sm text-gray-500">
                  (Min: {product.minOrderQty || 1}, Max: {product.maxOrderQty || 'N/A'})
                </span>
              </div>

              <div className="flex flex-col space-y-3">
                <button
                  onClick={handleCreateBid}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 font-medium transition-colors"
                >
                  Bid
                </button>
                <button
                  onClick={handleCreateBid}
                  className="w-full bg-white text-blue-600 border border-blue-600 px-6 py-3 rounded-md hover:bg-blue-50 font-medium transition-colors"
                >
                  Add to Cart
                </button>
                <div className="flex space-x-2">
                  <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 text-sm font-medium">
                    Add to Watchlist
                  </button>
                  <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 text-sm font-medium">
                    Compare
                  </button>
                </div>
              </div>
            </div>

            {/* Seller Info */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Seller Information</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{product.vendor.name}</span>
                  <span className="text-yellow-600 text-sm">★★★★★ (99.2%)</span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Business seller • Ships from United States
                </div>
                <div className="flex space-x-2">
                  <button className="text-sm text-blue-600 hover:text-blue-800">Contact seller</button>
                  <span className="text-gray-300">|</span>
                  <button className="text-sm text-blue-600 hover:text-blue-800">View other items</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description and Specifications */}
        <div className="mt-12 space-y-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
            <div className="prose prose-sm max-w-none text-gray-600">
              {product.description || 'No description available.'}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Specifications</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {product.specifications && Object.keys(product.specifications).length > 0 ? (
                Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-sm font-medium text-gray-500">{key}</span>
                    <span className="text-sm text-gray-900">{String(value)}</span>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm">No specifications available.</div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Bid Modal */}
      {showBidModal && product && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create Bid for {product.name}</h3>
                <button
                  onClick={() => setShowBidModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Product Details Section */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Product Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Product:</span>
                    <span className="ml-2 font-medium">{product.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Vendor:</span>
                    <span className="ml-2 font-medium">{product.vendor.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <span className="ml-2 font-medium">{product.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Unit Price:</span>
                    <span className="ml-2 font-medium">{formatPrice(product.unitPrice, product.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Bid Form */}
              <form onSubmit={handleSubmitBid} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bid Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newBid.title}
                    onChange={(e) => setNewBid({...newBid, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vendor Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newBid.vendor_name}
                    onChange={(e) => setNewBid({...newBid, vendor_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    readOnly
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newBid.amount}
                      onChange={(e) => setNewBid({...newBid, amount: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deadline
                    </label>
                    <input
                      type="date"
                      required
                      value={newBid.deadline}
                      onChange={(e) => setNewBid({...newBid, deadline: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={newBid.description}
                    onChange={(e) => setNewBid({...newBid, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowBidModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Create Bid
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}