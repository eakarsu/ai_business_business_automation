'use client';

import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-success-light text-success-dark',
  warning: 'bg-warning-light text-warning-dark',
  danger: 'bg-danger-light text-danger-dark',
  info: 'bg-info-light text-info-dark',
  neutral: 'bg-gray-100 text-gray-700',
  primary: 'bg-primary-100 text-primary-700',
};

const dotColors: Record<BadgeVariant, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  info: 'bg-info',
  neutral: 'bg-gray-500',
  primary: 'bg-primary-500',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

export function Badge({
  variant = 'neutral',
  size = 'sm',
  dot = false,
  children,
  className = '',
}: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
}

// Utility function to get badge variant from status
export function getStatusVariant(status: string): BadgeVariant {
  const statusMap: Record<string, BadgeVariant> = {
    // Vendor statuses
    QUALIFIED: 'success',
    PENDING: 'warning',
    DISQUALIFIED: 'danger',
    UNDER_REVIEW: 'info',
    SUSPENDED: 'danger',
    // Bid statuses
    SUBMITTED: 'info',
    UNDER_EVALUATION: 'warning',
    SHORTLISTED: 'primary',
    AWARDED: 'success',
    REJECTED: 'danger',
    WITHDRAWN: 'neutral',
    // Compliance statuses
    PASSED: 'success',
    FAILED: 'danger',
    WARNING: 'warning',
    // Contract statuses
    DRAFT: 'neutral',
    ACTIVE: 'success',
    EXPIRED: 'danger',
    NEGOTIATING: 'warning',
    // Risk levels
    LOW: 'success',
    MEDIUM: 'warning',
    HIGH: 'danger',
    CRITICAL: 'danger',
  };
  return statusMap[status] || 'neutral';
}

// Utility function to get risk variant
export function getRiskVariant(risk: string): BadgeVariant {
  const riskMap: Record<string, BadgeVariant> = {
    LOW: 'success',
    MEDIUM: 'warning',
    HIGH: 'danger',
    CRITICAL: 'danger',
  };
  return riskMap[risk] || 'neutral';
}
