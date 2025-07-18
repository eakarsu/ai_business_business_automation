import { HfInference } from '@huggingface/inference';
import OpenAI from 'openai';

const hf = process.env.HUGGINGFACE_API_KEY ? new HfInference(process.env.HUGGINGFACE_API_KEY) : null;

export class AIService {
  private static openai: OpenAI | null = null;

  private static getOpenAIClient(): OpenAI {
    if (!this.openai) {
      this.openai = process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'dummy-key' ? new OpenAI({
        apiKey: process.env.OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
      }) : new OpenAI({
        apiKey: 'sk-dummy-key-for-openrouter',
        baseURL: 'https://openrouter.ai/api/v1',
      });
    }
    return this.openai;
  }

  private static async makeOpenRouterRequest(prompt: string, systemMessage: string, maxTokens: number = 2000, temperature: number = 0.3): Promise<any> {
    try {
      const openai = this.getOpenAIClient();
      
      const response = await openai.chat.completions.create({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          {
            role: 'system',
            content: systemMessage
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: temperature,
      });

      return response.choices[0]?.message?.content;
    } catch (error) {
      console.error('Error making OpenRouter request:', error);
      throw new Error('Failed to process AI request');
    }
  }
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      if (!hf) {
        console.warn('HuggingFace API key not configured, returning empty embedding');
        return [];
      }

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

      const systemMessage = 'You are an expert procurement analyst with deep knowledge of government and commercial procurement processes, compliance requirements, and risk assessment.';
      
      const response = await this.makeOpenRouterRequest(prompt, systemMessage, 2000, 0.3);

      return {
        analysis: response,
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

      const systemMessage = 'You are a vendor qualification expert. Always respond with valid JSON containing the requested scoring structure.';
      
      const response = await this.makeOpenRouterRequest(prompt, systemMessage, 1000, 0.1);
      const result = JSON.parse(response || '{}');
      
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

      const systemMessage = 'You are a bid evaluation expert specializing in procurement analysis. Always respond with valid JSON.';
      
      const response = await this.makeOpenRouterRequest(prompt, systemMessage, 1500, 0.2);
      const result = JSON.parse(response || '{}');
      
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

      const systemMessage = 'You are a compliance expert with expertise in government procurement regulations, FAR, DFARS, and industry standards. Always respond with valid JSON.';
      
      const response = await this.makeOpenRouterRequest(prompt, systemMessage, 2000, 0.1);
      const result = JSON.parse(response || '{}');
      
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

  // Opportunity discovery for vendors
  static async discoverOpportunities(vendorProfile: any, filters?: any): Promise<{
    opportunities: any[];
    matchScores: Record<string, number>;
    recommendations: string[];
  }> {
    try {
      const prompt = `Based on this vendor profile, identify relevant procurement opportunities:
      
      Vendor Profile: ${JSON.stringify(vendorProfile)}
      Filters: ${JSON.stringify(filters || {})}
      
      Analyze vendor capabilities and match with potential opportunities.
      Consider:
      1. Technical capabilities alignment
      2. Industry experience
      3. Geographic coverage
      4. Capacity and scalability
      5. Past performance in similar projects
      
      Return JSON with opportunities, match scores (0-100), and recommendations.`;

      const systemMessage = 'You are an opportunity matching expert specializing in vendor-procurement alignment. Always respond with valid JSON.';
      
      const response = await this.makeOpenRouterRequest(prompt, systemMessage, 2000, 0.3);
      const result = JSON.parse(response || '{}');
      
      return {
        opportunities: result.opportunities || [],
        matchScores: result.matchScores || {},
        recommendations: result.recommendations || []
      };
    } catch (error) {
      console.error('Error discovering opportunities:', error);
      throw new Error('Failed to discover opportunities');
    }
  }

  // Bid optimization for vendors
  static async optimizeBid(bidData: any, marketData?: any): Promise<{
    optimizedPricing: any;
    winProbability: number;
    competitiveAnalysis: any;
    recommendations: string[];
  }> {
    try {
      const prompt = `Optimize this bid for maximum win probability:
      
      Bid Data: ${JSON.stringify(bidData)}
      Market Data: ${JSON.stringify(marketData || {})}
      
      Analyze and provide:
      1. Optimized pricing strategy
      2. Win probability assessment
      3. Competitive positioning
      4. Tactical recommendations
      5. Risk mitigation strategies
      
      Return JSON with optimization recommendations.`;

      const systemMessage = 'You are a bid optimization expert with deep knowledge of procurement dynamics and competitive strategy. Always respond with valid JSON.';
      
      const response = await this.makeOpenRouterRequest(prompt, systemMessage, 2000, 0.2);
      const result = JSON.parse(response || '{}');
      
      return {
        optimizedPricing: result.optimizedPricing || {},
        winProbability: result.winProbability || 0,
        competitiveAnalysis: result.competitiveAnalysis || {},
        recommendations: result.recommendations || []
      };
    } catch (error) {
      console.error('Error optimizing bid:', error);
      throw new Error('Failed to optimize bid');
    }
  }

  // Automated proposal writing assistance
  static async generateProposal(requirements: any, vendorInfo: any, template?: string): Promise<{
    proposal: string;
    sections: Record<string, string>;
    complianceChecklist: any[];
    suggestions: string[];
  }> {
    try {
      const prompt = `Generate a compliant proposal based on these requirements:
      
      Requirements: ${JSON.stringify(requirements)}
      Vendor Info: ${JSON.stringify(vendorInfo)}
      Template: ${template || 'Standard procurement proposal'}
      
      Generate:
      1. Complete proposal text
      2. Structured sections (executive summary, technical approach, etc.)
      3. Compliance checklist
      4. Improvement suggestions
      
      Ensure compliance with procurement standards and requirements.
      Return JSON with structured proposal content.`;

      const systemMessage = 'You are a proposal writing expert specializing in government and commercial procurement. Always respond with valid JSON.';
      
      const response = await this.makeOpenRouterRequest(prompt, systemMessage, 3000, 0.4);
      const result = JSON.parse(response || '{}');
      
      return {
        proposal: result.proposal || '',
        sections: result.sections || {},
        complianceChecklist: result.complianceChecklist || [],
        suggestions: result.suggestions || []
      };
    } catch (error) {
      console.error('Error generating proposal:', error);
      throw new Error('Failed to generate proposal');
    }
  }

  // Contract management monitoring
  static async monitorContract(contractData: any, performanceMetrics: any): Promise<{
    complianceStatus: string;
    performanceScore: number;
    riskAlerts: any[];
    recommendations: string[];
    nextReviewDate: string;
  }> {
    try {
      const prompt = `Monitor this contract for compliance and performance:
      
      Contract Data: ${JSON.stringify(contractData)}
      Performance Metrics: ${JSON.stringify(performanceMetrics)}
      
      Assess:
      1. Compliance with contract terms
      2. Performance against KPIs
      3. Risk indicators and alerts
      4. Improvement recommendations
      5. Next review schedule
      
      Return JSON with monitoring results.`;

      const systemMessage = 'You are a contract management expert specializing in performance monitoring and compliance tracking. Always respond with valid JSON.';
      
      const response = await this.makeOpenRouterRequest(prompt, systemMessage, 2000, 0.2);
      const result = JSON.parse(response || '{}');
      
      return {
        complianceStatus: result.complianceStatus || 'unknown',
        performanceScore: result.performanceScore || 0,
        riskAlerts: result.riskAlerts || [],
        recommendations: result.recommendations || [],
        nextReviewDate: result.nextReviewDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      };
    } catch (error) {
      console.error('Error monitoring contract:', error);
      throw new Error('Failed to monitor contract');
    }
  }

  // Chatbot query processing
  static async processChatQuery(query: string, context?: any): Promise<{
    response: string;
    actions: any[];
    followUpQuestions: string[];
    confidence: number;
  }> {
    try {
      const prompt = `Process this procurement-related query:
      
      Query: ${query}
      Context: ${JSON.stringify(context || {})}
      
      Provide:
      1. Helpful response
      2. Suggested actions
      3. Follow-up questions
      4. Confidence score (0-100)
      
      Focus on procurement processes, vendor management, compliance, and bidding.
      Return JSON with structured response.`;

      const systemMessage = 'You are a procurement assistant chatbot with expertise in all aspects of procurement management. Always respond with valid JSON.';
      
      const response = await this.makeOpenRouterRequest(prompt, systemMessage, 1500, 0.3);
      const result = JSON.parse(response || '{}');
      
      return {
        response: result.response || 'I can help you with procurement-related questions.',
        actions: result.actions || [],
        followUpQuestions: result.followUpQuestions || [],
        confidence: result.confidence || 70
      };
    } catch (error) {
      console.error('Error processing chat query:', error);
      throw new Error('Failed to process chat query');
    }
  }

  // Automated negotiation support
  static async negotiateTerms(currentTerms: any, negotiationGoals: any, constraints: any): Promise<{
    proposedTerms: any;
    negotiationStrategy: string[];
    riskAssessment: any;
    alternativeOptions: any[];
    confidence: number;
  }> {
    try {
      const prompt = `Provide negotiation support for these contract terms:
      
      Current Terms: ${JSON.stringify(currentTerms)}
      Negotiation Goals: ${JSON.stringify(negotiationGoals)}
      Constraints: ${JSON.stringify(constraints)}
      
      Analyze and provide:
      1. Optimized term proposals
      2. Negotiation strategy
      3. Risk assessment
      4. Alternative options
      5. Success probability
      
      Return JSON with negotiation recommendations.`;

      const systemMessage = 'You are a contract negotiation expert specializing in procurement agreements. Always respond with valid JSON.';
      
      const response = await this.makeOpenRouterRequest(prompt, systemMessage, 2500, 0.2);
      const result = JSON.parse(response || '{}');
      
      return {
        proposedTerms: result.proposedTerms || {},
        negotiationStrategy: result.negotiationStrategy || [],
        riskAssessment: result.riskAssessment || {},
        alternativeOptions: result.alternativeOptions || [],
        confidence: result.confidence || 0
      };
    } catch (error) {
      console.error('Error in negotiation support:', error);
      throw new Error('Failed to provide negotiation support');
    }
  }
}