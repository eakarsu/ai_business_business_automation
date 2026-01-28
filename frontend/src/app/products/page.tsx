'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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

interface Bid {
  id: number;
  title: string;
  vendor_name: string;
  amount: number;
  status: 'submitted' | 'under_review' | 'approved' | 'rejected';
  submission_date: string;
  description: string;
  category: string;
}

const categories = [
  'Technology',
  'Office Supplies',
  'Construction',
  'Manufacturing',
  'Consulting',
  'Healthcare',
  'Education',
  'Other'
];

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newBid, setNewBid] = useState({
    title: '',
    vendor_name: '',
    amount: '',
    description: '',
    category: '',
    status: 'submitted' as const,
    deadline: ''
  });
  const [newProduct, setNewProduct] = useState({
    vendorId: '',
    name: '',
    description: '',
    category: '',
    subcategory: '',
    sku: '',
    manufacturer: '',
    model: '',
    unitPrice: '',
    minOrderQty: '',
    maxOrderQty: '',
    currency: 'USD',
    specifications: {},
    dimensions: {},
    weight: '',
    certifications: [],
    isActive: true,
    inStock: true,
    stockQuantity: '',
    leadTime: '',
    complianceStandards: [],
    qualityRatings: {}
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchProducts(token);
    fetchVendors(token);
  }, [router]);

  const fetchProducts = async (token: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
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
        setVendors(data.vendors || []);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!token) return;

    try {
      const response = await fetch('http://localhost:3001/api/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      });

      if (response.ok) {
        setNewProduct({
          vendorId: '',
          name: '',
          description: '',
          category: '',
          subcategory: '',
          sku: '',
          manufacturer: '',
          model: '',
          unitPrice: '',
          minOrderQty: '',
          maxOrderQty: '',
          currency: 'USD',
          specifications: {},
          dimensions: {},
          weight: '',
          certifications: [],
          isActive: true,
          inStock: true,
          stockQuantity: '',
          leadTime: '',
          complianceStandards: [],
          qualityRatings: {}
        });
        setShowAddForm(false);
        fetchProducts(token);
      }
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const handleStatusChange = async (productId: string, field: string, value: boolean) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:3001/api/products/${productId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      });

      if (response.ok) {
        fetchProducts(token);
      }
    } catch (error) {
      console.error('Error updating product:', error);
    }
  };

  const getStatusColor = (status: boolean) => {
    return status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(price);
  };

  const handleCreateBid = (product: Product) => {
    setSelectedProduct(product);
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
          budget: parseFloat(newBid.amount),
          deadline: newBid.deadline,
          vendorId: selectedProduct?.vendor.id,
          productId: selectedProduct?.id
        }),
      });

      if (response.ok) {
        setNewBid({ title: '', vendor_name: '', amount: '', description: '', category: '', status: 'submitted', deadline: '' });
        setShowBidModal(false);
        setSelectedProduct(null);
        alert('Bid created successfully!');
      } else {
        const errorData = await response.json();
        console.error('Error creating bid:', errorData);
        alert('Failed to create bid: ' + (errorData.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating bid:', error);
      alert('Error creating bid. Please try again.');
    }
  };

  const closeBidModal = () => {
    setShowBidModal(false);
    setSelectedProduct(null);
    setNewBid({ title: '', vendor_name: '', amount: '', description: '', category: '', status: 'submitted', deadline: '' });
  };

  const filteredProducts = products.filter(product => {
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    const matchesVendor = !selectedVendor || product.vendor.id === selectedVendor;
    return matchesCategory && matchesVendor;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Product Catalog</h1>
              <p className="text-gray-600">Browse and manage vendor products</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Back to Dashboard
              </Link>
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Filters */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Products</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Vendor
              </label>
              <select
                value={selectedVendor}
                onChange={(e) => setSelectedVendor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Vendors</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Add Product Form */}
        {showAddForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Product</h3>
            <form onSubmit={handleAddProduct} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor
                </label>
                <select
                  required
                  value={newProduct.vendorId}
                  onChange={(e) => setNewProduct({...newProduct, vendorId: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(vendor => (
                    <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  required
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  required
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU
                </label>
                <input
                  type="text"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newProduct.unitPrice}
                  onChange={(e) => setNewProduct({...newProduct, unitPrice: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stock Quantity
                </label>
                <input
                  type="number"
                  value={newProduct.stockQuantity}
                  onChange={(e) => setNewProduct({...newProduct, stockQuantity: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="md:col-span-2 flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        )}

        {/* eBay-Style Products List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {filteredProducts.length} results
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Vendor products available in the system
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <select className="text-sm border-gray-300 rounded-md">
                  <option>Best Match</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Newest First</option>
                </select>
                <div className="flex border border-gray-300 rounded-md">
                  <button className="px-3 py-2 bg-blue-600 text-white text-sm">Grid</button>
                  <button className="px-3 py-2 bg-gray-100 text-gray-700 text-sm">List</button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full text-center text-gray-500 py-8">
                No products found. Try adjusting your filters or click "Add Product" to get started.
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div key={product.id} className="bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-shadow cursor-pointer group">
                  <Link href={`/products/${product.id}`}>
                    {/* Product Image */}
                    <div className="w-full h-48 bg-gray-100 rounded-t-lg overflow-hidden">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                          {product.category} Image
                        </div>
                      )}
                    </div>
                  </Link>
                  
                  <div className="p-4">
                    {/* Price - eBay style prominent display */}
                    <div className="mb-2">
                      <div className="text-xl font-bold text-gray-900">
                        {formatPrice(product.unitPrice, product.currency)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Free shipping
                      </div>
                    </div>
                    
                    {/* Title - eBay style truncated */}
                    <Link href={`/products/${product.id}`}>
                      <h4 className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600">
                        {product.name}
                      </h4>
                    </Link>
                    
                    {/* Seller info - eBay style */}
                    <div className="flex items-center text-xs text-gray-500 mb-2">
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium mr-2">
                        Top Rated
                      </span>
                      <span>{product.vendor.name}</span>
                    </div>
                    
                    {/* Product details */}
                    <div className="text-xs text-gray-500 mb-3 space-y-1">
                      <div>Category: {product.category}</div>
                      {product.sku && <div>SKU: {product.sku}</div>}
                      <div className="flex items-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mr-2 ${getStatusColor(product.inStock)}`}>
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                        {product.stockQuantity && (
                          <span>({product.stockQuantity} available)</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Action buttons - eBay style */}
                    <div className="space-y-2">
                      <button
                        onClick={() => handleCreateBid(product)}
                        className="w-full bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm font-medium transition-colors"
                      >
                        Bid
                      </button>
                      <button
                        onClick={() => handleCreateBid(product)}
                        className="w-full bg-white text-blue-600 border border-blue-600 px-3 py-2 rounded-md hover:bg-blue-50 text-sm font-medium transition-colors"
                      >
                        Add to Cart
                      </button>
                    </div>
                    
                    {/* Watch/Compare - eBay style */}
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                      <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Watch
                      </button>
                      <button className="text-xs text-blue-600 hover:text-blue-800 flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Compare
                      </button>
                    </div>
                    
                    {/* Admin actions - collapsed by default */}
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                      <details className="group">
                        <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                          Admin Actions
                        </summary>
                        <div className="mt-2 space-y-2">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleStatusChange(product.id, 'isActive', !product.isActive)}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 flex-1"
                            >
                              {product.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleStatusChange(product.id, 'inStock', !product.inStock)}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200 flex-1"
                            >
                              {product.inStock ? 'Out of Stock' : 'In Stock'}
                            </button>
                          </div>
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Bid Creation Modal */}
      {showBidModal && selectedProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create Bid for {selectedProduct.name}</h3>
                <button
                  onClick={closeBidModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Product Details Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">Product Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Product:</span>
                    <span className="ml-2 font-medium">{selectedProduct.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Vendor:</span>
                    <span className="ml-2 font-medium">{selectedProduct.vendor.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <span className="ml-2 font-medium">{selectedProduct.category}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Unit Price:</span>
                    <span className="ml-2 font-medium">{formatPrice(selectedProduct.unitPrice, selectedProduct.currency)}</span>
                  </div>
                </div>
              </div>

              {/* Bid Form */}
              <form onSubmit={handleSubmitBid} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    onClick={closeBidModal}
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