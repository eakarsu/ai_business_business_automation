'use client';

import React from 'react';

function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex gap-4 px-4 py-3 bg-gray-50 border-b">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBlock key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4 px-4 py-4 border-b border-gray-100">
          {Array.from({ length: cols }).map((_, colIdx) => (
            <SkeletonBlock key={colIdx} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-5">
          <SkeletonBlock className="h-4 w-24 mb-3" />
          <SkeletonBlock className="h-8 w-16 mb-2" />
          <SkeletonBlock className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i}>
          <SkeletonBlock className="h-4 w-24 mb-2" />
          <SkeletonBlock className="h-10 w-full" />
        </div>
      ))}
      <SkeletonBlock className="h-10 w-32 mt-4" />
    </div>
  );
}
