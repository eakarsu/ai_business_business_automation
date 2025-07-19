'use client';

import { useState } from 'react';

interface AIAnalysisResultsProps {
  results: any;
  analysisType: string;
  onRunAnother: () => void;
}

export default function AIAnalysisResults({ results, analysisType, onRunAnother }: AIAnalysisResultsProps) {
  const [activeTab, setActiveTab] = useState('summary');

  const getAnalysisTitle = (type: string) => {
    switch (type) {
      case 'vendor-optimization': return 'Vendor Optimization Analysis';
      case 'cost-reduction': return 'Cost Reduction Analysis';
      case 'risk-assessment': return 'Risk Assessment Analysis';
      case 'compliance-review': return 'Compliance Review Analysis';
      default: return 'AI Analysis Results';
    }
  };

  const getAnalysisIcon = (type: string) => {
    switch (type) {
      case 'vendor-optimization': return '🏢';
      case 'cost-reduction': return '💰';
      case 'risk-assessment': return '⚠️';
      case 'compliance-review': return '✅';
      default: return '🤖';
    }
  };

  const renderRecommendations = (recommendations: any) => {
    if (!recommendations) return null;

    const recList = Array.isArray(recommendations) ? recommendations : 
                    recommendations.strategicRecommendations ? 
                    Object.entries(recommendations.strategicRecommendations).map(([key, value]: [string, any]) => ({
                      category: key,
                      ...value
                    })) : [];

    return (
      <div className="space-y-4">
        {recList.map((rec: any, index: number) => (
          <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">{index + 1}</span>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-blue-900 mb-2">
                  {rec.category ? rec.category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()) : `Recommendation ${index + 1}`}
                </h4>
                {rec.priority && (
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mb-2 ${
                    rec.priority === 'High' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {rec.priority} Priority
                  </span>
                )}
                {rec.findings && (
                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700 mb-1">Key Findings:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {Array.isArray(rec.findings) ? rec.findings.map((finding: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {finding}
                        </li>
                      )) : (
                        <li className="flex items-start">
                          <span className="text-blue-500 mr-2">•</span>
                          {rec.findings}
                        </li>
                      )}
                    </ul>
                  </div>
                )}
                {rec.actions && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Recommended Actions:</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {Array.isArray(rec.actions) ? rec.actions.map((action: any, i: number) => (
                        <li key={i} className="flex items-start">
                          <span className="text-green-500 mr-2">→</span>
                          <div>
                            <span className="font-medium">{action.action || action}</span>
                            {action.target && <span className="text-gray-500"> - {action.target}</span>}
                            {action.method && <span className="text-gray-500"> ({action.method})</span>}
                          </div>
                        </li>
                      )) : (
                        <li className="flex items-start">
                          <span className="text-green-500 mr-2">→</span>
                          {rec.actions}
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderMetrics = (data: any) => {
    const metrics = [];
    
    if (data.recommendations?.strategicRecommendations) {
      Object.entries(data.recommendations.strategicRecommendations).forEach(([key, value]: [string, any]) => {
        if (value.priority) {
          metrics.push({
            label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
            value: value.priority,
            type: 'priority'
          });
        }
      });
    }

    if (data.analysis) {
      if (typeof data.analysis === 'string') {
        try {
          const parsed = JSON.parse(data.analysis);
          if (parsed.overallScore) {
            metrics.push({ label: 'Overall Score', value: `${parsed.overallScore}/100`, type: 'score' });
          }
        } catch (e) {
          // Handle string analysis
        }
      }
    }

    if (metrics.length === 0) {
      metrics.push(
        { label: 'Analysis Type', value: getAnalysisTitle(analysisType), type: 'info' },
        { label: 'Generated', value: new Date().toLocaleDateString(), type: 'info' }
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-sm text-gray-600">{metric.label}</div>
            <div className={`text-lg font-semibold ${
              metric.type === 'priority' ? 
                (metric.value === 'High' ? 'text-red-600' : 
                 metric.value === 'Medium' ? 'text-yellow-600' : 'text-green-600') :
              metric.type === 'score' ? 'text-blue-600' : 'text-gray-900'
            }`}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderSummary = () => {
    if (results.analysis && typeof results.analysis === 'string') {
      return (
        <div className="prose max-w-none">
          <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap">
            {results.analysis}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-3xl">{getAnalysisIcon(analysisType)}</span>
            <h3 className="text-lg font-semibold text-gray-900">{getAnalysisTitle(analysisType)}</h3>
          </div>
          <p className="text-gray-700">
            Analysis completed successfully. Review the recommendations and metrics below to optimize your procurement process.
          </p>
        </div>
        
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-3">Key Metrics</h4>
          {renderMetrics(results)}
        </div>
      </div>
    );
  };

  const renderRawData = () => (
    <div className="bg-gray-50 rounded-lg p-4">
      <pre className="text-sm text-gray-700 whitespace-pre-wrap overflow-x-auto">
        {JSON.stringify(results, null, 2)}
      </pre>
    </div>
  );

  return (
    <div className="max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Analysis Results</h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              activeTab === 'summary' 
                ? 'bg-purple-100 text-purple-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Summary
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              activeTab === 'recommendations' 
                ? 'bg-purple-100 text-purple-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Recommendations
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`px-3 py-1 text-sm font-medium rounded-md ${
              activeTab === 'raw' 
                ? 'bg-purple-100 text-purple-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Raw Data
          </button>
        </div>
      </div>

      <div className="mb-6">
        {activeTab === 'summary' && renderSummary()}
        {activeTab === 'recommendations' && renderRecommendations(results.recommendations)}
        {activeTab === 'raw' && renderRawData()}
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={onRunAnother}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          Run Another Analysis
        </button>
      </div>
    </div>
  );
}