'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';

interface Vendor {
  id: string;
  name: string;
  email: string;
  industryType: string;
  overallScore: number;
  financialScore: number;
  technicalScore: number;
  complianceScore: number;
  experienceScore: number;
  riskLevel: string;
  qualificationStatus: string;
  annualRevenue: number;
  employeeCount: number;
}

interface AIAnalysis {
  overallScore: number;
  categoryScores: {
    financial_stability: number;
    technical_capability: number;
    compliance_history: number;
    experience: number;
    references: number;
  };
  riskLevel: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  keyFindings: string[];
  recommendations: { title: string; description: string; priority: string; category: string }[];
}

export default function AIVendorScorerPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchVendors(token);
  }, [router]);

  const fetchVendors = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/vendors`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors || []);
      }
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeVendor = async (vendor: Vendor) => {
    setAnalyzing(true);
    setSelectedVendor(vendor);
    setShowDetail(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/api/ai/insights`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'vendor-analysis',
          data: {
            name: vendor.name,
            industry: vendor.industryType,
            annualRevenue: vendor.annualRevenue,
            employeeCount: vendor.employeeCount,
            currentScore: vendor.overallScore,
            financialScore: vendor.financialScore,
            technicalScore: vendor.technicalScore,
            complianceScore: vendor.complianceScore,
            experienceScore: vendor.experienceScore,
            riskLevel: vendor.riskLevel,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setAIAnalysis(data.data?.insights);
      }
    } catch (error) {
      console.error('Error analyzing vendor:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async (vendorId: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;
    const token = localStorage.getItem('token');

    try {
      await fetch(`${API_URL}/api/vendors/${vendorId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      setVendors(vendors.filter(v => v.id !== vendorId));
      setShowDetail(false);
    } catch (error) {
      console.error('Error deleting vendor:', error);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'bg-green-100 text-green-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'HIGH': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Vendor Scorer</h1>
              <p className="text-gray-600">Evaluate vendors with AI-powered analysis</p>
            </div>
            <Link href="/dashboard" className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="flex gap-6">
          {/* Vendor List */}
          <div className={`${showDetail ? 'w-1/2' : 'w-full'} transition-all`}>
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b">
                <h3 className="text-lg font-medium text-gray-900">Vendors ({vendors.length})</h3>
              </div>
              <ul className="divide-y divide-gray-200 max-h-[calc(100vh-300px)] overflow-y-auto">
                {vendors.map((vendor) => (
                  <li
                    key={vendor.id}
                    className={`px-4 py-4 hover:bg-gray-50 cursor-pointer ${selectedVendor?.id === vendor.id ? 'bg-indigo-50' : ''}`}
                    onClick={() => analyzeVendor(vendor)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <span className="text-indigo-600 font-medium">{vendor.name.charAt(0)}</span>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">{vendor.name}</p>
                          <p className="text-sm text-gray-500">{vendor.industryType}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(vendor.overallScore || 0)}`}>
                          {(vendor.overallScore || 0).toFixed(1)}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${getRiskColor(vendor.riskLevel)}`}>
                          {vendor.riskLevel}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detail Panel */}
          {showDetail && selectedVendor && (
            <div className="w-1/2">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 sm:px-6 border-b flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900">{selectedVendor.name}</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => router.push(`/vendors?edit=${selectedVendor.id}`)}
                      className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(selectedVendor.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setShowDetail(false)}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400"
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {/* Current Scores */}
                  <div className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Current Scores</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-500">Overall</p>
                        <p className="text-2xl font-bold text-indigo-600">{(selectedVendor.overallScore || 0).toFixed(1)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-500">Financial</p>
                        <p className="text-lg font-semibold text-gray-900">{(selectedVendor.financialScore || 0).toFixed(1)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-500">Technical</p>
                        <p className="text-lg font-semibold text-gray-900">{(selectedVendor.technicalScore || 0).toFixed(1)}</p>
                      </div>
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-500">Compliance</p>
                        <p className="text-lg font-semibold text-gray-900">{(selectedVendor.complianceScore || 0).toFixed(1)}</p>
                      </div>
                    </div>
                  </div>

                  {/* AI Analysis */}
                  <div className="border-t pt-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <span className="mr-2">🤖</span> AI Analysis
                    </h4>

                    {analyzing ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-500">Analyzing vendor...</p>
                      </div>
                    ) : aiAnalysis ? (
                      <div className="space-y-4">
                        {/* AI Score & Risk */}
                        <div className="bg-indigo-50 p-4 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-indigo-900">AI Score</span>
                            <span className={`px-3 py-1 rounded-full text-lg font-bold ${getScoreColor(aiAnalysis.overallScore)}`}>
                              {aiAnalysis.overallScore}
                            </span>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs ${getRiskColor(aiAnalysis.riskLevel?.toUpperCase())}`}>
                            Risk: {aiAnalysis.riskLevel}
                          </span>
                        </div>

                        {/* Summary */}
                        {aiAnalysis.summary && (
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-700">{aiAnalysis.summary}</p>
                          </div>
                        )}

                        {/* Category Scores */}
                        {aiAnalysis.categoryScores && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">Category Breakdown</p>
                            <div className="space-y-2">
                              {Object.entries(aiAnalysis.categoryScores).map(([key, value]) => (
                                <div key={key} className="flex items-center">
                                  <span className="text-xs text-gray-600 w-32 capitalize">{key.replace(/_/g, ' ')}</span>
                                  <div className="flex-1 bg-gray-200 rounded-full h-2 ml-2">
                                    <div
                                      className="bg-indigo-600 h-2 rounded-full"
                                      style={{ width: `${value}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-xs text-gray-600 ml-2 w-8">{value}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Key Findings */}
                        {aiAnalysis.keyFindings && aiAnalysis.keyFindings.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">Key Findings</p>
                            <ul className="space-y-1">
                              {aiAnalysis.keyFindings.map((finding, idx) => (
                                <li key={idx} className="text-sm text-gray-700 flex items-start">
                                  <span className="text-indigo-500 mr-2 mt-0.5">&#10003;</span>
                                  {finding}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Strengths & Weaknesses */}
                        <div className="grid grid-cols-2 gap-3">
                          {aiAnalysis.strengths && aiAnalysis.strengths.length > 0 && (
                            <div className="bg-green-50 p-3 rounded-lg">
                              <p className="text-xs font-medium text-green-800 mb-2">Strengths</p>
                              <ul className="space-y-1">
                                {aiAnalysis.strengths.map((s, idx) => (
                                  <li key={idx} className="text-sm text-green-700 flex items-start">
                                    <span className="mr-1">+</span> {s}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {aiAnalysis.weaknesses && aiAnalysis.weaknesses.length > 0 && (
                            <div className="bg-red-50 p-3 rounded-lg">
                              <p className="text-xs font-medium text-red-800 mb-2">Weaknesses</p>
                              <ul className="space-y-1">
                                {aiAnalysis.weaknesses.map((w, idx) => (
                                  <li key={idx} className="text-sm text-red-700 flex items-start">
                                    <span className="mr-1">-</span> {w}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>

                        {/* Recommendations */}
                        {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">Recommendations</p>
                            <div className="space-y-2">
                              {aiAnalysis.recommendations.map((rec, idx) => (
                                <div key={idx} className={`p-3 rounded-lg border-l-4 ${rec.priority === 'high' ? 'bg-red-50 border-red-500' : rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-500' : 'bg-blue-50 border-blue-500'}`}>
                                  <div className="flex justify-between items-start">
                                    <span className="text-sm font-medium text-gray-900">{rec.title}</span>
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${rec.priority === 'high' ? 'bg-red-100 text-red-700' : rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{rec.priority}</span>
                                  </div>
                                  <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                                  {rec.category && <span className="text-xs text-gray-400 mt-1 inline-block">{rec.category}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">Click analyze to get AI insights</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
