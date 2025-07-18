'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

export default function BidsPage() {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBid, setNewBid] = useState({
    title: '',
    vendor_name: '',
    amount: '',
    description: '',
    category: '',
    status: 'submitted' as const
  });
  const [filter, setFilter] = useState('all');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchBids(token);
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
        setBids(data.bids || []);
      }
    } catch (error) {
      console.error('Error fetching bids:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBid = async (e: React.FormEvent) => {
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
          ...newBid,
          amount: parseFloat(newBid.amount)
        }),
      });

      if (response.ok) {
        setNewBid({ title: '', vendor_name: '', amount: '', description: '', category: '', status: 'submitted' });
        setShowAddForm(false);
        fetchBids(token);
      }
    } catch (error) {
      console.error('Error adding bid:', error);
    }
  };

  const handleStatusChange = async (bidId: number, newStatus: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:3001/api/bids/${bidId}`, {
        method: 'PUT',
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
      console.error('Error updating bid status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBids = filter === 'all' ? bids : bids.filter(bid => bid.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bids...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Bid Management</h1>
              <p className="text-gray-600">Track and manage procurement bids</p>
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
                Add Bid
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Add Bid Form */}
        {showAddForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Bid</h3>
            <form onSubmit={handleAddBid} className="space-y-4">
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
                    Category
                  </label>
                  <select
                    required
                    value={newBid.category}
                    onChange={(e) => setNewBid({...newBid, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select Category</option>
                    <option value="IT Services">IT Services</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Other">Other</option>
                  </select>
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
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Add Bid
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { key: 'all', label: 'All Bids' },
                { key: 'submitted', label: 'Submitted' },
                { key: 'under_review', label: 'Under Review' },
                { key: 'approved', label: 'Approved' },
                { key: 'rejected', label: 'Rejected' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-indigo-500 text-indigo-600'
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
                        <h4 className="text-lg font-medium text-gray-900">{bid.title}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bid.status)}`}>
                          {bid.status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                        <div>
                          <strong>Vendor:</strong> {bid.vendor_name}
                        </div>
                        <div>
                          <strong>Amount:</strong> ${bid.amount?.toLocaleString()}
                        </div>
                        <div>
                          <strong>Category:</strong> {bid.category}
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-600">
                        <p>{bid.description}</p>
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        Submitted: {new Date(bid.submission_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <select
                        value={bid.status}
                        onChange={(e) => handleStatusChange(bid.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="submitted">Submitted</option>
                        <option value="under_review">Under Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
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