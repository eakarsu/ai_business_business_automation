'use client';

import React, { useState, useEffect } from 'react';
import { Modal, ConfirmModal } from '../ui/Modal';
import { Tabs, TabContent } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { Badge, getStatusVariant, getRiskVariant } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { ProgressBar, ScoreDisplay } from '../ui/ProgressBar';
import { AIAnalysisButton } from '../ai/AIAnalysisButton';
import { AILoadingState } from '../ai/AILoadingState';
import { AIResultsPanel, AIAnalysisResult } from '../ai/AIResultsPanel';
import { API_URL } from '@/lib/api';

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  industryType: string;
  businessType: string;
  qualificationStatus: string;
  riskLevel: string;
  overallScore: number;
  financialScore: number;
  technicalScore: number;
  complianceScore: number;
  experienceScore: number;
  annualRevenue: number;
  employeeCount: number;
  yearEstablished: number;
  createdAt: string;
}

interface VendorModalProps {
  vendor: Vendor | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (vendor: Vendor) => void;
  onDelete: (id: string) => void;
}

export function VendorModal({ vendor, isOpen, onClose, onUpdate, onDelete }: VendorModalProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Vendor>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResults, setAIResults] = useState<AIAnalysisResult | null>(null);

  useEffect(() => {
    if (vendor) {
      setEditData(vendor);
      setActiveTab('details');
      setIsEditing(false);
      setAIResults(null);
    }
  }, [vendor]);

  if (!vendor) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/vendors/${vendor.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });
      if (response.ok) {
        const data = await response.json();
        onUpdate(data.vendor);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating vendor:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/vendors/${vendor.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      onDelete(vendor.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error deleting vendor:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/vendors/${vendor.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ qualificationStatus: status }),
      });
      if (response.ok) {
        const data = await response.json();
        onUpdate(data.vendor);
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
        const insights = data.data?.insights || {};
        setAIResults({
          overallScore: insights.overallScore || insights.score || vendor.overallScore,
          riskLevel: (insights.riskLevel || vendor.riskLevel || '').toUpperCase(),
          summary: insights.summary || insights.analysis || '',
          categories: insights.categoryScores
            ? Object.entries(insights.categoryScores).map(([name, score]) => ({
                name: name.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
                score: score as number,
              }))
            : [
                { name: 'Financial Stability', score: vendor.financialScore || 0 },
                { name: 'Technical Capability', score: vendor.technicalScore || 0 },
                { name: 'Compliance', score: vendor.complianceScore || 0 },
                { name: 'Experience', score: vendor.experienceScore || 0 },
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
    { id: 'edit', label: 'Edit' },
    { id: 'ai', label: 'AI Analysis' },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={vendor.name}
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
              {/* Status and Risk */}
              <div className="flex items-center gap-4">
                <Badge variant={getStatusVariant(vendor.qualificationStatus)} size="md">
                  {vendor.qualificationStatus}
                </Badge>
                <Badge variant={getRiskVariant(vendor.riskLevel)} size="md">
                  {vendor.riskLevel} Risk
                </Badge>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Email</p>
                  <p className="mt-1 text-sm text-gray-900">{vendor.email || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Phone</p>
                  <p className="mt-1 text-sm text-gray-900">{vendor.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Industry</p>
                  <p className="mt-1 text-sm text-gray-900">{vendor.industryType || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Business Type</p>
                  <p className="mt-1 text-sm text-gray-900">{vendor.businessType || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Annual Revenue</p>
                  <p className="mt-1 text-sm text-gray-900">${vendor.annualRevenue?.toLocaleString() || 0}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Employees</p>
                  <p className="mt-1 text-sm text-gray-900">{vendor.employeeCount || '-'}</p>
                </div>
              </div>

              {/* Scores */}
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-4">Performance Scores</h4>
                <div className="flex items-center gap-8 mb-4">
                  <ScoreDisplay score={vendor.overallScore || 0} label="Overall Score" size="lg" />
                </div>
                <div className="space-y-3">
                  <ProgressBar value={vendor.financialScore || 0} label="Financial" />
                  <ProgressBar value={vendor.technicalScore || 0} label="Technical" />
                  <ProgressBar value={vendor.complianceScore || 0} label="Compliance" />
                  <ProgressBar value={vendor.experienceScore || 0} label="Experience" />
                </div>
              </div>

              {/* Status Update */}
              <div className="border-t pt-4">
                <Select
                  label="Qualification Status"
                  value={vendor.qualificationStatus}
                  onChange={handleStatusChange}
                  options={[
                    { value: 'PENDING', label: 'Pending' },
                    { value: 'QUALIFIED', label: 'Qualified' },
                    { value: 'UNDER_REVIEW', label: 'Under Review' },
                    { value: 'DISQUALIFIED', label: 'Disqualified' },
                    { value: 'SUSPENDED', label: 'Suspended' },
                  ]}
                />
              </div>
            </div>
          )}

          {activeTab === 'edit' && (
            <div className="space-y-4">
              {!isEditing ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Click the button below to edit vendor details</p>
                  <Button onClick={() => setIsEditing(true)}>Edit Vendor</Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Name"
                    value={editData.name || ''}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    required
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={editData.email || ''}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                  />
                  <Input
                    label="Phone"
                    value={editData.phone || ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                  />
                  <Input
                    label="Industry Type"
                    value={editData.industryType || ''}
                    onChange={(e) => setEditData({ ...editData, industryType: e.target.value })}
                  />
                  <Input
                    label="Business Type"
                    value={editData.businessType || ''}
                    onChange={(e) => setEditData({ ...editData, businessType: e.target.value })}
                  />
                  <Input
                    label="Annual Revenue"
                    type="number"
                    value={editData.annualRevenue || ''}
                    onChange={(e) => setEditData({ ...editData, annualRevenue: parseFloat(e.target.value) || 0 })}
                  />
                  <Input
                    label="Employee Count"
                    type="number"
                    value={editData.employeeCount || ''}
                    onChange={(e) => setEditData({ ...editData, employeeCount: parseInt(e.target.value) || 0 })}
                  />
                  <Input
                    label="Year Established"
                    type="number"
                    value={editData.yearEstablished || ''}
                    onChange={(e) => setEditData({ ...editData, yearEstablished: parseInt(e.target.value) || 0 })}
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Vendor Analysis</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    Run AI-powered analysis to get detailed vendor scoring, risk assessment, and recommendations.
                  </p>
                  <AIAnalysisButton onClick={runAIAnalysis} label="Analyze Vendor" />
                </div>
              )}

              {isAnalyzing && (
                <AILoadingState
                  message="Analyzing vendor..."
                  subMessage="Evaluating financial stability, compliance, and capabilities"
                />
              )}

              {aiResults && !isAnalyzing && (
                <AIResultsPanel
                  results={aiResults}
                  title="Vendor Analysis"
                  onRunAgain={runAIAnalysis}
                />
              )}
            </div>
          )}
        </TabContent>
      </Modal>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Vendor"
        message={`Are you sure you want to delete "${vendor.name}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </>
  );
}
