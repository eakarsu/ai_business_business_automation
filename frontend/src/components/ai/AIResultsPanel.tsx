'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardBody } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ProgressBar, ScoreDisplay } from '../ui/ProgressBar';
import { Tabs, TabContent } from '../ui/Tabs';
import { Button } from '../ui/Button';

interface Recommendation {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category?: string;
}

interface CategoryScore {
  name: string;
  score: number;
  maxScore?: number;
}

export interface AIAnalysisResult {
  overallScore?: number;
  riskLevel?: string;
  summary?: string;
  categories?: CategoryScore[];
  recommendations?: Recommendation[];
  strengths?: string[];
  weaknesses?: string[];
  keyFindings?: string[];
  rawData?: Record<string, unknown>;
}

interface AIResultsPanelProps {
  results: AIAnalysisResult;
  title?: string;
  onRunAgain?: () => void;
  isLoading?: boolean;
}

export function AIResultsPanel({
  results,
  title = 'AI Analysis Results',
  onRunAgain,
  isLoading = false,
}: AIResultsPanelProps) {
  const [activeTab, setActiveTab] = useState('summary');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'neutral';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW':
        return 'success';
      case 'MEDIUM':
        return 'warning';
      case 'HIGH':
        return 'danger';
      case 'CRITICAL':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  const tabs = [
    { id: 'summary', label: 'Summary' },
    ...(results.recommendations?.length ? [{ id: 'recommendations', label: 'Recommendations', badge: results.recommendations.length }] : []),
    ...(results.rawData ? [{ id: 'raw', label: 'Raw Data' }] : []),
  ];

  return (
    <Card>
      <CardHeader
        actions={
          onRunAgain && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRunAgain}
              isLoading={isLoading}
            >
              Run Again
            </Button>
          )
        }
      >
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {title}
        </div>
      </CardHeader>
      <CardBody className="p-0">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

        <TabContent className="px-6 pb-6">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Score and Risk */}
              {(results.overallScore !== undefined || results.riskLevel) && (
                <div className="flex items-center gap-8 p-4 bg-gray-50 rounded-lg">
                  {results.overallScore !== undefined && (
                    <ScoreDisplay
                      score={results.overallScore}
                      label="Overall Score"
                      size="lg"
                    />
                  )}
                  {results.riskLevel && (
                    <div className="text-center">
                      <Badge variant={getRiskColor(results.riskLevel)} size="md">
                        {results.riskLevel} RISK
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">Risk Level</p>
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              {results.summary && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Summary</h4>
                  <p className="text-sm text-gray-600">{results.summary}</p>
                </div>
              )}

              {/* Category Scores */}
              {results.categories && results.categories.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Category Breakdown</h4>
                  <div className="space-y-3">
                    {results.categories.map((category, index) => (
                      <ProgressBar
                        key={index}
                        value={category.score}
                        max={category.maxScore || 100}
                        label={category.name}
                        size="md"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Key Findings */}
              {results.keyFindings && results.keyFindings.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Findings</h4>
                  <ul className="space-y-2">
                    {results.keyFindings.map((finding, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        {finding}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Strengths and Weaknesses */}
              <div className="grid grid-cols-2 gap-4">
                {results.strengths && results.strengths.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-success-dark mb-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Strengths
                    </h4>
                    <ul className="space-y-1">
                      {results.strengths.map((strength, index) => (
                        <li key={index} className="text-sm text-gray-600 pl-5">
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {results.weaknesses && results.weaknesses.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-danger-dark mb-2 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Weaknesses
                    </h4>
                    <ul className="space-y-1">
                      {results.weaknesses.map((weakness, index) => (
                        <li key={index} className="text-sm text-gray-600 pl-5">
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'recommendations' && results.recommendations && (
            <div className="space-y-4">
              {results.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg border-l-4"
                  style={{
                    borderLeftColor: rec.priority === 'high' ? '#EF4444' : rec.priority === 'medium' ? '#F59E0B' : '#3B82F6'
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h5 className="font-medium text-gray-900">{rec.title}</h5>
                      <p className="mt-1 text-sm text-gray-600">{rec.description}</p>
                      {rec.category && (
                        <Badge variant="neutral" size="sm" className="mt-2">
                          {rec.category}
                        </Badge>
                      )}
                    </div>
                    <Badge variant={getPriorityColor(rec.priority)} size="sm">
                      {rec.priority.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'raw' && results.rawData && (
            <pre className="p-4 bg-gray-900 text-gray-100 rounded-lg overflow-auto text-xs">
              {JSON.stringify(results.rawData, null, 2)}
            </pre>
          )}
        </TabContent>
      </CardBody>
    </Card>
  );
}

// Compact inline version
interface AIResultsInlineProps {
  score?: number;
  riskLevel?: string;
  summary?: string;
}

export function AIResultsInline({ score, riskLevel, summary }: AIResultsInlineProps) {
  return (
    <div className="flex items-center gap-4 p-3 bg-primary-50 rounded-lg">
      <div className="flex items-center gap-2">
        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-sm font-medium text-primary-700">AI Score:</span>
        <span className="text-sm font-bold text-primary-900">{score}</span>
      </div>
      {riskLevel && (
        <Badge variant={riskLevel === 'LOW' ? 'success' : riskLevel === 'MEDIUM' ? 'warning' : 'danger'} size="sm">
          {riskLevel}
        </Badge>
      )}
      {summary && (
        <span className="text-sm text-gray-600 truncate">{summary}</span>
      )}
    </div>
  );
}
