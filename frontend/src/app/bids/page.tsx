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

interface Bid {
  id: number;
  title: string;
  vendor_name: string;
  amount: number;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_EVALUATION' | 'EVALUATED' | 'AWARDED' | 'REJECTED' | 'WITHDRAWN' | 'COUNTER_OFFERED';
  submission_date: string;
  description: string;
  category: string;
  productId?: string;
  counterOffers?: CounterOffer[];
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
    status: 'SUBMITTED' as const
  });
  const [filter, setFilter] = useState('all');
  const [showCounterOfferModal, setShowCounterOfferModal] = useState(false);
  const [selectedBidId, setSelectedBidId] = useState<number | null>(null);
  const [counterOfferForm, setCounterOfferForm] = useState({
    proposedAmount: '',
    proposedTimeline: '',
    modifications: '',
    justification: '',
    technicalChanges: '',
    alternativeApproach: '',
    expiresAt: ''
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
        setBids(data.data || []);
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
        setNewBid({ title: '', vendor_name: '', amount: '', description: '', category: '', status: 'SUBMITTED' });
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

  const handleCreateCounterOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    if (!token || !selectedBidId) return;

    try {
      const response = await fetch(`http://localhost:3001/api/bids/${selectedBidId}/counter-offer`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          proposedAmount: counterOfferForm.proposedAmount ? parseFloat(counterOfferForm.proposedAmount) : null,
          proposedTimeline: counterOfferForm.proposedTimeline ? parseInt(counterOfferForm.proposedTimeline) : null,
          modifications: counterOfferForm.modifications,
          justification: counterOfferForm.justification,
          technicalChanges: counterOfferForm.technicalChanges || null,
          alternativeApproach: counterOfferForm.alternativeApproach || null,
          expiresAt: counterOfferForm.expiresAt || null
        }),
      });

      if (response.ok) {
        setCounterOfferForm({
          proposedAmount: '',
          proposedTimeline: '',
          modifications: '',
          justification: '',
          technicalChanges: '',
          alternativeApproach: '',
          expiresAt: ''
        });
        setShowCounterOfferModal(false);
        setSelectedBidId(null);
        fetchBids(token);
      }
    } catch (error) {
      console.error('Error creating counter offer:', error);
    }
  };

  const handleRespondToCounterOffer = async (counterId: string, status: 'ACCEPTED' | 'REJECTED') => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:3001/api/bids/counter-offer/${counterId}/respond`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        fetchBids(token);
      }
    } catch (error) {
      console.error('Error responding to counter offer:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'UNDER_EVALUATION': return 'bg-yellow-100 text-yellow-800';
      case 'EVALUATED': return 'bg-purple-100 text-purple-800';
      case 'AWARDED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'WITHDRAWN': return 'bg-orange-100 text-orange-800';
      case 'COUNTER_OFFERED': return 'bg-indigo-100 text-indigo-800';
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
                { key: 'SUBMITTED', label: 'Submitted' },
                { key: 'UNDER_EVALUATION', label: 'Under Evaluation' },
                { key: 'COUNTER_OFFERED', label: 'Counter Offered' },
                { key: 'AWARDED', label: 'Awarded' },
                { key: 'REJECTED', label: 'Rejected' }
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
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">{bid.title}</h4>
                          {bid.productId && (
                            <Link
                              href={`/products/${bid.productId}`}
                              className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
                            >
                              View Product Details →
                            </Link>
                          )}
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(bid.status)}`}>
                          {bid.status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
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
                      {bid.counterOffers && bid.counterOffers.length > 0 && (
                        <div className="mt-3">
                          <h5 className="text-sm font-medium text-gray-700 mb-2">Counter Offers ({bid.counterOffers.length})</h5>
                          <div className="space-y-2">
                            {bid.counterOffers.map((offer) => (
                              <div key={offer.id} className="bg-gray-50 rounded-lg p-3 border">
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                    offer.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                    offer.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                                    offer.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                    offer.status === 'EXPIRED' ? 'bg-gray-100 text-gray-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {offer.status}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(offer.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                  {offer.proposedAmount && (
                                    <div><strong>Proposed Amount:</strong> ${offer.proposedAmount.toLocaleString()}</div>
                                  )}
                                  {offer.proposedTimeline && (
                                    <div><strong>Timeline:</strong> {offer.proposedTimeline} days</div>
                                  )}
                                  <div><strong>Modifications:</strong> {offer.modifications}</div>
                                  <div><strong>Justification:</strong> {offer.justification}</div>
                                </div>
                                {offer.status === 'PENDING' && (
                                  <div className="mt-2 flex space-x-2">
                                    <button
                                      onClick={() => handleRespondToCounterOffer(offer.id, 'ACCEPTED')}
                                      className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                                    >
                                      Accept
                                    </button>
                                    <button
                                      onClick={() => handleRespondToCounterOffer(offer.id, 'REJECTED')}
                                      className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                      {(bid.status === 'UNDER_EVALUATION' || bid.status === 'EVALUATED') && (
                        <button
                          onClick={() => {
                            setSelectedBidId(bid.id);
                            setShowCounterOfferModal(true);
                          }}
                          className="text-xs bg-indigo-600 text-white px-2 py-1 rounded hover:bg-indigo-700"
                        >
                          Counter Offer
                        </button>
                      )}
                      <select
                        value={bid.status}
                        onChange={(e) => handleStatusChange(bid.id, e.target.value)}
                        className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Counter Offer Modal */}
        {showCounterOfferModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex items-center justify-between pb-3">
                  <h3 className="text-lg font-medium text-gray-900">Create Counter Offer</h3>
                  <button
                    onClick={() => {
                      setShowCounterOfferModal(false);
                      setSelectedBidId(null);
                      setCounterOfferForm({
                        proposedAmount: '',
                        proposedTimeline: '',
                        modifications: '',
                        justification: '',
                        technicalChanges: '',
                        alternativeApproach: '',
                        expiresAt: ''
                      });
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <form onSubmit={handleCreateCounterOffer} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Proposed Amount ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={counterOfferForm.proposedAmount}
                        onChange={(e) => setCounterOfferForm({...counterOfferForm, proposedAmount: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Proposed Timeline (days)
                      </label>
                      <input
                        type="number"
                        value={counterOfferForm.proposedTimeline}
                        onChange={(e) => setCounterOfferForm({...counterOfferForm, proposedTimeline: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Modifications Required *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={counterOfferForm.modifications}
                      onChange={(e) => setCounterOfferForm({...counterOfferForm, modifications: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Describe the required changes to the bid..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Justification *
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={counterOfferForm.justification}
                      onChange={(e) => setCounterOfferForm({...counterOfferForm, justification: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Explain the reasoning for this counter offer..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Technical Changes
                    </label>
                    <textarea
                      rows={2}
                      value={counterOfferForm.technicalChanges}
                      onChange={(e) => setCounterOfferForm({...counterOfferForm, technicalChanges: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Optional: Describe any technical modifications..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alternative Approach
                    </label>
                    <textarea
                      rows={2}
                      value={counterOfferForm.alternativeApproach}
                      onChange={(e) => setCounterOfferForm({...counterOfferForm, alternativeApproach: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Optional: Suggest alternative solutions..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiration Date
                    </label>
                    <input
                      type="datetime-local"
                      value={counterOfferForm.expiresAt}
                      onChange={(e) => setCounterOfferForm({...counterOfferForm, expiresAt: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-4 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCounterOfferModal(false);
                        setSelectedBidId(null);
                        setCounterOfferForm({
                          proposedAmount: '',
                          proposedTimeline: '',
                          modifications: '',
                          justification: '',
                          technicalChanges: '',
                          alternativeApproach: '',
                          expiresAt: ''
                        });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      Create Counter Offer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}