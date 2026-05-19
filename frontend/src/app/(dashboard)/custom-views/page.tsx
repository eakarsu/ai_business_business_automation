'use client';

import React from 'react';
import VendorComparison from '@/components/VendorComparison.js';
import SpendTrend from '@/components/SpendTrend.js';
import RFPGenerator from '@/components/RFPGenerator.js';
import SpendApprovalQueue from '@/components/SpendApprovalQueue.js';

export default function CustomViewsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Procurement Views</h1>
        <p className="text-sm text-gray-500">
          Custom procurement analytics and workflows: vendor comparison, spend trend,
          RFP generation, and spend approvals.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <VendorComparison />
        <SpendTrend />
        <RFPGenerator />
        <SpendApprovalQueue />
      </div>
    </div>
  );
}
