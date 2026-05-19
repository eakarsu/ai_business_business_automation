'use client';

import React, { useState, useEffect } from 'react';
import { Modal, ConfirmModal } from '../ui/Modal';
import { Tabs, TabContent } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { ProgressBar } from '../ui/ProgressBar';
import { AIAnalysisButton } from '../ai/AIAnalysisButton';
import { AILoadingState } from '../ai/AILoadingState';
import { API_URL } from '@/lib/api';

interface SavingsOpportunity {
  id: string;
  title: string;
  category: string;
  type: string;
  potentialSavings: number;
  currentSpend: number;
  targetSpend: number;
  status: 'identified' | 'in_progress' | 'realized' | 'dismissed';
  vendor?: string;
  vendorName?: string;
  description?: string;
  implementationSteps?: string[];
  createdAt: string;
}

interface SavingsModalProps {
  savings: SavingsOpportunity | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (savings: SavingsOpportunity) => void;
  onDelete: (id: string) => void;
}

interface AIRecommendation {
  overallScore?: number;
  summary?: string;
  categories?: { name: string; score: number }[];
  recommendations?: { title: string; description: string; priority: 'high' | 'medium' | 'low' }[];
  keyFindings?: string[];
  savingsOpportunities?: { area: string; potentialSavings: number }[];
}

export function SavingsModal({ savings, isOpen, onClose, onUpdate, onDelete }: SavingsModalProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiRecommendation, setAIRecommendation] = useState<AIRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (savings) {
      setActiveTab('details');
      setAIRecommendation(null);
      setError(null);
    }
  }, [savings]);

  if (!savings) return null;

  const handleStatusChange = async (status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/savings/${savings.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        onUpdate({ ...savings, status: status as SavingsOpportunity['status'] });
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/savings/${savings.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      onDelete(savings.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (err) {
      console.error('Error deleting savings:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAIRecommendation(null);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/ai/insights`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'document-analysis',
          data: {
            text: `Savings Opportunity Analysis:\nTitle: ${savings.title}\nCategory: ${savings.category}\nPotential Savings: $${savings.potentialSavings}\nDescription: ${savings.description || 'N/A'}\nVendor: ${savings.vendorName || savings.vendor || 'N/A'}\nCurrent Spend: $${savings.currentSpend || 0}`,
            analysisType: 'vendor-qualification',
          },
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const insights = data.data?.insights || {};
        if (insights.parseError) {
          setError('AI returned an invalid response. Please try again.');
          return;
        }
        setAIRecommendation({
          overallScore: insights.overallScore || 0,
          summary: insights.summary || '',
          categories: insights.categories || [],
          recommendations: Array.isArray(insights.recommendations)
            ? insights.recommendations.map((r: any) =>
                typeof r === 'string'
                  ? { title: r, description: r, priority: 'medium' as const }
                  : { title: r.title || '', description: r.description || '', priority: r.priority || 'medium' }
              )
            : [],
          keyFindings: insights.keyFindings || insights.key_findings || [],
          savingsOpportunities: insights.savingsOpportunities || [],
        });
      } else {
        setError('Analysis failed. Please try again.');
      }
    } catch (err) {
      console.error('Error running AI analysis:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'info' | 'neutral' => {
    switch (status) {
      case 'realized': return 'success';
      case 'in_progress': return 'warning';
      case 'identified': return 'info';
      case 'dismissed': return 'neutral';
      default: return 'neutral';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 70) return 'bg-emerald-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high': return { border: 'border-red-500', bg: 'bg-red-50', badge: 'bg-red-100 text-red-700' };
      case 'medium': return { border: 'border-amber-500', bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-700' };
      default: return { border: 'border-blue-500', bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-700' };
    }
  };

  const savingsPercent = savings.currentSpend > 0 ? ((savings.currentSpend - savings.targetSpend) / savings.currentSpend) * 100 : 0;

  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'ai', label: 'AI Recommendation' },
    { id: 'actions', label: 'Actions' },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={savings.title}
        size="lg"
        footer={
          activeTab === 'details' ? (
            <>
              <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                Delete
              </Button>
              <Button variant="ghost" onClick={onClose}>
                Close
              </Button>
            </>
          ) : null
        }
      >
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <TabContent>
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Status and Savings Amount */}
              <div className="flex items-center justify-between">
                <Badge variant={getStatusVariant(savings.status)} size="md">
                  {savings.status.replace('_', ' ').charAt(0).toUpperCase() + savings.status.replace('_', ' ').slice(1)}
                </Badge>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Potential Savings</p>
                  <p className="text-2xl font-bold text-success">
                    ${savings.potentialSavings.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Savings Progress */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Current Spend</span>
                  <span className="font-medium">${savings.currentSpend.toLocaleString()}</span>
                </div>
                <ProgressBar
                  value={savingsPercent}
                  max={100}
                  showValue={false}
                  variant="success"
                />
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-500">Target Spend</span>
                  <span className="font-medium text-success">${savings.targetSpend.toLocaleString()}</span>
                </div>
                <p className="text-center text-sm text-gray-500 mt-2">
                  {savingsPercent.toFixed(1)}% potential reduction
                </p>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Category</p>
                  <p className="mt-1 text-sm text-gray-900">{savings.category}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Type</p>
                  <p className="mt-1 text-sm text-gray-900">{savings.type}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Vendor</p>
                  <p className="mt-1 text-sm text-gray-900">{savings.vendor || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Identified</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(savings.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {savings.description && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Description</p>
                  <p className="text-sm text-gray-700">{savings.description}</p>
                </div>
              )}

              {savings.implementationSteps && savings.implementationSteps.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Implementation Steps</p>
                  <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                    {savings.implementationSteps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-5">
              {!aiRecommendation && !isAnalyzing && !error && (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <div className="inline-flex p-4 bg-primary-50 rounded-full">
                      <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Savings Analysis</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    Get AI-powered feasibility analysis, risk assessment, and recommendations for this savings opportunity.
                  </p>
                  <AIAnalysisButton onClick={runAIAnalysis} label="Analyze Opportunity" />
                </div>
              )}

              {isAnalyzing && (
                <AILoadingState
                  message="Analyzing savings opportunity..."
                  subMessage="Evaluating feasibility and generating recommendations"
                />
              )}

              {error && !isAnalyzing && (
                <div className="text-center py-8">
                  <div className="inline-flex p-3 bg-red-50 rounded-full mb-3">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="text-sm text-red-700 mb-3">{error}</p>
                  <Button variant="outline" size="sm" onClick={runAIAnalysis}>Try Again</Button>
                </div>
              )}

              {aiRecommendation && !isAnalyzing && (
                <div className="space-y-5">
                  {/* Score Header */}
                  <div className="bg-gradient-to-r from-teal-600 to-emerald-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-teal-200 text-xs font-medium">Feasibility Score</p>
                        <span className="text-3xl font-bold">{aiRecommendation.overallScore || 0}/100</span>
                      </div>
                      <button onClick={runAIAnalysis} className="text-xs text-teal-200 hover:text-white flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Re-analyze
                      </button>
                    </div>
                    <div className="mt-3 w-full bg-white/20 rounded-full h-1.5">
                      <div className="bg-white rounded-full h-1.5 transition-all" style={{ width: `${aiRecommendation.overallScore || 0}%` }}></div>
                    </div>
                  </div>

                  {/* Summary */}
                  {aiRecommendation.summary && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm text-gray-700 leading-relaxed">{aiRecommendation.summary}</p>
                      </div>
                    </div>
                  )}

                  {/* Category Scores */}
                  {aiRecommendation.categories && aiRecommendation.categories.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Assessment Breakdown</p>
                      <div className="space-y-3">
                        {aiRecommendation.categories.map((cat, i) => (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-700">{cat.name}</span>
                              <span className={`text-sm font-bold ${getScoreColor(cat.score)}`}>{cat.score}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                              <div className={`h-2 rounded-full transition-all ${getScoreBg(cat.score)}`} style={{ width: `${cat.score}%` }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Key Findings */}
                  {aiRecommendation.keyFindings && aiRecommendation.keyFindings.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Key Findings</p>
                      <div className="space-y-2">
                        {aiRecommendation.keyFindings.map((finding, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-3 h-3 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-gray-700">{finding}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {aiRecommendation.recommendations && aiRecommendation.recommendations.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Recommendations</p>
                      <div className="space-y-2">
                        {aiRecommendation.recommendations.map((rec, i) => {
                          const style = getPriorityStyle(rec.priority);
                          return (
                            <div key={i} className={`rounded-xl p-3 border-l-4 ${style.border} ${style.bg}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-900">{rec.title}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>{rec.priority}</span>
                              </div>
                              <p className="text-xs text-gray-600">{rec.description}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'actions' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Update Status</h4>
                <div className="grid grid-cols-2 gap-3">
                  {['identified', 'in_progress', 'realized', 'dismissed'].map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      className={`p-3 rounded-lg border-2 text-sm font-medium transition-colors ${
                        savings.status === status
                          ? 'border-primary-500 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300 text-gray-600'
                      }`}
                    >
                      {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Quick Actions</h4>
                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Schedule Review Meeting
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Generate Report
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabContent>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Savings Opportunity"
        message={`Are you sure you want to delete "${savings.title}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </>
  );
}
