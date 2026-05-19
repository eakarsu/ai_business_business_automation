'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';

interface RFP {
  id: string;
  title: string;
  rfpNumber: string;
  category: string;
  department: string;
  budget: number;
  status: string;
  submissionDeadline: string;
  description: string;
  aiGeneratedContent?: any;
}

interface GeneratedContent {
  executiveSummary?: string;
  scopeOfWork?: { objectives?: string[]; deliverables?: string[] };
  technicalRequirements?: { category: string; requirement: string; priority: string }[];
  evaluationCriteria?: { criterion: string; weight: number }[];
  timeline?: any;
  qualityScore?: number;
  suggestions?: string[];
}

export default function AIRFPGeneratorPage() {
  const [rfps, setRFPs] = useState<RFP[]>([]);
  const [selectedRFP, setSelectedRFP] = useState<RFP | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [formData, setFormData] = useState({
    title: '', category: 'IT Equipment', department: '', budget: '', description: '', requirements: ''
  });
  const router = useRouter();

  const categories = ['IT Equipment', 'Software', 'Professional Services', 'Construction', 'Healthcare', 'Office Supplies'];
  const departments = ['IT', 'Operations', 'HR', 'Finance', 'Marketing', 'Facilities'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetchRFPs(token);
  }, [router]);

  const fetchRFPs = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/rfps`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRFPs(data.rfps || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateRFP = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/api/rfps/generate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          budget: parseFloat(formData.budget) || 0,
          requirements: formData.requirements.split('\n').filter(r => r.trim()),
        }),
      });
      if (response.ok) {
        const data = await response.json();
        setGeneratedContent(data.data?.generatedContent);
        setShowGenerator(false);
        fetchRFPs(token!);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this RFP?')) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_URL}/api/rfps/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
      });
      setRFPs(rfps.filter(r => r.id !== id));
      if (selectedRFP?.id === id) setSelectedRFP(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PUBLISHED: 'bg-green-100 text-green-800',
      CLOSED: 'bg-red-100 text-red-800',
      AWARDED: 'bg-blue-100 text-blue-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI RFP Generator</h1>
            <p className="text-gray-600">Generate comprehensive RFP documents with AI</p>
          </div>
          <div className="flex space-x-3">
            <button onClick={() => setShowGenerator(true)} className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700">
              Generate New RFP
            </button>
            <Link href="/dashboard" className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">Dashboard</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Generator Form */}
        {showGenerator && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium mb-4">Generate New RFP with AI</h3>
            <form onSubmit={generateRFP} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full border rounded px-3 py-2" placeholder="RFP Title" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full border rounded px-3 py-2">
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}
                    className="w-full border rounded px-3 py-2">
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget ($)</label>
                  <input type="number" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})}
                    className="w-full border rounded px-3 py-2" placeholder="50000" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full border rounded px-3 py-2 h-20" placeholder="Describe your procurement needs..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Requirements (one per line)</label>
                <textarea value={formData.requirements} onChange={e => setFormData({...formData, requirements: e.target.value})}
                  className="w-full border rounded px-3 py-2 h-24" placeholder="Must have certification X&#10;Minimum 5 years experience&#10;24/7 support required" />
              </div>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowGenerator(false)} className="px-4 py-2 border rounded hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={generating}
                  className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50">
                  {generating ? 'Generating...' : 'Generate RFP with AI'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Generated Content Preview */}
        {generatedContent && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium flex items-center">
                <span className="mr-2">🤖</span> AI Generated RFP Content
              </h3>
              <button onClick={() => setGeneratedContent(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            {generatedContent.qualityScore && (
              <div className="bg-green-50 p-3 rounded-lg mb-4 flex justify-between items-center">
                <span className="text-green-800">Quality Score</span>
                <span className="text-2xl font-bold text-green-600">{generatedContent.qualityScore}/100</span>
              </div>
            )}

            {generatedContent.executiveSummary && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Executive Summary</h4>
                <p className="text-gray-600 bg-gray-50 p-3 rounded">{generatedContent.executiveSummary}</p>
              </div>
            )}

            {generatedContent.scopeOfWork && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Scope of Work</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm font-medium text-blue-800 mb-2">Objectives</p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {generatedContent.scopeOfWork.objectives?.map((o, i) => <li key={i}>• {o}</li>)}
                    </ul>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-sm font-medium text-green-800 mb-2">Deliverables</p>
                    <ul className="text-sm text-green-700 space-y-1">
                      {generatedContent.scopeOfWork.deliverables?.map((d, i) => <li key={i}>• {d}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {generatedContent.technicalRequirements && generatedContent.technicalRequirements.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Technical Requirements</h4>
                <div className="space-y-2">
                  {generatedContent.technicalRequirements.map((req, i) => (
                    <div key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <span className="text-sm">{req.requirement}</span>
                      <span className={`text-xs px-2 py-1 rounded ${req.priority === 'mandatory' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {req.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {generatedContent.evaluationCriteria && generatedContent.evaluationCriteria.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Evaluation Criteria</h4>
                <div className="space-y-2">
                  {generatedContent.evaluationCriteria.map((crit, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm">{crit.criterion}</span>
                      <div className="flex items-center">
                        <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                          <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${crit.weight}%` }}></div>
                        </div>
                        <span className="text-sm font-medium">{crit.weight}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {generatedContent.suggestions && generatedContent.suggestions.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">AI Suggestions</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {generatedContent.suggestions.map((s, i) => <li key={i}>💡 {s}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* RFP List */}
        <div className="flex gap-6">
          <div className={selectedRFP ? 'w-1/3' : 'w-full'}>
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 border-b">
                <h3 className="font-medium">RFPs ({rfps.length})</h3>
              </div>
              <ul className="divide-y max-h-[60vh] overflow-y-auto">
                {rfps.map(rfp => (
                  <li key={rfp.id} className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedRFP?.id === rfp.id ? 'bg-orange-50' : ''}`}
                    onClick={() => setSelectedRFP(rfp)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{rfp.title}</p>
                        <p className="text-sm text-gray-500">{rfp.rfpNumber}</p>
                        <p className="text-sm text-gray-500">{rfp.category} • ${rfp.budget?.toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(rfp.status)}`}>{rfp.status}</span>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(rfp.id); }}
                          className="text-red-500 text-xs hover:text-red-700">Delete</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {selectedRFP && (
            <div className="w-2/3">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 border-b flex justify-between">
                  <div>
                    <h3 className="font-medium text-lg">{selectedRFP.title}</h3>
                    <p className="text-gray-500">{selectedRFP.rfpNumber}</p>
                  </div>
                  <button onClick={() => setSelectedRFP(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-500">Category</p>
                      <p className="font-medium">{selectedRFP.category}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-500">Budget</p>
                      <p className="font-medium">${selectedRFP.budget?.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-xs text-gray-500">Deadline</p>
                      <p className="font-medium">{new Date(selectedRFP.submissionDeadline).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-500 mb-1">Description</p>
                    <p className="text-gray-700">{selectedRFP.description}</p>
                  </div>

                  {selectedRFP.aiGeneratedContent && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3 flex items-center">
                        <span className="mr-2">🤖</span> AI Generated Content
                      </h4>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <pre className="text-sm text-orange-800 whitespace-pre-wrap">
                          {JSON.stringify(selectedRFP.aiGeneratedContent, null, 2).substring(0, 500)}...
                        </pre>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-2 pt-4">
                    <button onClick={() => handleDelete(selectedRFP.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Delete</button>
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
