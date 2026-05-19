'use client';

import React, { useState, useEffect } from 'react';
import { Modal, ConfirmModal } from '../ui/Modal';
import { Tabs, TabContent } from '../ui/Tabs';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { AIAnalysisButton } from '../ai/AIAnalysisButton';
import { AILoadingState } from '../ai/AILoadingState';
import { API_URL } from '@/lib/api';

interface ComplianceCheck {
  id: any;
  title: string;
  category: string;
  status: 'passed' | 'failed' | 'pending' | 'warning';
  last_check: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  score?: number;
  vendor_id?: any;
  vendor_name?: string;
  issues?: string[];
  criticalIssues?: string[];
  recommendations?: string[];
}

interface AIComplianceResult {
  overallCompliance?: number;
  riskLevel?: string;
  summary?: string;
  regulationChecks?: Record<string, { compliant: boolean; score: number; issues: string[]; remediationSteps: string[] }>;
  criticalIssues?: string[];
  keyFindings?: string[];
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: { title: string; description: string; priority: string; category?: string }[];
}

interface ComplianceModalProps {
  check: ComplianceCheck | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (check: ComplianceCheck) => void;
  onDelete: (id: any) => void;
}

export function ComplianceModal({ check, isOpen, onClose, onUpdate, onDelete }: ComplianceModalProps) {
  const [activeTab, setActiveTab] = useState('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<ComplianceCheck>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResults, setAIResults] = useState<AIComplianceResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (check) {
      setEditData(check);
      setActiveTab('details');
      setIsEditing(false);
      setAIResults(null);
      setError(null);
    }
  }, [check]);

  if (!check) return null;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'passed': return 'success';
      case 'failed': return 'danger';
      case 'pending': return 'warning';
      case 'warning': return 'warning';
      default: return 'neutral';
    }
  };

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'critical': return 'danger';
      case 'high': return 'danger';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'neutral';
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/compliance/checks/${check.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editData),
      });
      if (response.ok) {
        const data = await response.json();
        onUpdate(data.check || data);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Error updating check:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${API_URL}/api/compliance/checks/${check.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      onDelete(check.id);
      setShowDeleteConfirm(false);
      onClose();
    } catch (error) {
      console.error('Error deleting check:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/compliance/checks/${check.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        const data = await response.json();
        onUpdate({ ...check, status: status as ComplianceCheck['status'] });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAIResults(null);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const issuesText = check.issues && check.issues.length > 0 ? `\nKnown Issues: ${check.issues.join('; ')}` : '';
      const criticalText = check.criticalIssues && check.criticalIssues.length > 0 ? `\nCritical Issues: ${check.criticalIssues.join('; ')}` : '';
      const scoreText = check.score ? `\nCurrent Compliance Score: ${check.score}/100` : '';
      const response = await fetch(`${API_URL}/api/ai/insights`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'compliance-check',
          data: {
            document: `Compliance Check: ${check.title}\nCategory: ${check.category}\nSeverity: ${check.severity}\nCurrent Status: ${check.status}\nDescription: ${check.description}${check.vendor_name ? `\nVendor: ${check.vendor_name}` : ''}${scoreText}${issuesText}${criticalText}`,
            regulations: [check.category || 'General Procurement Compliance'],
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
        setAIResults({
          overallCompliance: insights.overallCompliance || insights.overallScore || 0,
          riskLevel: (insights.riskLevel || 'MEDIUM').toUpperCase(),
          summary: insights.summary || '',
          regulationChecks: insights.regulationChecks || {},
          criticalIssues: insights.criticalIssues || [],
          keyFindings: insights.keyFindings || [],
          strengths: insights.strengths || [],
          weaknesses: insights.weaknesses || [],
          recommendations: Array.isArray(insights.recommendations)
            ? insights.recommendations.map((r: any) =>
                typeof r === 'string'
                  ? { title: r, description: r, priority: 'medium' }
                  : { title: r.title || '', description: r.description || '', priority: r.priority || 'medium', category: r.category }
              )
            : [],
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

  const getRiskStyle = (risk: string) => {
    switch (risk?.toUpperCase()) {
      case 'LOW': return 'bg-emerald-100 text-emerald-700';
      case 'MEDIUM': return 'bg-amber-100 text-amber-700';
      case 'HIGH': return 'bg-red-100 text-red-700';
      case 'CRITICAL': return 'bg-red-200 text-red-800';
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
    { id: 'status', label: 'Status' },
    { id: 'ai', label: 'AI Check' },
  ];

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={check.title}
        size="lg"
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
              {/* Status and Severity Badges */}
              <div className="flex items-center gap-4">
                <Badge variant={getStatusVariant(check.status)} size="md">
                  {check.status.charAt(0).toUpperCase() + check.status.slice(1)}
                </Badge>
                <Badge variant={getSeverityVariant(check.severity)} size="md">
                  {check.severity.charAt(0).toUpperCase() + check.severity.slice(1)} Severity
                </Badge>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Category</p>
                  <p className="mt-1 text-sm text-gray-900">{check.category}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Vendor</p>
                  <p className="mt-1 text-sm text-gray-900">{check.vendor_name || 'System-wide'}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase">Last Check</p>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(check.last_check).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Compliance Score */}
              {check.score !== undefined && check.score > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Compliance Score</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-gray-100 rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full ${check.score >= 70 ? 'bg-emerald-500' : check.score >= 40 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${check.score}%` }}></div>
                    </div>
                    <span className={`text-sm font-bold ${check.score >= 70 ? 'text-emerald-600' : check.score >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{check.score}%</span>
                  </div>
                </div>
              )}

              {/* Description / Issues */}
              {check.description && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Issues</p>
                  <p className="text-sm text-gray-700">{check.description}</p>
                </div>
              )}

              {/* Critical Issues */}
              {check.criticalIssues && check.criticalIssues.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-xs font-semibold text-red-700 uppercase mb-1.5">Critical Issues</p>
                  <div className="space-y-1">
                    {check.criticalIssues.map((issue, i) => (
                      <p key={i} className="text-sm text-red-700 flex items-start gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></span>
                        {issue}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {check.recommendations && check.recommendations.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Recommendations</p>
                  <ul className="space-y-1">
                    {check.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-1.5">
                        <span className="text-blue-500 mt-0.5 flex-shrink-0">→</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {activeTab === 'details' && isEditing && (
            <div className="space-y-4">
              <Input
                label="Title"
                value={editData.title || ''}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Category"
                  value={editData.category || ''}
                  onChange={(value) => setEditData({ ...editData, category: value })}
                  options={[
                    { value: 'Financial', label: 'Financial' },
                    { value: 'Legal', label: 'Legal' },
                    { value: 'Security', label: 'Security' },
                    { value: 'Quality', label: 'Quality' },
                    { value: 'Environmental', label: 'Environmental' },
                    { value: 'Data Protection', label: 'Data Protection' },
                  ]}
                />
                <Select
                  label="Severity"
                  value={editData.severity || 'medium'}
                  onChange={(value) => setEditData({ ...editData, severity: value as ComplianceCheck['severity'] })}
                  options={[
                    { value: 'low', label: 'Low' },
                    { value: 'medium', label: 'Medium' },
                    { value: 'high', label: 'High' },
                    { value: 'critical', label: 'Critical' },
                  ]}
                />
              </div>
              <Input
                label="Vendor Name"
                value={editData.vendor_name || ''}
                onChange={(e) => setEditData({ ...editData, vendor_name: e.target.value })}
              />
              <Textarea
                label="Description"
                value={editData.description || ''}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                rows={3}
              />
            </div>
          )}

          {activeTab === 'status' && (
            <div className="space-y-6">
              {/* Current Status */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">Current Status</h4>
                <div className="flex items-center gap-4">
                  <Badge variant={getStatusVariant(check.status)} size="md">
                    {check.status.charAt(0).toUpperCase() + check.status.slice(1)}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Last updated: {new Date(check.last_check).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Status Update */}
              <div>
                <Select
                  label="Update Status"
                  value={check.status}
                  onChange={handleStatusChange}
                  options={[
                    { value: 'pending', label: 'Pending' },
                    { value: 'passed', label: 'Passed' },
                    { value: 'failed', label: 'Failed' },
                    { value: 'warning', label: 'Warning' },
                  ]}
                />
              </div>

              {/* Status History (placeholder) */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Status Timeline</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary-500" />
                    <span className="text-sm text-gray-600">
                      {check.status === 'passed' ? 'Passed' : check.status === 'failed' ? 'Failed' : 'Under review'} - {new Date(check.last_check).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gray-300" />
                    <span className="text-sm text-gray-500">Check created</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-5">
              {!aiResults && !isAnalyzing && !error && (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <div className="inline-flex p-4 bg-primary-50 rounded-full">
                      <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">AI Compliance Check</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    Run an AI-powered analysis to get detailed compliance insights, risk assessment, and recommendations.
                  </p>
                  <AIAnalysisButton onClick={runAIAnalysis} label="Run AI Check" />
                </div>
              )}

              {isAnalyzing && (
                <AILoadingState
                  message="Analyzing compliance..."
                  subMessage="Checking regulations and generating recommendations"
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

              {aiResults && !isAnalyzing && (
                <div className="space-y-5">
                  {/* Score Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-200 text-xs font-medium">Overall Compliance Score</p>
                        <div className="flex items-center gap-3">
                          <span className="text-3xl font-bold">{aiResults.overallCompliance ?? 0}/100</span>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${getRiskStyle(aiResults.riskLevel || 'MEDIUM')}`}>
                            {aiResults.riskLevel} RISK
                          </span>
                        </div>
                      </div>
                      <button onClick={runAIAnalysis} className="text-xs text-blue-200 hover:text-white flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        Re-analyze
                      </button>
                    </div>
                    <div className="mt-3 w-full bg-white/20 rounded-full h-1.5">
                      <div className="bg-white rounded-full h-1.5 transition-all" style={{ width: `${aiResults.overallCompliance ?? 0}%` }}></div>
                    </div>
                  </div>

                  {/* Summary */}
                  {aiResults.summary && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm text-gray-700 leading-relaxed">{aiResults.summary}</p>
                      </div>
                    </div>
                  )}

                  {/* Regulation Checks */}
                  {aiResults.regulationChecks && Object.keys(aiResults.regulationChecks).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Regulation Breakdown</p>
                      <div className="space-y-3">
                        {Object.entries(aiResults.regulationChecks).map(([name, details], i) => (
                          <div key={i} className="bg-gray-50 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm text-gray-700 font-medium">
                                {name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold ${getScoreColor(details.score)}`}>{details.score}%</span>
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${details.compliant ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                  {details.compliant ? 'Compliant' : 'Non-Compliant'}
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                              <div className={`h-1.5 rounded-full transition-all ${getScoreBg(details.score)}`} style={{ width: `${details.score}%` }}></div>
                            </div>
                            {details.issues && details.issues.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {details.issues.map((issue, j) => (
                                  <p key={j} className="text-xs text-red-600 flex items-start gap-1">
                                    <span className="mt-0.5 flex-shrink-0">!</span> {issue}
                                  </p>
                                ))}
                              </div>
                            )}
                            {details.remediationSteps && details.remediationSteps.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {details.remediationSteps.map((step, j) => (
                                  <p key={j} className="text-xs text-emerald-600 flex items-start gap-1">
                                    <span className="mt-0.5 flex-shrink-0">→</span> {step}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Critical Issues */}
                  {aiResults.criticalIssues && aiResults.criticalIssues.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-xs font-semibold text-red-800 uppercase mb-2 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Critical Issues
                      </p>
                      <div className="space-y-1.5">
                        {aiResults.criticalIssues.map((issue, i) => (
                          <p key={i} className="text-sm text-red-700 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0"></span>
                            {issue}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Strengths & Weaknesses */}
                  {((aiResults.strengths && aiResults.strengths.length > 0) || (aiResults.weaknesses && aiResults.weaknesses.length > 0)) && (
                    <div className="grid grid-cols-2 gap-3">
                      {aiResults.strengths && aiResults.strengths.length > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3">
                          <p className="text-xs font-semibold text-emerald-700 uppercase mb-2">Strengths</p>
                          <div className="space-y-1.5">
                            {aiResults.strengths.map((s, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                                <svg className="w-3 h-3 text-emerald-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{s}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {aiResults.weaknesses && aiResults.weaknesses.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                          <p className="text-xs font-semibold text-red-700 uppercase mb-2">Weaknesses</p>
                          <div className="space-y-1.5">
                            {aiResults.weaknesses.map((w, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                                <svg className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>{w}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Key Findings */}
                  {aiResults.keyFindings && aiResults.keyFindings.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Key Findings</p>
                      <div className="space-y-2">
                        {aiResults.keyFindings.map((finding, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-xs font-bold text-blue-600">{i + 1}</span>
                            </div>
                            <span className="text-gray-700">{finding}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {aiResults.recommendations && aiResults.recommendations.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Recommendations</p>
                      <div className="space-y-2">
                        {aiResults.recommendations.map((rec, i) => {
                          const style = getPriorityStyle(rec.priority);
                          return (
                            <div key={i} className={`rounded-xl p-3 border-l-4 ${style.border} ${style.bg}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-900">{rec.title}</span>
                                <div className="flex items-center gap-1.5">
                                  {rec.category && <span className="text-xs text-gray-400">{rec.category}</span>}
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${style.badge}`}>{rec.priority}</span>
                                </div>
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
        title="Delete Compliance Check"
        message={`Are you sure you want to delete "${check.title}"? This action cannot be undone.`}
        confirmText="Delete"
        isLoading={isDeleting}
      />
    </>
  );
}
