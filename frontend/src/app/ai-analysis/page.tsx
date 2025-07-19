'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AIAnalysisResults from '../../components/AIAnalysisResults';

interface AIInsight {
  id: number;
  title: string;
  category: 'vendor' | 'bid' | 'compliance' | 'spending';
  priority: 'low' | 'medium' | 'high' | 'critical';
  insight: string;
  recommendation: string;
  confidence: number;
  created_at: string;
  data_source: string;
}

interface AIAnalysisStats {
  total_insights: number;
  high_priority: number;
  cost_savings_potential: number;
  risk_score: number;
  automation_rate: number;
  prediction_accuracy: number;
}

export default function AIAnalysisPage() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [stats, setStats] = useState<AIAnalysisStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  const [analysisRunning, setAnalysisRunning] = useState(false);
  const [showAnalysisSelection, setShowAnalysisSelection] = useState(false);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiResults, setAiResults] = useState<any>(null);
  const [currentAnalysisType, setCurrentAnalysisType] = useState<string>('');
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
    fetchAIAnalysis(token);
    fetchDashboardStats(token);
  }, [router]);

  const fetchDashboardStats = async (token: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchAIAnalysis = async (token: string) => {
    try {
      const [insightsResponse, statsResponse] = await Promise.all([
        fetch('http://localhost:3001/api/ai/insights', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('http://localhost:3001/api/ai/stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        setInsights(insightsData.insights || []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching AI analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const runAIAnalysis = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setAnalysisRunning(true);
    try {
      const response = await fetch('http://localhost:3001/api/ai/insights', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'vendor-analysis',
          data: dashboardStats || { 
            totalVendors: 0,
            activeBids: 0,
            pendingApprovals: 0,
            completedProcurements: 0,
            monthlySpending: 0,
            complianceScore: 0 
          }
        })
      });

      if (response.ok) {
        fetchAIAnalysis(token);
      }
    } catch (error) {
      console.error('Error running AI analysis:', error);
    } finally {
      setAnalysisRunning(false);
    }
  };

  const handleSpecificAIAnalysis = () => {
    setShowAnalysisSelection(true);
  };

  const runSpecificAIAnalysis = async (analysisType: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setAiAnalysisLoading(true);
    setCurrentAnalysisType(analysisType);
    try {
      const response = await fetch('http://localhost:3001/api/ai/recommendations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          procurementData: {
            stats: dashboardStats,
            analysisType: analysisType,
            timestamp: new Date().toISOString()
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAiResults(data.data);
        setShowAnalysisSelection(false);
      }
    } catch (error) {
      console.error('Error running AI analysis:', error);
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  const closeAnalysisSelection = () => {
    setShowAnalysisSelection(false);
    setAiResults(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'vendor': return '🏢';
      case 'bid': return '📊';
      case 'compliance': return '✅';
      case 'spending': return '💰';
      default: return '🤖';
    }
  };

  const filteredInsights = filter === 'all' ? insights : insights.filter(insight => insight.category === filter);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading AI analysis...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">AI Analysis Dashboard</h1>
              <p className="text-gray-600">Intelligent insights and recommendations for procurement optimization</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                Back to Dashboard
              </Link>
              <button
                onClick={runAIAnalysis}
                disabled={analysisRunning}
                className={`px-4 py-2 rounded-md text-white mr-2 ${
                  analysisRunning 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {analysisRunning ? 'Running Analysis...' : 'Run New Analysis'}
              </button>
              <button
                onClick={handleSpecificAIAnalysis}
                className="px-4 py-2 rounded-md text-white bg-purple-600 hover:bg-purple-700"
              >
                Specific Analysis
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* AI Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{stats?.total_insights || 0}</div>
            <div className="text-sm text-gray-600">Total Insights</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-red-600">{stats?.high_priority || 0}</div>
            <div className="text-sm text-gray-600">High Priority</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">${stats?.cost_savings_potential?.toLocaleString() || 0}</div>
            <div className="text-sm text-gray-600">Savings Potential</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-yellow-600">{stats?.risk_score || 0}%</div>
            <div className="text-sm text-gray-600">Risk Score</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{stats?.automation_rate || 0}%</div>
            <div className="text-sm text-gray-600">Automation Rate</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">{stats?.prediction_accuracy || 0}%</div>
            <div className="text-sm text-gray-600">Prediction Accuracy</div>
          </div>
        </div>

        {/* AI Analysis Selection */}
        {showAnalysisSelection && (
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Select Analysis Type</h3>
                <button
                  onClick={closeAnalysisSelection}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 mb-4">Select the type of AI analysis you want to run:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => runSpecificAIAnalysis('vendor-optimization')}
                  disabled={aiAnalysisLoading}
                  className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">Vendor Optimization</h4>
                    <p className="text-sm text-gray-600 mt-1">Analyze vendor performance and suggest improvements</p>
                  </div>
                </button>
                <button
                  onClick={() => runSpecificAIAnalysis('cost-reduction')}
                  disabled={aiAnalysisLoading}
                  className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">Cost Reduction</h4>
                    <p className="text-sm text-gray-600 mt-1">Identify opportunities to reduce procurement costs</p>
                  </div>
                </button>
                <button
                  onClick={() => runSpecificAIAnalysis('risk-assessment')}
                  disabled={aiAnalysisLoading}
                  className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">Risk Assessment</h4>
                    <p className="text-sm text-gray-600 mt-1">Evaluate procurement risks and mitigation strategies</p>
                  </div>
                </button>
                <button
                  onClick={() => runSpecificAIAnalysis('compliance-review')}
                  disabled={aiAnalysisLoading}
                  className="p-4 border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">Compliance Review</h4>
                    <p className="text-sm text-gray-600 mt-1">Review compliance status and suggest improvements</p>
                  </div>
                </button>
              </div>
              
              {aiAnalysisLoading && (
                <div className="mt-4 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Running AI analysis...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Analysis Results */}
        {aiResults && (
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="p-6">
              <AIAnalysisResults 
                results={aiResults}
                analysisType={currentAnalysisType}
                onRunAnother={handleSpecificAIAnalysis}
              />
            </div>
          </div>
        )}

        {/* AI Capabilities Overview */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">AI Capabilities</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🧠</span>
                </div>
                <h4 className="font-medium text-gray-900">Smart Vendor Matching</h4>
                <p className="text-sm text-gray-600 mt-1">AI matches vendors to projects based on capabilities and performance</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">📈</span>
                </div>
                <h4 className="font-medium text-gray-900">Predictive Analytics</h4>
                <p className="text-sm text-gray-600 mt-1">Forecast spending patterns and identify cost optimization opportunities</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">⚡</span>
                </div>
                <h4 className="font-medium text-gray-900">Risk Assessment</h4>
                <p className="text-sm text-gray-600 mt-1">Automated risk scoring and early warning system for vendor issues</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🔄</span>
                </div>
                <h4 className="font-medium text-gray-900">Process Automation</h4>
                <p className="text-sm text-gray-600 mt-1">Streamline workflows with intelligent automation and decision support</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { key: 'all', label: 'All Insights' },
                { key: 'vendor', label: 'Vendor' },
                { key: 'bid', label: 'Bid' },
                { key: 'compliance', label: 'Compliance' },
                { key: 'spending', label: 'Spending' }
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

        {/* AI Insights List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              AI Insights ({filteredInsights.length})
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Machine learning-powered insights and recommendations for your procurement process
            </p>
          </div>
          <ul className="divide-y divide-gray-200">
            {filteredInsights.length === 0 ? (
              <li className="px-4 py-8 text-center text-gray-500">
                <div className="text-4xl mb-4">🤖</div>
                <p>No AI insights available yet. Click "Run New Analysis" to generate insights.</p>
              </li>
            ) : (
              filteredInsights.map((insight) => (
                <li key={insight.id} className="px-4 py-6 hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <span className="text-xl">{getCategoryIcon(insight.category)}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-lg font-medium text-gray-900">{insight.title}</h4>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(insight.priority)}`}>
                            {insight.priority}
                          </span>
                          <span className="text-sm text-gray-500">
                            {insight.confidence}% confidence
                          </span>
                        </div>
                      </div>
                      <div className="mb-3">
                        <p className="text-sm text-gray-700 mb-2">
                          <strong>Insight:</strong> {insight.insight}
                        </p>
                        <p className="text-sm text-gray-700">
                          <strong>Recommendation:</strong> {insight.recommendation}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>Data Source: {insight.data_source}</span>
                        <span>Generated: {new Date(insight.created_at).toLocaleDateString()}</span>
                      </div>
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