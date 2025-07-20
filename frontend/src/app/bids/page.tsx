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
  vendor: {
    name: string;
  };
  amount: number;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_EVALUATION' | 'EVALUATED' | 'AWARDED' | 'REJECTED' | 'WITHDRAWN' | 'COUNTER_OFFERED';
  submission_date: string;
  description: string;
  category: string;
  productId?: string;
  product?: {
    name: string;
    sku?: string;
  };
  counterOffers?: CounterOffer[];
}

export default function BidsPage() {
  // ... existing state and effects ...

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header remains the same */}
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Add Bid Form remains the same */}
        
        {/* Filter Tabs remain the same */}
        
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
                          <h4 className="text-lg font-medium text-gray-900">
                            {bid.title}
                            {bid.product && (
                              <span className="text-sm text-gray-500 ml-2">
                                ({bid.product.name})
                              </span>
                            )}
                          </h4>
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
                          <strong>Vendor:</strong> {bid.vendor.name}
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
                      {/* Counter offers section remains the same */}
                    </div>
                    <div className="ml-4 flex-shrink-0 flex items-center space-x-2">
                      {/* Status select remains the same */}
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
