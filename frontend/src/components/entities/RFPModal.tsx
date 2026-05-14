'use client';

import React, { useState, useEffect } from 'react';
import { Modal, ConfirmModal } from '../ui/Modal';
import { Tabs, TabContent } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { Badge, getStatusVariant } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { AIAnalysisButton } from '../ai/AIAnalysisButton';
import { AILoadingState } from '../ai/AILoadingState';
import { API_URL } from '@/lib/api';

interface RFPRequirement {
  category: string;
  priority: string;
  requirement: string;
}

interface RFPEvalCriterion {
  criterion: string;
  weight: number;
  description?: string;
}

interface RFP {
  id: string;
  title: string;
  rfpNumber: string;
  description: string;
  category: string;
  budget: number;
  deadline: string;
  status: string;
  requirements?: RFPRequirement[] | string;
  evaluationCriteria?: RFPEvalCriterion[] | string;
  createdAt: string;
}

interface RFPModalProps {
  rfp: RFP | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (rfp: RFP) => void;
  onDelete: (id: string) => void;
}

interface AIInsights {
  overallScore?: number;
  summary?: string;
  categories?: { name: string; score: number }[];
  recommendations?: { title: string; description: string; priority: 'high' | 'medium' | 'low' }[];
  keyFindings?: string[];
  savingsOpportunities?: { area: string; potentialSavings: number }[];
}

export function RFPModal({ rfp, isOpen, onClose, onUpdate, onDelete }: RFPModalProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<RFP>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiInsights, setAIInsights] = useState<AIInsights | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rfp) {
      setEditData(rfp);
      setActiveTab('details');
      setIsEditing(false);
      setAIInsights(null);
      setError(null);
    }
  }, [rfp]);

  if (!rfp) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/rfps/${rfp.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });
      if (response.ok) {
        const data = await response.json();
        onUpdate(data.rfp || data.data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating RFP:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/rfps/${rfp.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      onDelete(rfp.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error deleting RFP:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const generateAIContent = async () => {
    setIsGenerating(true);
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
            text: `RFP Analysis:\nTitle: ${rfp.title}\nCategory: ${rfp.category}\nBudget: $${rfp.budget}\nDescription: ${rfp.description || 'N/A'}\nRequirements: ${typeof rfp.requirements === 'string' ? rfp.requirements : JSON.stringify(rfp.requirements || [])}\nDeadline: ${rfp.deadline}`,
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
      console.error('Error generating AI content:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsGenerating(false);
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
    { id: 'ai', label: 'AI Content' },
    { id: 'edit', label: 'Edit' },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={rfp.title}
        size="xl"
        footer={
          activeTab === 'edit' && isEditing ? (
            <>
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} isLoading={isSaving}>
                Save Changes
              </Button>
            </>
          ) : activeTab === 'details' ? (
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
              {/* Status */}
              <div className="flex items-center gap-4">
                <Badge variant={getStatusVariant(rfp.status)} size="md">
                  {rfp.status}
                </Badge>
                <span className="text-sm text-gray-500">
                  RFP #: <span className="font-medium">{rfp.rfpNumber}</span>
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Category</p>
                  <p className="mt-1 text-sm text-gray-900">{rfp.category || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Budget</p>
                  <p className="mt-1 text-sm font-semibold text-success">
                    ${rfp.budget?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Deadline</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(rfp.deadline).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Created</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(rfp.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Description */}
              {rfp.description && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Description</p>
                  <p className="text-sm text-gray-700">{rfp.description}</p>
                </div>
              )}

              {/* Requirements */}
              {rfp.requirements && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Requirements</p>
                  {Array.isArray(rfp.requirements) ? (
                    <div className="space-y-2">
                      {rfp.requirements.map((req, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{req.requirement}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">{req.category}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                                req.priority === 'high' ? 'bg-red-100 text-red-700' :
                                req.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>{req.priority}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{rfp.requirements}</p>
                  )}
                </div>
              )}

              {/* Evaluation Criteria */}
              {rfp.evaluationCriteria && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-2">Evaluation Criteria</p>
                  {Array.isArray(rfp.evaluationCriteria) ? (
                    <div className="space-y-2">
                      {rfp.evaluationCriteria.map((crit, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm text-gray-900">{crit.criterion}</p>
                            {crit.description && <p className="text-xs text-gray-500 mt-0.5">{crit.description}</p>}
                          </div>
                          <span className="text-sm font-semibold text-primary-600">{crit.weight}%</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{String(rfp.evaluationCriteria)}</p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-5">
              {!aiInsights && !isGenerating && !error && (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <div className="inline-flex p-4 bg-primary-50 rounded-full">
                      <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">AI RFP Analysis</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    Get AI-powered analysis of this RFP including quality score, key findings, and recommendations.
                  </p>
                  <AIAnalysisButton onClick={generateAIContent} label="Analyze RFP" />
                </div>
              )}

              {isGenerating && (
                <AILoadingState
                  message="Analyzing RFP..."
                  subMessage="Evaluating requirements and generating insights"
                />
              )}

              {error && !isGenerating && (
                <div className="text-center py-8">
                  <div className="inline-flex p-3 bg-red-50 rounded-full mb-3">
                    <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <p className="text-sm text-red-700 mb-3">{error}</p>
                  <Button variant="outline" size="sm" onClick={generateAIContent}>Try Again</Button>
                </div>
              )}

              {aiInsights && !isGenerating && (
                <div className="space-y-5">
                  {/* Score Header */}
                  <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-violet-200 text-xs font-medium">RFP Quality Score</p>
                        <span className="text-3xl font-bold">{aiInsights.overallScore || 0}/100</span>
                      </div>
                      <button onClick={generateAIContent} className="text-xs text-violet-200 hover:text-white flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Re-analyze
                      </button>
                    </div>
                    <div className="mt-3 w-full bg-white/20 rounded-full h-1.5">
                      <div className="bg-white rounded-full h-1.5 transition-all" style={{ width: `${aiInsights.overallScore || 0}%` }}></div>
                    </div>
                  </div>

                  {/* Summary */}
                  {aiInsights.summary && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm text-gray-700 leading-relaxed">{aiInsights.summary}</p>
                      </div>
                    </div>
                  )}

                  {/* Category Scores */}
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

                  {/* Key Findings */}
                  {aiInsights.keyFindings && aiInsights.keyFindings.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Key Findings</p>
                      <div className="space-y-2">
                        {aiInsights.keyFindings.map((finding, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-3 h-3 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <span className="text-gray-700">{finding}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Savings Opportunities */}
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

                  {/* Recommendations */}
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

          {activeTab === 'edit' && (
            <div className="space-y-4">
              {!isEditing ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Click the button below to edit RFP details</p>
                  <Button onClick={() => setIsEditing(true)}>Edit RFP</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Input
                    label="Title"
                    value={editData.title || ''}
                    onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    required
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Category"
                      value={editData.category || ''}
                      onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                    />
                    <Input
                      label="Budget"
                      type="number"
                      value={editData.budget || ''}
                      onChange={(e) => setEditData({ ...editData, budget: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                  <Textarea
                    label="Description"
                    value={editData.description || ''}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={3}
                  />
                  <Textarea
                    label="Requirements"
                    value={typeof editData.requirements === 'string' ? editData.requirements : JSON.stringify(editData.requirements || [], null, 2)}
                    onChange={(e) => setEditData({ ...editData, requirements: e.target.value })}
                    rows={4}
                  />
                  <Textarea
                    label="Evaluation Criteria"
                    value={typeof editData.evaluationCriteria === 'string' ? editData.evaluationCriteria : JSON.stringify(editData.evaluationCriteria || [], null, 2)}
                    onChange={(e) => setEditData({ ...editData, evaluationCriteria: e.target.value })}
                    rows={3}
                  />
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
        title="Delete RFP"
        message={`Are you sure you want to delete "${rfp.title}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </>
  );
}
