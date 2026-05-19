'use client';

import React from 'react';
import { Button } from './Button';

interface BulkActionsBarProps {
  selectedCount: number;
  onBulkDelete: () => void;
  onBulkUpdate?: (status: string) => void;
  onClearSelection: () => void;
  updateOptions?: { value: string; label: string }[];
  entityName: string;
}

export function BulkActionsBar({
  selectedCount,
  onBulkDelete,
  onBulkUpdate,
  onClearSelection,
  updateOptions,
  entityName,
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-gray-900 text-white rounded-xl shadow-2xl px-6 py-3 flex items-center gap-4 animate-slide-in">
      <span className="text-sm font-medium">
        {selectedCount} {entityName}{selectedCount !== 1 ? 's' : ''} selected
      </span>
      <div className="w-px h-6 bg-gray-600" />
      {updateOptions && onBulkUpdate && (
        <select
          onChange={(e) => {
            if (e.target.value) {
              onBulkUpdate(e.target.value);
              e.target.value = '';
            }
          }}
          className="bg-gray-700 text-white text-sm rounded-lg px-3 py-1.5 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
          defaultValue=""
        >
          <option value="" disabled>Update Status...</option>
          {updateOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
      <Button
        variant="danger"
        size="sm"
        onClick={onBulkDelete}
      >
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        Delete
      </Button>
      <button
        onClick={onClearSelection}
        className="text-gray-400 hover:text-white p-1"
        title="Clear selection"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
