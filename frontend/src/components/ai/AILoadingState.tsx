'use client';

import React from 'react';

interface AILoadingStateProps {
  message?: string;
  subMessage?: string;
}

export function AILoadingState({
  message = 'AI is analyzing...',
  subMessage = 'This may take a moment',
}: AILoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Animated AI icon */}
      <div className="relative">
        <div className="absolute inset-0 bg-primary-400 rounded-full blur-xl opacity-30 animate-pulse" />
        <div className="relative p-4 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg">
          <svg
            className="w-12 h-12 text-white animate-pulse"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
      </div>

      {/* Loading dots */}
      <div className="flex items-center gap-1.5 mt-6">
        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>

      {/* Messages */}
      <h3 className="mt-4 text-lg font-semibold text-gray-900">{message}</h3>
      <p className="mt-1 text-sm text-gray-500">{subMessage}</p>

      {/* Progress bar */}
      <div className="w-64 mt-6">
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary-600 rounded-full animate-progress" />
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 50%;
            margin-left: 25%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
        .animate-progress {
          animation: progress 1.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Compact version for inline use
export function AILoadingInline({ message = 'Analyzing...' }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 text-primary-600">
      <svg
        className="w-4 h-4 animate-spin"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}
