'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/layout';
import { Card, CardHeader, CardBody, StatCard } from '@/components/ui/Card';
import { CircularProgress } from '@/components/ui/ProgressBar';
import { Button } from '@/components/ui/Button';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { API_URL } from '@/lib/api';

interface DashboardStats {
  totalVendors: number;
  activeBids: number;
  pendingApprovals: number;
  completedProcurements: number;
  monthlySpending: number;
  complianceScore: number;
}

interface RecentActivity {
  id: string;
  type: 'vendor' | 'bid' | 'contract' | 'savings';
  message: string;
  time: string;
}

const recentActivities: RecentActivity[] = [
  { id: '1', type: 'vendor', message: 'New vendor registration from TechPro Solutions', time: '2 hours ago' },
  { id: '2', type: 'bid', message: 'Bid submitted for IT Equipment procurement', time: '4 hours ago' },
  { id: '3', type: 'contract', message: 'Contract approved for SecureNet Systems', time: 'Yesterday' },
  { id: '4', type: 'savings', message: 'AI identified $75,000 savings opportunity', time: 'Yesterday' },
  { id: '5', type: 'vendor', message: 'Vendor qualification completed for DataFlow Inc', time: '2 days ago' },
];

const quickActions = [
  { label: 'Vendors', href: '/vendors', color: 'bg-primary-600 hover:bg-primary-700' },
  { label: 'Bids', href: '/bids', color: 'bg-success hover:bg-success-dark' },
  { label: 'Contracts', href: '/contracts', color: 'bg-info hover:bg-info-dark' },
  { label: 'RFPs', href: '/rfps', color: 'bg-warning hover:bg-warning-dark' },
  { label: 'Compliance', href: '/compliance', color: 'bg-danger hover:bg-danger-dark' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/dashboard/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'vendor':
        return (
          <div className="p-2 bg-primary-100 rounded-lg">
            <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
        );
      case 'bid':
        return (
          <div className="p-2 bg-success-light rounded-lg">
            <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        );
      case 'contract':
        return (
          <div className="p-2 bg-info-light rounded-lg">
            <svg className="w-4 h-4 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'savings':
        return (
          <div className="p-2 bg-warning-light rounded-lg">
            <svg className="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          subtitle="Overview of your procurement operations"
        />
        <div className="p-6">
          <CardSkeleton count={6} />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your procurement operations"
      />

      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Vendors"
            value={stats?.totalVendors || 0}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
            onClick={() => router.push('/vendors')}
          />
          <StatCard
            title="Active Bids"
            value={stats?.activeBids || 0}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            onClick={() => router.push('/bids')}
          />
          <StatCard
            title="Pending Approvals"
            value={stats?.pendingApprovals || 0}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            onClick={() => router.push('/compliance')}
          />
          <StatCard
            title="Active Contracts"
            value={stats?.completedProcurements || 0}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
            onClick={() => router.push('/contracts')}
          />
          <StatCard
            title="Monthly Spending"
            value={`$${(stats?.monthlySpending || 0).toLocaleString()}`}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            onClick={() => router.push('/spend')}
          />
          <StatCard
            title="Compliance Score"
            value={`${stats?.complianceScore || 0}%`}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            onClick={() => router.push('/compliance')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>Quick Actions</CardHeader>
              <CardBody>
                <div className="flex flex-wrap gap-3">
                  {quickActions.map((action) => (
                    <Link key={action.href} href={action.href}>
                      <Button variant="primary" className={action.color}>
                        {action.label}
                      </Button>
                    </Link>
                  ))}
                </div>
              </CardBody>
            </Card>

            {/* AI Features */}
            <Card>
              <CardHeader>AI-Powered Features</CardHeader>
              <CardBody>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Link href="/vendors" className="block">
                    <div className="p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-600 rounded-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">AI Vendor Scorer</h4>
                          <p className="text-sm text-gray-500">Evaluate vendors with AI</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <Link href="/contracts" className="block">
                    <div className="p-4 bg-info-light rounded-lg hover:bg-blue-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-info rounded-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">AI Contract Negotiator</h4>
                          <p className="text-sm text-gray-500">Smart negotiation strategies</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <Link href="/spend" className="block">
                    <div className="p-4 bg-success-light rounded-lg hover:bg-green-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-success rounded-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">AI Spend Analyzer</h4>
                          <p className="text-sm text-gray-500">Analyze spending patterns</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <Link href="/savings" className="block">
                    <div className="p-4 bg-warning-light rounded-lg hover:bg-yellow-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-warning rounded-lg">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">AI Savings Finder</h4>
                          <p className="text-sm text-gray-500">Discover cost savings</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Compliance Score */}
            <Card>
              <CardHeader>Compliance Overview</CardHeader>
              <CardBody className="flex flex-col items-center">
                <CircularProgress
                  value={stats?.complianceScore || 0}
                  size={140}
                  strokeWidth={12}
                  variant={
                    (stats?.complianceScore || 0) >= 80
                      ? 'success'
                      : (stats?.complianceScore || 0) >= 60
                      ? 'warning'
                      : 'danger'
                  }
                  label="Score"
                />
                <Link href="/compliance" className="mt-4">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </Link>
              </CardBody>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>Recent Activity</CardHeader>
              <CardBody className="p-0">
                <div className="divide-y divide-gray-100">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 p-4">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
