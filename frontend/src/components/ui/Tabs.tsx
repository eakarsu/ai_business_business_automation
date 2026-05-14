'use client';

import React, { useState } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pills' | 'bordered';
  className?: string;
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  className = '',
}: TabsProps) {
  const getTabStyles = (isActive: boolean) => {
    switch (variant) {
      case 'pills':
        return isActive
          ? 'bg-primary-600 text-white'
          : 'text-gray-600 hover:bg-gray-100';
      case 'bordered':
        return isActive
          ? 'border-primary-600 text-primary-600 bg-primary-50'
          : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300';
      case 'underline':
      default:
        return isActive
          ? 'border-primary-600 text-primary-600'
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';
    }
  };

  const getContainerStyles = () => {
    switch (variant) {
      case 'pills':
        return 'bg-gray-100 p-1 rounded-lg gap-1';
      case 'bordered':
        return 'border border-gray-200 rounded-lg p-1 gap-1';
      case 'underline':
      default:
        return 'border-b border-gray-200';
    }
  };

  const getBaseTabStyles = () => {
    switch (variant) {
      case 'pills':
        return 'px-4 py-2 text-sm font-medium rounded-md';
      case 'bordered':
        return 'px-4 py-2 text-sm font-medium rounded-md border-2';
      case 'underline':
      default:
        return 'px-4 py-3 text-sm font-medium border-b-2 -mb-px';
    }
  };

  return (
    <div className={`flex ${getContainerStyles()} ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`
            inline-flex items-center gap-2 transition-colors
            ${getBaseTabStyles()}
            ${getTabStyles(activeTab === tab.id)}
          `}
        >
          {tab.icon}
          {tab.label}
          {tab.badge !== undefined && (
            <span
              className={`
                ml-1 px-2 py-0.5 text-xs font-medium rounded-full
                ${activeTab === tab.id ? 'bg-white/20 text-inherit' : 'bg-gray-200 text-gray-600'}
              `}
            >
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// Tab Content wrapper
interface TabContentProps {
  children: React.ReactNode;
  className?: string;
}

export function TabContent({ children, className = '' }: TabContentProps) {
  return <div className={`py-4 ${className}`}>{children}</div>;
}

// Controlled Tabs with Content
interface TabPanelProps {
  tabs: (Tab & { content: React.ReactNode })[];
  defaultTab?: string;
  variant?: 'underline' | 'pills' | 'bordered';
  className?: string;
}

export function TabPanel({ tabs, defaultTab, variant = 'underline', className = '' }: TabPanelProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '');

  return (
    <div className={className}>
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant={variant}
      />
      <TabContent>
        {tabs.find((tab) => tab.id === activeTab)?.content}
      </TabContent>
    </div>
  );
}
