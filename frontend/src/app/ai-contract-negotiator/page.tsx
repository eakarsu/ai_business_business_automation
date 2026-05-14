'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { API_URL } from '@/lib/api';

interface Contract {
  id: string;
  title: string;
  contractNumber: string;
  vendorName: string;
  category: string;
  startDate: string;
  endDate: string;
  totalValue: number;
  status: string;
  riskLevel: string;
  paymentTerms: string;
  deliveryTerms: string;
}

interface NegotiationAnalysis {
  analysis?: { strengths?: string[]; weaknesses?: string[]; opportunities?: string[]; threats?: string[] };
  negotiationPoints?: { term: string; priority: string; currentValue: string; targetValue: string; rationale: string }[];
  counterProposals?: { term: string; proposedChange: string; justification: string }[];
  riskAssessment?: { overallRisk: string; riskFactors: string[]; mitigationStrategies: string[] };
  successProbability?: number;
  estimatedSavings?: { amount: number; percentage: number };
  nextSteps?: string[];
}

export default function AIContractNegotiatorPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [analysis, setAnalysis] = useState<NegotiationAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newContract, setNewContract] = useState({
    title: '', vendorName: '', category: '', totalValue: '', paymentTerms: 'Net 30'
  });
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { router.push('/login'); return; }
    fetchContracts(token);
  }, [router]);

  const fetchContracts = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/api/contracts`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setContracts(data.contracts || []);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeContract = async (contract: Contract) => {
    setSelectedContract(contract);
    setAnalyzing(true);
    setAnalysis(null);
    setError(null);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch(`${API_URL}/api/contracts/${contract.id}/negotiate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ negotiationGoals: ['Reduce costs', 'Improve terms', 'Minimize risk'] }),
      });
      if (response.ok) {
        const data = await response.json();
        const aiData = data.data?.aiAnalysis;
        if (aiData && !aiData.parseError) {
          // Normalize: some AI responses use different field names
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
          setError('AI returned an invalid response. Please try again.');
        }
      } else {
        const errData = await response.json().catch(() => ({}));
        setError(errData.error || `Analysis failed (${response.status}). Please try again.`);
      }
    } catch (err) {
      console.error('Error analyzing contract:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/api/contracts`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newContract,
          contractNumber: `CON-${Date.now()}`,
          vendorId: 'manual-entry',
          totalValue: parseFloat(newContract.totalValue) || 0,
          startDate: new Date(),
          endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          status: 'DRAFT',
        }),
      });
      if (response.ok) {
        setShowForm(false);
        setNewContract({ title: '', vendorName: '', category: '', totalValue: '', paymentTerms: 'Net 30' });
        fetchContracts(token!);
      }
    } catch (error) {
      console.error('Error creating contract:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this contract?')) return;
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_URL}/api/contracts/${id}`, {
        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` },
      });
      setContracts(contracts.filter(c => c.id !== id));
      if (selectedContract?.id === id) setSelectedContract(null);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800',
      DRAFT: 'bg-gray-100 text-gray-800',
      NEGOTIATING: 'bg-yellow-100 text-yellow-800',
      EXPIRED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Contract Negotiator</h1>
            <p className="text-gray-600">Get AI-powered negotiation recommendations</p>
          </div>
          <div className="flex space-x-3">
            <button onClick={() => setShowForm(true)} className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700">
              New Contract
            </button>
            <Link href="/dashboard" className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {showForm && (
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium mb-4">New Contract</h3>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
              <input placeholder="Title" value={newContract.title} onChange={e => setNewContract({...newContract, title: e.target.value})}
                className="border rounded px-3 py-2" required />
              <input placeholder="Vendor Name" value={newContract.vendorName} onChange={e => setNewContract({...newContract, vendorName: e.target.value})}
                className="border rounded px-3 py-2" required />
              <input placeholder="Category" value={newContract.category} onChange={e => setNewContract({...newContract, category: e.target.value})}
                className="border rounded px-3 py-2" />
              <input placeholder="Total Value" type="number" value={newContract.totalValue} onChange={e => setNewContract({...newContract, totalValue: e.target.value})}
                className="border rounded px-3 py-2" />
              <div className="col-span-2 flex justify-end space-x-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded">Create</button>
              </div>
            </form>
          </div>
        )}

        <div className="flex gap-6">
          <div className={selectedContract ? 'w-1/3' : 'w-full'}>
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 border-b">
                <h3 className="font-medium">Contracts ({contracts.length})</h3>
              </div>
              <ul className="divide-y max-h-[70vh] overflow-y-auto">
                {contracts.map(contract => (
                  <li key={contract.id} className={`p-4 hover:bg-gray-50 cursor-pointer ${selectedContract?.id === contract.id ? 'bg-purple-50' : ''}`}
                    onClick={() => analyzeContract(contract)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{contract.title}</p>
                        <p className="text-sm text-gray-500">{contract.vendorName}</p>
                        <p className="text-sm text-gray-500">${contract.totalValue?.toLocaleString()}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(contract.status)}`}>{contract.status}</span>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(contract.id); }}
                          className="text-red-500 text-xs hover:text-red-700">Delete</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {selectedContract && (
            <div className="w-2/3">
              <div className="bg-white shadow rounded-lg">
                <div className="px-4 py-5 border-b flex justify-between">
                  <div>
                    <h3 className="font-medium text-lg">{selectedContract.title}</h3>
                    <p className="text-gray-500">{selectedContract.vendorName} • ${selectedContract.totalValue?.toLocaleString()}</p>
                  </div>
                  <button onClick={() => setSelectedContract(null)} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>

                <div className="p-6">
                  {analyzing ? (
                    <div className="text-center py-12">
                      <div className="relative mx-auto w-16 h-16 mb-4">
                        <div className="absolute inset-0 rounded-full border-4 border-purple-100"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-purple-600 border-t-transparent animate-spin"></div>
                        <div className="absolute inset-3 rounded-full bg-purple-50 flex items-center justify-center">
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                      </div>
                      <p className="font-medium text-gray-900">AI is analyzing the contract...</p>
                      <p className="text-sm text-gray-500 mt-1">Evaluating terms, risks, and negotiation strategies</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-12">
                      <div className="inline-flex p-4 bg-red-50 rounded-full mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                      <p className="text-red-700 font-medium mb-2">Analysis Failed</p>
                      <p className="text-sm text-gray-500 mb-4">{error}</p>
                      <button onClick={() => selectedContract && analyzeContract(selectedContract)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                        Try Again
                      </button>
                    </div>
                  ) : analysis ? (
                    <div className="space-y-6">
                      {/* Success Probability & Savings Header */}
                      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-5 text-white">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-purple-200 text-sm font-medium">Negotiation Success Probability</p>
                            <div className="flex items-end gap-2 mt-1">
                              <span className="text-4xl font-bold">{analysis.successProbability || 0}%</span>
                              {analysis.riskAssessment?.overallRisk && (
                                <span className={`text-xs px-2 py-1 rounded-full mb-1 ${
                                  analysis.riskAssessment.overallRisk === 'low' ? 'bg-green-400/20 text-green-100' :
                                  analysis.riskAssessment.overallRisk === 'high' ? 'bg-red-400/20 text-red-100' :
                                  'bg-yellow-400/20 text-yellow-100'
                                }`}>
                                  {analysis.riskAssessment.overallRisk.toUpperCase()} RISK
                                </span>
                              )}
                            </div>
                          </div>
                          {analysis.estimatedSavings !== undefined && (
                            <div className="text-right">
                              <p className="text-purple-200 text-sm font-medium">Estimated Savings</p>
                              <p className="text-3xl font-bold mt-1">${(analysis.estimatedSavings?.amount || 0).toLocaleString()}</p>
                              <p className="text-purple-200 text-sm">{analysis.estimatedSavings?.percentage || 0}% reduction</p>
                            </div>
                          )}
                        </div>
                        {/* Progress bar */}
                        <div className="mt-4">
                          <div className="w-full bg-white/20 rounded-full h-2">
                            <div className="bg-white rounded-full h-2 transition-all duration-500" style={{ width: `${analysis.successProbability || 0}%` }}></div>
                          </div>
                        </div>
                      </div>

                      {/* SWOT Analysis */}
                      {analysis.analysis && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            SWOT Analysis
                          </h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                </div>
                                <p className="text-sm font-semibold text-green-800">Strengths</p>
                              </div>
                              <ul className="text-sm text-green-700 space-y-1.5">
                                {analysis.analysis.strengths?.map((s, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-green-400 mt-0.5">&#8226;</span>{s}</li>)}
                              </ul>
                            </div>
                            <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                                </div>
                                <p className="text-sm font-semibold text-red-800">Weaknesses</p>
                              </div>
                              <ul className="text-sm text-red-700 space-y-1.5">
                                {analysis.analysis.weaknesses?.map((w, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-red-400 mt-0.5">&#8226;</span>{w}</li>)}
                              </ul>
                            </div>
                            <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                                </div>
                                <p className="text-sm font-semibold text-blue-800">Opportunities</p>
                              </div>
                              <ul className="text-sm text-blue-700 space-y-1.5">
                                {analysis.analysis.opportunities?.map((o, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-blue-400 mt-0.5">&#8226;</span>{o}</li>)}
                              </ul>
                            </div>
                            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl">
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
                                </div>
                                <p className="text-sm font-semibold text-amber-800">Threats</p>
                              </div>
                              <ul className="text-sm text-amber-700 space-y-1.5">
                                {analysis.analysis.threats?.map((t, i) => <li key={i} className="flex items-start gap-1.5"><span className="text-amber-400 mt-0.5">&#8226;</span>{t}</li>)}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Risk Assessment */}
                      {analysis.riskAssessment && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                            Risk Assessment
                          </h4>
                          {analysis.riskAssessment.riskFactors && analysis.riskAssessment.riskFactors.length > 0 && (
                            <div className="mb-3">
                              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Risk Factors</p>
                              <div className="space-y-1.5">
                                {analysis.riskAssessment.riskFactors.map((factor, i) => (
                                  <div key={i} className="flex items-start gap-2 text-sm">
                                    <span className="text-red-400 mt-0.5">&#9888;</span>
                                    <span className="text-gray-700">{factor}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {analysis.riskAssessment.mitigationStrategies && analysis.riskAssessment.mitigationStrategies.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Mitigation Strategies</p>
                              <div className="space-y-1.5">
                                {analysis.riskAssessment.mitigationStrategies.map((strategy, i) => (
                                  <div key={i} className="flex items-start gap-2 text-sm">
                                    <span className="text-green-500 mt-0.5">&#10003;</span>
                                    <span className="text-gray-700">{strategy}</span>
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
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                            Negotiation Points
                          </h4>
                          <div className="space-y-3">
                            {analysis.negotiationPoints.map((point, i) => (
                              <div key={i} className={`p-4 rounded-xl border-l-4 ${
                                point.priority === 'high' ? 'border-red-500 bg-red-50/50' :
                                point.priority === 'medium' ? 'border-amber-500 bg-amber-50/50' :
                                'border-blue-500 bg-blue-50/50'
                              }`}>
                                <div className="flex justify-between items-center">
                                  <span className="font-medium text-gray-900">{point.term}</span>
                                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                    point.priority === 'high' ? 'bg-red-100 text-red-700' :
                                    point.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                                    'bg-blue-100 text-blue-700'
                                  }`}>
                                    {point.priority}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 mt-2 text-sm">
                                  <span className="text-gray-500 bg-white px-2 py-0.5 rounded">{point.currentValue}</span>
                                  <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                  <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-medium">{point.targetValue}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">{point.rationale}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Counter Proposals */}
                      {analysis.counterProposals && analysis.counterProposals.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            Counter Proposals
                          </h4>
                          <div className="space-y-3">
                            {analysis.counterProposals.map((proposal, i) => (
                              <div key={i} className="bg-purple-50 border border-purple-100 p-4 rounded-xl">
                                <p className="font-medium text-purple-900">{proposal.term}</p>
                                <p className="text-sm text-purple-800 mt-1">{proposal.proposedChange}</p>
                                <p className="text-xs text-purple-600 mt-2 italic">{proposal.justification}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Next Steps */}
                      {analysis.nextSteps && analysis.nextSteps.length > 0 && (
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 p-5 rounded-xl">
                          <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                            Recommended Next Steps
                          </h4>
                          <ol className="space-y-2">
                            {analysis.nextSteps.map((step, i) => (
                              <li key={i} className="flex items-start gap-3 text-sm text-indigo-800">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-medium">{i + 1}</span>
                                <span className="mt-0.5">{step}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* Re-analyze Button */}
                      <div className="pt-2 border-t">
                        <button onClick={() => selectedContract && analyzeContract(selectedContract)}
                          className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                          Re-analyze Contract
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="inline-flex p-4 bg-purple-50 rounded-full mb-4">
                        <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-500">Select a contract to analyze</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
