'use client';

import React, { useState, useEffect } from 'react';
import { Modal, ConfirmModal } from '../ui/Modal';
import { Tabs, TabContent } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { Badge, getStatusVariant } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { ProgressBar, ScoreDisplay } from '../ui/ProgressBar';
import { AIAnalysisButton } from '../ai/AIAnalysisButton';
import { AILoadingState } from '../ai/AILoadingState';
import { AIResultsPanel } from '../ai/AIResultsPanel';
import { API_URL } from '@/lib/api';

interface Vendor {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  sku?: string;
}

interface Bid {
  id: string;
  title: string;
  description: string;
  rfpNumber: string;
  vendorId: string;
  vendor: Vendor;
  productId?: string;
  product?: Product;
  proposedAmount: number;
  proposedTimeline: number;
  technicalApproach: string;
  status: string;
  submittedAt: string;
  technicalScore?: number;
  costScore?: number;
  timelineScore?: number;
  riskScore?: number;
  overallScore?: number;
}

interface BidModalProps {
  bid: Bid | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (bid: Bid) => void;
  onDelete: (id: string) => void;
}

interface AIAnalysisResult {
  overallScore?: number;
  winProbability?: number;
  riskLevel?: string;
  summary?: string;
  categories?: { name: string; score: number }[];
  recommendations?: { title: string; description: string; priority: 'high' | 'medium' | 'low'; category?: string }[];
  strengths?: string[];
  weaknesses?: string[];
  keyFindings?: string[];
}

export function BidModal({ bid, isOpen, onClose, onUpdate, onDelete }: BidModalProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Bid>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResults, setAIResults] = useState<AIAnalysisResult | null>(null);

  useEffect(() => {
    if (bid) {
      setEditData(bid);
      setActiveTab('details');
      setIsEditing(false);
      setAIResults(null);
    }
  }, [bid]);

  if (!bid) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/bids/${bid.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });
      if (response.ok) {
        const data = await response.json();
        onUpdate(data.data || data.bid);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating bid:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/bids/${bid.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      onDelete(bid.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error deleting bid:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/bids/${bid.id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        const data = await response.json();
        onUpdate(data.data || data.bid || { ...bid, status });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAIResults(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/ai/insights`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'bid-analysis',
          data: {
            title: bid.title,
            description: bid.description,
            vendorName: bid.vendor?.name,
            proposedAmount: bid.proposedAmount,
            proposedTimeline: bid.proposedTimeline,
            technicalApproach: bid.technicalApproach,
            currentScores: {
              technical: bid.technicalScore,
              cost: bid.costScore,
              timeline: bid.timelineScore,
              risk: bid.riskScore,
              overall: bid.overallScore,
            },
          },
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const insights = data.data?.insights || {};
        setAIResults({
          overallScore: insights.overallScore || bid.overallScore,
          riskLevel: (insights.riskLevel || 'MEDIUM').toUpperCase(),
          summary: insights.summary || insights.competitivePosition || '',
          categories: [
            { name: 'Technical Score', score: insights.technicalScore || bid.technicalScore || 0 },
            { name: 'Cost Score', score: insights.costScore || bid.costScore || 0 },
            { name: 'Timeline Score', score: insights.timelineScore || bid.timelineScore || 0 },
            { name: 'Risk Score', score: insights.riskScore || bid.riskScore || 0 },
          ],
          keyFindings: insights.keyFindings || [],
          recommendations: Array.isArray(insights.recommendations)
            ? insights.recommendations.map((r: any) =>
                typeof r === 'string'
                  ? { title: r, description: r, priority: 'medium' as const }
                  : { title: r.title || '', description: r.description || '', priority: r.priority || 'medium', category: r.category }
              )
            : [],
          strengths: insights.strengths || [],
          weaknesses: insights.weaknesses || [],
        });
      }
    } catch (error) {
      console.error('Error running AI analysis:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const tabs = [
    { id: 'details', label: 'Details' },
    { id: 'scores', label: 'Scores' },
    { id: 'edit', label: 'Edit' },
    { id: 'ai', label: 'AI Analysis' },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={bid.title}
        size="lg"
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
              <Button variant="secondary" onClick={onClose}>
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
                <Badge variant={getStatusVariant(bid.status)} size="md">
                  {bid.status.replace(/_/g, ' ')}
                </Badge>
                {bid.overallScore && (
                  <span className="text-sm text-gray-500">
                    Score: <span className="font-semibold text-primary-600">{bid.overallScore.toFixed(1)}</span>
                  </span>
                )}
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Vendor</p>
                  <p className="mt-1 text-sm text-gray-900">{bid.vendor?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Product</p>
                  <p className="mt-1 text-sm text-gray-900">{bid.product?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Proposed Amount</p>
                  <p className="mt-1 text-sm font-semibold text-success">
                    ${bid.proposedAmount?.toLocaleString() || 0}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Timeline</p>
                  <p className="mt-1 text-sm text-gray-900">{bid.proposedTimeline || 0} days</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Submitted</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(bid.submittedAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">RFP Number</p>
                  <p className="mt-1 text-sm text-gray-900">{bid.rfpNumber || '-'}</p>
                </div>
              </div>

              {/* Description */}
              {bid.description && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Description</p>
                  <p className="text-sm text-gray-700">{bid.description}</p>
                </div>
              )}

              {/* Technical Approach */}
              {bid.technicalApproach && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Technical Approach</p>
                  <p className="text-sm text-gray-700">{bid.technicalApproach}</p>
                </div>
              )}

              {/* Status Update */}
              <div className="border-t pt-4">
                <Select
                  label="Update Status"
                  value={bid.status}
                  onChange={handleStatusChange}
                  options={[
                    { value: 'DRAFT', label: 'Draft' },
                    { value: 'SUBMITTED', label: 'Submitted' },
                    { value: 'UNDER_EVALUATION', label: 'Under Evaluation' },
                    { value: 'EVALUATED', label: 'Evaluated' },
                    { value: 'SHORTLISTED', label: 'Shortlisted' },
                    { value: 'AWARDED', label: 'Awarded' },
                    { value: 'REJECTED', label: 'Rejected' },
                    { value: 'WITHDRAWN', label: 'Withdrawn' },
                    { value: 'COUNTER_OFFERED', label: 'Counter Offered' },
                  ]}
                />
              </div>
            </div>
          )}

          {activeTab === 'scores' && (
            <div className="space-y-6">
              {/* Overall Score */}
              <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
                <ScoreDisplay
                  score={bid.overallScore || 0}
                  label="Overall Score"
                  size="lg"
                />
              </div>

              {/* Score Breakdown */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Score Breakdown</h4>
                <div className="space-y-3">
                  <ProgressBar
                    value={bid.technicalScore || 0}
                    label="Technical"
                    variant="info"
                  />
                  <ProgressBar
                    value={bid.costScore || 0}
                    label="Cost"
                    variant="success"
                  />
                  <ProgressBar
                    value={bid.timelineScore || 0}
                    label="Timeline"
                    variant="warning"
                  />
                  <ProgressBar
                    value={bid.riskScore || 0}
                    label="Risk"
                    variant="danger"
                  />
                </div>
              </div>

              {/* Score Summary */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-info-light rounded-lg">
                  <p className="text-2xl font-bold text-info-dark">{bid.technicalScore?.toFixed(1) || '-'}</p>
                  <p className="text-xs text-gray-600">Technical</p>
                </div>
                <div className="text-center p-4 bg-success-light rounded-lg">
                  <p className="text-2xl font-bold text-success-dark">{bid.costScore?.toFixed(1) || '-'}</p>
                  <p className="text-xs text-gray-600">Cost</p>
                </div>
                <div className="text-center p-4 bg-warning-light rounded-lg">
                  <p className="text-2xl font-bold text-warning-dark">{bid.timelineScore?.toFixed(1) || '-'}</p>
                  <p className="text-xs text-gray-600">Timeline</p>
                </div>
                <div className="text-center p-4 bg-danger-light rounded-lg">
                  <p className="text-2xl font-bold text-danger-dark">{bid.riskScore?.toFixed(1) || '-'}</p>
                  <p className="text-xs text-gray-600">Risk</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'edit' && (
            <div className="space-y-4">
              {!isEditing ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Click the button below to edit bid details</p>
                  <Button onClick={() => setIsEditing(true)}>Edit Bid</Button>
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
                      label="Proposed Amount"
                      type="number"
                      value={editData.proposedAmount || ''}
                      onChange={(e) => setEditData({ ...editData, proposedAmount: parseFloat(e.target.value) || 0 })}
                    />
                    <Input
                      label="Timeline (days)"
                      type="number"
                      value={editData.proposedTimeline || ''}
                      onChange={(e) => setEditData({ ...editData, proposedTimeline: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <Textarea
                    label="Description"
                    value={editData.description || ''}
                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                    rows={3}
                  />
                  <Textarea
                    label="Technical Approach"
                    value={editData.technicalApproach || ''}
                    onChange={(e) => setEditData({ ...editData, technicalApproach: e.target.value })}
                    rows={4}
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-6">
              {!aiResults && !isAnalyzing && (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <div className="inline-flex p-4 bg-primary-50 rounded-full">
                      <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Bid Analysis</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    Get AI-powered bid optimization, win probability analysis, and recommendations to improve your bid.
                  </p>
                  <AIAnalysisButton onClick={runAIAnalysis} label="Analyze Bid" />
                </div>
              )}

              {isAnalyzing && (
                <AILoadingState
                  message="Analyzing bid..."
                  subMessage="Evaluating competitiveness and optimization opportunities"
                />
              )}

              {aiResults && !isAnalyzing && (
                <div className="space-y-4">
                  {/* Win Probability */}
                  {aiResults.winProbability && (
                    <div className="p-4 bg-primary-50 rounded-lg flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-primary-700">Estimated Win Probability</p>
                        <p className="text-xs text-primary-600">Based on AI analysis</p>
                      </div>
                      <div className="text-3xl font-bold text-primary-700">{aiResults.winProbability}%</div>
                    </div>
                  )}
                  <AIResultsPanel
                    results={aiResults}
                    title="Bid Analysis"
                    onRunAgain={runAIAnalysis}
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
        title="Delete Bid"
        message={`Are you sure you want to delete "${bid.title}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </>
  );
}
