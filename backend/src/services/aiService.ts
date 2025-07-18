import { HfInference } from '@huggingface/inference';
import OpenAI from 'openai';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const openai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
});

export class AIService {
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await hf.featureExtraction({
        model: 'sentence-transformers/all-MiniLM-L6-v2',
        inputs: text,
      });
      
      return Array.isArray(response) ? response as number[] : [];
    } catch (error) {
      console.error('Error generating embedding:', error);
      throw new Error('Failed to generate embedding');
    }
  }

  static async analyzeDocument(
    text: string,
    analysisType: 'vendor-qualification' | 'bid-evaluation' | 'compliance-check'
  ): Promise<any> {
    try {
      let prompt = '';
      
      switch (analysisType) {
        case 'vendor-qualification':
          prompt = `Analyze this vendor document for qualification assessment. Focus on:
          1. Financial stability indicators
          2. Technical capabilities
          3. Compliance history
          4. Experience and references
          5. Risk factors
          
          Document: ${text}
          
          Provide a structured analysis with scores (1-10) for each category and overall recommendation.`;
          break;
          
        case 'bid-evaluation':
          prompt = `Evaluate this bid proposal for procurement decision. Analyze:
          1. Technical merit and feasibility
          2. Cost-effectiveness
          3. Timeline and delivery capabilities
          4. Risk assessment
          5. Compliance with requirements
          
          Proposal: ${text}
          
          Provide detailed scoring and recommendations.`;
          break;
          
        case 'compliance-check':
          prompt = `Check this document for regulatory compliance. Examine:
          1. FAR (Federal Acquisition Regulation) compliance
          2. DFARS compliance (if applicable)
          3. Industry-specific regulations
          4. Environmental and sustainability requirements
          5. Data protection and security standards
          
          Document: ${text}
          
          Identify compliance gaps and provide remediation recommendations.`;
          break;
      }

      const response = await openai.chat.completions.create({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: 'You are an expert procurement analyst with deep knowledge of government and commercial procurement processes, compliance requirements, and risk assessment.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3,
      });

      return {
        analysis: response.choices[0]?.message?.content,
        model: 'anthropic/claude-3.5-sonnet',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error analyzing document:', error);
      throw new Error('Failed to analyze document');
    }
  }

  static async generateVendorScore(vendorData: any): Promise<{
    overallScore: number;
    categoryScores: Record<string, number>;
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
  }> {
    try {
      const prompt = `Based on this vendor information, calculate a comprehensive vendor qualification score:
      
      Vendor Data: ${JSON.stringify(vendorData)}
      
      Please provide:
      1. Overall score (0-100)
      2. Category scores for: financial_stability, technical_capability, compliance_history, experience, references
      3. Risk level assessment
      4. Specific recommendations for improvement or concerns
      
      Return as JSON format.`;

      const response = await openai.chat.completions.create({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: 'You are a vendor qualification expert. Always respond with valid JSON containing the requested scoring structure.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      return {
        overallScore: result.overallScore || 0,
        categoryScores: result.categoryScores || {},
        riskLevel: result.riskLevel || 'medium',
        recommendations: result.recommendations || []
      };
    } catch (error) {
      console.error('Error generating vendor score:', error);
      throw new Error('Failed to generate vendor score');
    }
  }

  static async analyzeBidProposal(bidData: any): Promise<{
    technicalScore: number;
    costScore: number;
    timelineScore: number;
    riskScore: number;
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  }> {
    try {
      const prompt = `Analyze this bid proposal for comprehensive evaluation:
      
      Bid Data: ${JSON.stringify(bidData)}
      
      Provide detailed scoring (0-100) for:
      1. Technical merit and approach
      2. Cost effectiveness
      3. Timeline feasibility
      4. Risk assessment
      5. Overall recommendation
      
      Also identify key strengths, weaknesses, and recommendations.
      Return as JSON format.`;

      const response = await openai.chat.completions.create({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: 'You are a bid evaluation expert specializing in procurement analysis. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.2,
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      return {
        technicalScore: result.technicalScore || 0,
        costScore: result.costScore || 0,
        timelineScore: result.timelineScore || 0,
        riskScore: result.riskScore || 0,
        overallScore: result.overallScore || 0,
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        recommendations: result.recommendations || []
      };
    } catch (error) {
      console.error('Error analyzing bid proposal:', error);
      throw new Error('Failed to analyze bid proposal');
    }
  }

  static async checkCompliance(documentText: string, regulations: string[]): Promise<{
    overallCompliance: number;
    regulationChecks: Record<string, { compliant: boolean; score: number; issues: string[] }>;
    criticalIssues: string[];
    recommendations: string[];
  }> {
    try {
      const prompt = `Check this document against the following regulations: ${regulations.join(', ')}
      
      Document: ${documentText}
      
      For each regulation, assess:
      1. Compliance status (compliant/non-compliant)
      2. Compliance score (0-100)
      3. Specific issues found
      
      Also provide overall compliance score and critical issues that need immediate attention.
      Return as JSON format.`;

      const response = await openai.chat.completions.create({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: 'You are a compliance expert with expertise in government procurement regulations, FAR, DFARS, and industry standards. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.1,
      });

      const result = JSON.parse(response.choices[0]?.message?.content || '{}');
      
      return {
        overallCompliance: result.overallCompliance || 0,
        regulationChecks: result.regulationChecks || {},
        criticalIssues: result.criticalIssues || [],
        recommendations: result.recommendations || []
      };
    } catch (error) {
      console.error('Error checking compliance:', error);
      throw new Error('Failed to check compliance');
    }
  }
}