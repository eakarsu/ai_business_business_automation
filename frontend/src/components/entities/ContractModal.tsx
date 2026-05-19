'use client';

import React, { useState, useEffect } from 'react';
import { Modal, ConfirmModal } from '../ui/Modal';
import { Tabs, TabContent } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { Badge, getStatusVariant } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { AIAnalysisButton } from '../ai/AIAnalysisButton';
import { AILoadingState } from '../ai/AILoadingState';
import { API_URL } from '@/lib/api';

interface Contract {
  id: string;
  title: string;
  contractNumber: string;
  vendorId?: string;
  vendorName: string;
  category: string;
  startDate: string;
  endDate: string;
  totalValue: number;
  status: string;
  riskLevel?: string;
  paymentTerms: string;
  deliveryTerms?: string;
  terms?: string;
}

interface NegotiationAnalysis {
  analysis?: {
    strengths?: string[];
    weaknesses?: string[];
    opportunities?: string[];
    threats?: string[];
  };
  negotiationPoints?: {
    term: string;
    priority: string;
    currentValue: string;
    targetValue: string;
    rationale: string;
  }[];
  counterProposals?: {
    term: string;
    proposedChange: string;
    justification: string;
  }[];
  riskAssessment?: {
    overallRisk: string;
    riskFactors: string[];
    mitigationStrategies: string[];
  };
  successProbability?: number;
  estimatedSavings?: {
    amount: number;
    percentage: number;
  };
  nextSteps?: string[];
}

interface ContractModalProps {
  contract: Contract | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (contract: Contract) => void;
  onDelete: (id: string) => void;
}

export function ContractModal({ contract, isOpen, onClose, onUpdate, onDelete }: ContractModalProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Contract>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<NegotiationAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contract) {
      setEditData(contract);
      setActiveTab('details');
      setIsEditing(false);
      setAnalysis(null);
      setError(null);
    }
  }, [contract]);

  if (!contract) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/contracts/${contract.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });
      if (response.ok) {
        const data = await response.json();
        onUpdate(data.contract || data.data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating contract:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/contracts/${contract.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      onDelete(contract.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error deleting contract:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/contracts/${contract.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        const data = await response.json();
        onUpdate(data.contract || data.data || { ...contract, status });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const runNegotiationAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysis(null);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/contracts/${contract.id}/negotiate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          negotiationGoals: ['Reduce costs', 'Improve terms', 'Minimize risk'],
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const aiData = data.data?.aiAnalysis || data.aiAnalysis || data;
        if (aiData.parseError) {
          setError('AI returned an invalid response. Please try again.');
          return;
        }
        // Normalize field names (AI may return camelCase or snake_case)
        const normalized: NegotiationAnalysis = {
          analysis: aiData.analysis || aiData.swotAnalysis || aiData.swot || undefined,
          negotiationPoints: aiData.negotiationPoints || aiData.negotiation_points || [],
          counterProposals: aiData.counterProposals || aiData.counter_proposals || [],
          riskAssessment: aiData.riskAssessment || aiData.risk_assessment || undefined,
          successProbability: aiData.successProbability ?? aiData.success_probability ?? aiData.winProbability ?? 0,
          estimatedSavings: aiData.estimatedSavings || aiData.estimated_savings || undefined,
          nextSteps: aiData.nextSteps || aiData.next_steps || aiData.recommendedNextSteps || [],
        };
        setAnalysis(normalized);
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || `Analysis failed (${response.status}). Please try again.`);
      }
    } catch (err) {
      console.error('Error analyzing contract:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low': return 'bg-emerald-100 text-emerald-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'high': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
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
    { id: 'terms', label: 'Terms' },
    { id: 'ai', label: 'AI Negotiation' },
  ];

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={contract.title}
        size="xl"
        footer={
          activeTab === 'details' && isEditing ? (
            <>
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} isLoading={isSaving}>
                Save Changes
              </Button>
            </>
          ) : activeTab === 'details' && !isEditing ? (
            <>
              <Button variant="danger" onClick={() => setShowDeleteConfirm(true)}>
                Delete
              </Button>
              <Button variant="secondary" onClick={() => setIsEditing(true)}>
                Edit
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
          {activeTab === 'details' && !isEditing && (
            <div className="space-y-6">
              {/* Status and Contract Number */}
              <div className="flex items-center gap-4">
                <Badge variant={getStatusVariant(contract.status)} size="md">
                  {contract.status}
                </Badge>
                <span className="text-sm text-gray-500">
                  Contract #: <span className="font-medium">{contract.contractNumber}</span>
                </span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Vendor</p>
                  <p className="mt-1 text-sm text-gray-900">{contract.vendorName}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Category</p>
                  <p className="mt-1 text-sm text-gray-900">{contract.category || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Total Value</p>
                  <p className="mt-1 text-sm font-semibold text-success">
                    ${contract.totalValue?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Payment Terms</p>
                  <p className="mt-1 text-sm text-gray-900">{contract.paymentTerms || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Start Date</p>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(contract.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">End Date</p>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(contract.endDate)}</p>
                </div>
              </div>

              {/* Status Update */}
              <div className="border-t pt-4">
                <Select
                  label="Contract Status"
                  value={contract.status}
                  onChange={handleStatusChange}
                  options={[
                    { value: 'DRAFT', label: 'Draft' },
                    { value: 'NEGOTIATING', label: 'Negotiating' },
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'EXPIRED', label: 'Expired' },
                    { value: 'TERMINATED', label: 'Terminated' },
                  ]}
                />
              </div>
            </div>
          )}

          {activeTab === 'details' && isEditing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Title"
                  value={editData.title || ''}
                  onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                  required
                />
                <Input
                  label="Vendor Name"
                  value={editData.vendorName || ''}
                  onChange={(e) => setEditData({ ...editData, vendorName: e.target.value })}
                />
                <Input
                  label="Category"
                  value={editData.category || ''}
                  onChange={(e) => setEditData({ ...editData, category: e.target.value })}
                />
                <Input
                  label="Total Value"
                  type="number"
                  value={editData.totalValue || ''}
                  onChange={(e) => setEditData({ ...editData, totalValue: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  label="Payment Terms"
                  value={editData.paymentTerms || ''}
                  onChange={(e) => setEditData({ ...editData, paymentTerms: e.target.value })}
                />
                <Input
                  label="Delivery Terms"
                  value={editData.deliveryTerms || ''}
                  onChange={(e) => setEditData({ ...editData, deliveryTerms: e.target.value })}
                />
              </div>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Payment Terms</h4>
                <p className="text-sm text-gray-600">{contract.paymentTerms || 'Not specified'}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Delivery Terms</h4>
                <p className="text-sm text-gray-600">{contract.deliveryTerms || 'Not specified'}</p>
              </div>
              {contract.terms && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Additional Terms</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{contract.terms}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-5">
              {!analysis && !isAnalyzing && !error && (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <div className="inline-flex p-4 bg-primary-50 rounded-full">
                      <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Contract Negotiation</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    Get AI-powered SWOT analysis, negotiation points, counter proposals, and recommended next steps.
                  </p>
                  <AIAnalysisButton onClick={runNegotiationAnalysis} label="Analyze Contract" />
                </div>
              )}

              {isAnalyzing && (
                <AILoadingState
                  message="Analyzing contract..."
                  subMessage="Generating negotiation strategy and recommendations"
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
                  <Button variant="outline" size="sm" onClick={runNegotiationAnalysis}>Try Again</Button>
                </div>
              )}

              {analysis && !isAnalyzing && (
                <div className="space-y-5">
                  {/* Success Probability Header */}
                  <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-indigo-200 text-xs font-medium">Negotiation Success Probability</p>
                        <span className="text-3xl font-bold">{analysis.successProbability ?? 0}%</span>
                        {analysis.estimatedSavings !== undefined && (
                          <p className="text-indigo-200 text-sm mt-1">
                            Potential savings: ${(analysis.estimatedSavings.amount ?? 0).toLocaleString()} ({analysis.estimatedSavings.percentage ?? 0}%)
                          </p>
                        )}
                      </div>
                      <button onClick={runNegotiationAnalysis} className="text-xs text-indigo-200 hover:text-white flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Re-analyze
                      </button>
                    </div>
                    <div className="mt-3 w-full bg-white/20 rounded-full h-1.5">
                      <div className="bg-white rounded-full h-1.5 transition-all" style={{ width: `${analysis.successProbability ?? 0}%` }}></div>
                    </div>
                  </div>

                  {/* SWOT Analysis */}
                  {analysis.analysis && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-3">SWOT Analysis</p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { key: 'strengths', label: 'Strengths', items: analysis.analysis.strengths, gradient: 'from-emerald-50 to-emerald-100', border: 'border-emerald-200', title: 'text-emerald-700', icon: '↑' },
                          { key: 'weaknesses', label: 'Weaknesses', items: analysis.analysis.weaknesses, gradient: 'from-red-50 to-red-100', border: 'border-red-200', title: 'text-red-700', icon: '↓' },
                          { key: 'opportunities', label: 'Opportunities', items: analysis.analysis.opportunities, gradient: 'from-blue-50 to-blue-100', border: 'border-blue-200', title: 'text-blue-700', icon: '★' },
                          { key: 'threats', label: 'Threats', items: analysis.analysis.threats, gradient: 'from-amber-50 to-amber-100', border: 'border-amber-200', title: 'text-amber-700', icon: '⚠' },
                        ].map((section) => (
                          <div key={section.key} className={`bg-gradient-to-br ${section.gradient} border ${section.border} rounded-xl p-3`}>
                            <p className={`text-xs font-semibold ${section.title} uppercase mb-2 flex items-center gap-1`}>
                              <span>{section.icon}</span> {section.label}
                            </p>
                            <ul className="space-y-1.5">
                              {section.items?.map((item, i) => (
                                <li key={i} className="text-xs text-gray-700 flex items-start gap-1.5">
                                  <span className="text-gray-400 mt-0.5 flex-shrink-0">•</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                              {(!section.items || section.items.length === 0) && (
                                <li className="text-xs text-gray-400 italic">No items identified</li>
                              )}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risk Assessment */}
                  {analysis.riskAssessment && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Risk Assessment</p>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getRiskColor(analysis.riskAssessment.overallRisk)}`}>
                          {analysis.riskAssessment.overallRisk} risk
                        </span>
                      </div>
                      {analysis.riskAssessment.riskFactors && analysis.riskAssessment.riskFactors.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 mb-1.5">Risk Factors</p>
                          <div className="space-y-1">
                            {analysis.riskAssessment.riskFactors.map((factor, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm">
                                <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <svg className="w-2.5 h-2.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01" />
                                  </svg>
                                </div>
                                <span className="text-gray-700 text-xs">{factor}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {analysis.riskAssessment.mitigationStrategies && analysis.riskAssessment.mitigationStrategies.length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1.5">Mitigation Strategies</p>
                          <div className="space-y-1">
                            {analysis.riskAssessment.mitigationStrategies.map((strategy, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm">
                                <div className="w-4 h-4 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <svg className="w-2.5 h-2.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <span className="text-gray-700 text-xs">{strategy}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Negotiation Points */}
                  {analysis.negotiationPoints && analysis.negotiationPoints.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Key Negotiation Points</p>
                      <div className="space-y-2">
                        {analysis.negotiationPoints.map((point, i) => {
                          const style = getPriorityStyle(point.priority);
                          return (
                            <div key={i} className={`rounded-xl p-3 border-l-4 ${style.border} ${style.bg}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-900">{point.term}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>{point.priority}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600 mb-1">
                                <span className="bg-white/60 px-2 py-0.5 rounded">{point.currentValue}</span>
                                <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                                <span className="bg-white/60 px-2 py-0.5 rounded font-medium text-gray-800">{point.targetValue}</span>
                              </div>
                              <p className="text-xs text-gray-500">{point.rationale}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Counter Proposals */}
                  {analysis.counterProposals && analysis.counterProposals.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Counter Proposals</p>
                      <div className="space-y-2">
                        {analysis.counterProposals.map((proposal, i) => (
                          <div key={i} className="bg-indigo-50 border border-indigo-200 rounded-xl p-3">
                            <p className="text-sm font-medium text-indigo-900">{proposal.term}</p>
                            <p className="text-xs text-indigo-700 mt-1 font-medium">{proposal.proposedChange}</p>
                            <p className="text-xs text-gray-500 mt-1">{proposal.justification}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Steps */}
                  {analysis.nextSteps && analysis.nextSteps.length > 0 && (
                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
                      <p className="text-xs font-semibold text-indigo-800 uppercase mb-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        Recommended Next Steps
                      </p>
                      <div className="space-y-2">
                        {analysis.nextSteps.map((step, i) => (
                          <div key={i} className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5 font-medium">{i + 1}</span>
                            <span className="text-sm text-gray-700">{step}</span>
                          </div>
                        ))}
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
        title="Delete Contract"
        message={`Are you sure you want to delete "${contract.title}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </>
  );
}
