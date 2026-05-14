'use client';

import React from 'react';
import { Button } from '../ui/Button';

interface AIAnalysisButtonProps {
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline';
  className?: string;
}

export function AIAnalysisButton({
  onClick,
  isLoading = false,
  disabled = false,
  label = 'Run AI Analysis',
  size = 'md',
  variant = 'primary',
  className = '',
}: AIAnalysisButtonProps) {
  return (
    <Button
      onClick={onClick}
      isLoading={isLoading}
      disabled={disabled}
      size={size}
      variant={variant}
      className={className}
      leftIcon={
        !isLoading && (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        )
      }
    >
      {isLoading ? 'Analyzing...' : label}
    </Button>
  );
}

// Mini version for table rows
interface AIAnalysisMiniButtonProps {
  onClick: (e: React.MouseEvent) => void;
  isLoading?: boolean;
  tooltip?: string;
}

export function AIAnalysisMiniButton({
  onClick,
  isLoading = false,
  tooltip = 'Run AI Analysis',
}: AIAnalysisMiniButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      disabled={isLoading}
      title={tooltip}
      className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:opacity-50"
    >
      {isLoading ? (
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
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      )}
    </button>
  );
}
