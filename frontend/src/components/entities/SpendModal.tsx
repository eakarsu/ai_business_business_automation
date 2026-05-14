'use client';

import React, { useState, useEffect } from 'react';
import { Modal, ConfirmModal } from '../ui/Modal';
import { Tabs, TabContent } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { ProgressBar } from '../ui/ProgressBar';
import { AIAnalysisButton } from '../ai/AIAnalysisButton';
import { AILoadingState } from '../ai/AILoadingState';
import { API_URL } from '@/lib/api';

interface SpendItem {
  id: string;
  category: string;
  vendor: string;
  amount: number;
  date: string;
  description: string;
  department?: string;
  budgetCategory?: string;
  percentOfBudget?: number;
}

interface SpendModalProps {
  spend: SpendItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updatedSpend: SpendItem) => void;
  onDelete?: (id: string) => void;
}

interface AIInsights {
  overallScore?: number;
  summary?: string;
  categories?: { name: string; score: number }[];
  recommendations?: { title: string; description: string; priority: 'high' | 'medium' | 'low' }[];
  keyFindings?: string[];
  savingsOpportunities?: { area: string; potentialSavings: number }[];
}

export function SpendModal({ spend, isOpen, onClose, onUpdate, onDelete }: SpendModalProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsights, setAIInsights] = useState<AIInsights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<SpendItem>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (spend) {
      setActiveTab('details');
      setAIInsights(null);
      setError(null);
      setIsEditing(false);
      setEditData({
        category: spend.category,
        vendor: spend.vendor,
        amount: spend.amount,
        description: spend.description,
        department: spend.department,
      });
    }
  }, [spend]);

  if (!spend) return null;

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAIInsights(null);
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
            text: `Spend Record Analysis:\nVendor: ${spend.vendor}\nCategory: ${spend.category}\nAmount: $${spend.amount}\nDepartment: ${spend.department || 'N/A'}\nDescription: ${spend.description || 'N/A'}`,
            analysisType: 'bid-evaluation',
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
        setAIInsights({
          overallScore: insights.overallScore || insights.score || 0,
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

  const handleSave = async () => {
    if (!onUpdate) return;
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/spend/${spend.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });
      if (response.ok) {
        const data = await response.json();
        onUpdate(data.data || { ...spend, ...editData });
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error updating spend:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/spend/${spend.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        onDelete(spend.id);
        onClose();
      }
    } catch (err) {
      console.error('Error deleting spend:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
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

  const tabs = [
    { id: 'details', label: 'Details' },
    ...(onUpdate ? [{ id: 'edit', label: 'Edit' }] : []),
    { id: 'ai', label: 'AI Insights' },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`${spend.category} - ${spend.vendor}`}
        size="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <div>
              {onDelete && (
                <Button variant="danger" size="sm" onClick={() => setShowDeleteConfirm(true)}>
                  Delete
                </Button>
              )}
            </div>
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>
        }
      >
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <TabContent>
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="p-4 bg-primary-50 rounded-lg">
                <p className="text-sm text-primary-600">Total Amount</p>
                <p className="text-3xl font-bold text-primary-700">
                  ${spend.amount.toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Category</p>
                  <p className="mt-1 text-sm text-gray-900">{spend.category}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Vendor</p>
                  <p className="mt-1 text-sm text-gray-900">{spend.vendor}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Date</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(spend.date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Department</p>
                  <p className="mt-1 text-sm text-gray-900">{spend.department || '-'}</p>
                </div>
              </div>

              {spend.percentOfBudget && (
                <div>
                  <ProgressBar
                    value={spend.percentOfBudget}
                    label="Budget Utilization"
                    variant={spend.percentOfBudget > 90 ? 'danger' : spend.percentOfBudget > 70 ? 'warning' : 'success'}
                  />
                </div>
              )}

              {spend.description && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Description</p>
                  <p className="text-sm text-gray-700">{spend.description}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'edit' && onUpdate && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Category"
                  value={editData.category || ''}
                  onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                />
                <Input
                  label="Vendor"
                  value={editData.vendor || ''}
                  onChange={(e) => setEditData({ ...editData, vendor: e.target.value })}
                />
                <Input
                  label="Amount"
                  type="number"
                  value={editData.amount?.toString() || ''}
                  onChange={(e) => setEditData({ ...editData, amount: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  label="Department"
                  value={editData.department || ''}
                  onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                />
              </div>
              <Textarea
                label="Description"
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={3}
              />
              <div className="flex justify-end gap-3">
                <Button variant="ghost" onClick={() => setActiveTab('details')}>Cancel</Button>
                <Button onClick={handleSave} isLoading={isSaving}>Save Changes</Button>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-5">
              {!aiInsights && !isAnalyzing && !error && (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <div className="inline-flex p-4 bg-primary-50 rounded-full">
                      <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Spend Insights</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    Get AI-powered insights on this spend item including efficiency analysis and savings opportunities.
                  </p>
                  <AIAnalysisButton onClick={runAIAnalysis} label="Analyze Spend" />
                </div>
              )}

              {isAnalyzing && (
                <AILoadingState
                  message="Analyzing spend..."
                  subMessage="Identifying patterns and savings opportunities"
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

              {aiInsights && !isAnalyzing && (
                <div className="space-y-5">
                  <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-200 text-xs font-medium">Overall Spend Health</p>
                        <span className="text-3xl font-bold">{aiInsights.overallScore || 0}/100</span>
                      </div>
                      <button onClick={runAIAnalysis} className="text-xs text-emerald-200 hover:text-white flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Re-analyze
                      </button>
                    </div>
                    <div className="mt-3 w-full bg-white/20 rounded-full h-1.5">
                      <div className="bg-white rounded-full h-1.5 transition-all" style={{ width: `${aiInsights.overallScore || 0}%` }}></div>
                    </div>
                  </div>

                  {aiInsights.summary && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm text-gray-700 leading-relaxed">{aiInsights.summary}</p>
                      </div>
                    </div>
                  )}

                  {aiInsights.categories && aiInsights.categories.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Category Breakdown</p>
                      <div className="space-y-3">
                        {aiInsights.categories.map((cat, i) => (
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

                  {aiInsights.keyFindings && aiInsights.keyFindings.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Key Findings</p>
                      <div className="space-y-2">
                        {aiInsights.keyFindings.map((finding, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-3 h-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-gray-700">{finding}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiInsights.savingsOpportunities && aiInsights.savingsOpportunities.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-xs font-semibold text-amber-800 uppercase mb-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Savings Opportunities
                      </p>
                      <div className="space-y-2">
                        {aiInsights.savingsOpportunities.map((opp, i) => (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-sm text-amber-900">{opp.area}</span>
                            <span className="text-sm font-bold text-emerald-700">${(opp.potentialSavings || 0).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Recommendations</p>
                      <div className="space-y-2">
                        {aiInsights.recommendations.map((rec, i) => {
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
        </TabContent>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Spend Record"
        message="Are you sure you want to delete this spend record? This action cannot be undone."
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </>
  );
}
