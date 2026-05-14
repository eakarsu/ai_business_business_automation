import { HfInference } from '@huggingface/inference';
import OpenAI from 'openai';
import { prisma } from '../lib/prisma';

const hf = process.env.HUGGINGFACE_API_KEY ? new HfInference(process.env.HUGGINGFACE_API_KEY) : null;

// Canonical parseAIJson helper used everywhere
export function parseAIJson(text: string | null | undefined): any {
  if (!text) return null;
  try { return JSON.parse(text); } catch(e) {}
  const stripped = text.replace(/```(?:json)?\n?/g, '').replace(/```/g, '').trim();
  try { return JSON.parse(stripped); } catch(e) {}
  const start = text.indexOf('{'); const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1) { try { return JSON.parse(text.slice(start, end + 1)); } catch(e) {} }
  return null;
}

// Persist an AI result to the ai_results table
export async function persistAIResult(params: {
  analysisType: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  inputData: any;
  result: any;
  model: string;
}): Promise<void> {
  try {
    await (prisma as any).aIResult.create({
      data: {
        analysisType: params.analysisType,
        entityType: params.entityType || null,
        entityId: params.entityId || null,
        userId: params.userId || null,
        inputData: params.inputData,
        result: params.result,
        model: params.model,
      },
    });
  } catch (err) {
    // Non-critical: log but don't throw
    console.error('Failed to persist AI result:', err);
  }
}

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
      // Default to claude-3-5-sonnet for richer analysis; allow env override
      const model = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

      const response = await openai.chat.completions.create({
        model: model,
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

  private static parseJSON(text: string | null | undefined): any {
    return parseAIJson(text) || { raw: text, parseError: true };
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
          prompt = `Analyze this document for qualification assessment:

Document: ${text}

Provide your analysis as ONLY valid JSON (no markdown) with this structure:
{
  "overallScore": <number 0-100>,
  "summary": "<2-3 sentence executive summary>",
  "categories": [
    { "name": "Financial Stability", "score": <0-100> },
    { "name": "Technical Capability", "score": <0-100> },
    { "name": "Compliance History", "score": <0-100> },
    { "name": "Experience", "score": <0-100> }
  ],
  "keyFindings": ["<finding 1>", "<finding 2>", "<finding 3>"],
  "recommendations": [
    { "title": "<short title>", "description": "<detail>", "priority": "<high|medium|low>" }
  ],
  "savingsOpportunities": [
    { "area": "<area>", "potentialSavings": <number> }
  ]
}`;
          break;

        case 'bid-evaluation':
          prompt = `Evaluate this for procurement decision:

Document: ${text}

Provide your analysis as ONLY valid JSON (no markdown) with this structure:
{
  "overallScore": <number 0-100>,
  "summary": "<2-3 sentence executive summary>",
  "categories": [
    { "name": "Technical Merit", "score": <0-100> },
    { "name": "Cost Effectiveness", "score": <0-100> },
    { "name": "Delivery Capability", "score": <0-100> },
    { "name": "Risk Level", "score": <0-100> }
  ],
  "keyFindings": ["<finding 1>", "<finding 2>", "<finding 3>"],
  "recommendations": [
    { "title": "<short title>", "description": "<detail>", "priority": "<high|medium|low>" }
  ],
  "savingsOpportunities": [
    { "area": "<area>", "potentialSavings": <number> }
  ]
}`;
          break;

        case 'compliance-check':
          prompt = `Check this document for regulatory compliance:

Document: ${text}

Provide your analysis as ONLY valid JSON (no markdown) with this structure:
{
  "overallScore": <number 0-100>,
  "summary": "<2-3 sentence compliance summary>",
  "categories": [
    { "name": "Regulatory Compliance", "score": <0-100> },
    { "name": "Documentation Standards", "score": <0-100> },
    { "name": "Data Protection", "score": <0-100> },
    { "name": "Environmental Standards", "score": <0-100> }
  ],
  "keyFindings": ["<finding 1>", "<finding 2>", "<finding 3>"],
  "recommendations": [
    { "title": "<short title>", "description": "<detail>", "priority": "<high|medium|low>" }
  ],
  "savingsOpportunities": []
}`;
          break;
      }

      const systemMessage = 'You are an expert procurement analyst. Always respond with valid JSON only, no markdown formatting, no explanatory text.';

      const response = await this.makeOpenRouterRequest(prompt, systemMessage, 2000, 0.3);
      const parsed = this.parseJSON(response);

      return parsed;
    } catch (error) {
      console.error('Error analyzing document:', error);
      throw new Error('Failed to analyze document');
    }
  }

  static async generateVendorScore(vendorData: any): Promise<{
    overallScore: number;
    categoryScores: Record<string, number>;
    riskLevel: string;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    keyFindings: string[];
    recommendations: { title: string; description: string; priority: string; category: string }[];
  }> {
    try {
      const prompt = `Perform a comprehensive vendor qualification analysis based on this vendor data:

Vendor Data: ${JSON.stringify(vendorData)}

Provide a thorough analysis with the following structure (return ONLY valid JSON, no markdown):
{
  "overallScore": <number 0-100>,
  "categoryScores": {
    "financial_stability": <number 0-100>,
    "technical_capability": <number 0-100>,
    "compliance_history": <number 0-100>,
    "experience": <number 0-100>,
    "references": <number 0-100>
  },
  "riskLevel": "<LOW|MEDIUM|HIGH>",
  "summary": "<2-3 sentence executive summary of the vendor assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "keyFindings": ["<finding 1>", "<finding 2>", "<finding 3>", "<finding 4>"],
  "recommendations": [
    {
      "title": "<short action title>",
      "description": "<detailed explanation of what to do and why>",
      "priority": "<high|medium|low>",
      "category": "<Financial|Technical|Compliance|Risk|Strategic>"
    }
  ]
}

Be specific and data-driven. Reference the actual vendor metrics in your analysis. Provide at least 3 strengths, 3 weaknesses, 4 key findings, and 4 recommendations.`;

      const systemMessage = 'You are a senior procurement analyst and vendor qualification expert. Provide detailed, actionable vendor assessments. Always respond with valid JSON only, no markdown formatting.';

      const response = await this.makeOpenRouterRequest(prompt, systemMessage, 2000, 0.2);
      const result = this.parseJSON(response);

      if (result.parseError) return result;

      return {
        overallScore: result.overallScore || 0,
        categoryScores: result.categoryScores || {},
        riskLevel: result.riskLevel || 'MEDIUM',
        summary: result.summary || '',
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        keyFindings: result.keyFindings || [],
        recommendations: Array.isArray(result.recommendations)
          ? result.recommendations.map((r: any) =>
              typeof r === 'string'
                ? { title: r, description: r, priority: 'medium', category: 'General' }
                : { title: r.title || '', description: r.description || '', priority: r.priority || 'medium', category: r.category || 'General' }
            )
          : [],
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
    summary: string;
    strengths: string[];
    weaknesses: string[];
    keyFindings: string[];
    riskLevel: string;
    competitivePosition: string;
    recommendations: { title: string; description: string; priority: string; category: string }[];
  }> {
    try {
      const prompt = `Perform a comprehensive bid proposal evaluation based on this data:

Bid Data: ${JSON.stringify(bidData)}

Provide a thorough analysis with the following structure (return ONLY valid JSON, no markdown):
{
  "overallScore": <number 0-100>,
  "technicalScore": <number 0-100>,
  "costScore": <number 0-100>,
  "timelineScore": <number 0-100>,
  "riskScore": <number 0-100>,
  "riskLevel": "<LOW|MEDIUM|HIGH>",
  "competitivePosition": "<1-2 sentence assessment of how competitive this bid is>",
  "summary": "<2-3 sentence executive summary of the bid evaluation>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<weakness 1>", "<weakness 2>", "<weakness 3>"],
  "keyFindings": [
    "<key finding about technical approach>",
    "<key finding about cost structure>",
    "<key finding about delivery timeline>",
    "<key finding about risk factors>"
  ],
  "recommendations": [
    {
      "title": "<short action title>",
      "description": "<detailed explanation>",
      "priority": "<high|medium|low>",
      "category": "<Technical|Cost|Timeline|Risk|Compliance>"
    }
  ]
}

Be specific and reference actual bid data in your analysis. Provide at least 3 strengths, 3 weaknesses, 4 key findings, and 4 recommendations with varied priorities.`;

      const systemMessage = 'You are a senior bid evaluation expert with deep expertise in procurement analysis, cost modeling, and technical assessment. Provide detailed, data-driven evaluations. Always respond with valid JSON only, no markdown.';

      const response = await this.makeOpenRouterRequest(prompt, systemMessage, 2000, 0.2);
      const result = this.parseJSON(response);

      if (result.parseError) return result;

      return {
        technicalScore: result.technicalScore || 0,
        costScore: result.costScore || 0,
        timelineScore: result.timelineScore || 0,
        riskScore: result.riskScore || 0,
        overallScore: result.overallScore || 0,
        summary: result.summary || '',
        riskLevel: result.riskLevel || 'MEDIUM',
        competitivePosition: result.competitivePosition || '',
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        keyFindings: result.keyFindings || [],
        recommendations: Array.isArray(result.recommendations)
          ? result.recommendations.map((r: any) =>
              typeof r === 'string'
                ? { title: r, description: r, priority: 'medium', category: 'General' }
                : { title: r.title || '', description: r.description || '', priority: r.priority || 'medium', category: r.category || 'General' }
            )
          : [],
      };
    } catch (error) {
      console.error('Error analyzing bid proposal:', error);
      throw new Error('Failed to analyze bid proposal');
    }
  }

  static async checkCompliance(documentText: string, regulations: string[]): Promise<{
    overallCompliance: number;
    riskLevel: string;
    summary: string;
    regulationChecks: Record<string, { compliant: boolean; score: number; issues: string[]; remediationSteps: string[] }>;
    criticalIssues: string[];
    keyFindings: string[];
    strengths: string[];
    weaknesses: string[];
    recommendations: { title: string; description: string; priority: string; category: string }[];
  }> {
    try {
      const regs = regulations.length > 0 ? regulations.join(', ') : 'FAR, DFARS, general procurement compliance';

      const prompt = `Perform a comprehensive compliance audit of this document against the following regulations: ${regs}

Document: ${documentText}

Provide a thorough compliance assessment (return ONLY valid JSON, no markdown):
{
  "overallCompliance": <number 0-100>,
  "riskLevel": "<LOW|MEDIUM|HIGH|CRITICAL>",
  "summary": "<2-3 sentence executive summary of compliance status>",
  "regulationChecks": {
    "<regulation_name>": {
      "compliant": <true|false>,
      "score": <number 0-100>,
      "issues": ["<specific issue 1>", "<specific issue 2>"],
      "remediationSteps": ["<step to fix issue 1>", "<step to fix issue 2>"]
    }
  },
  "criticalIssues": ["<critical issue requiring immediate action>"],
  "keyFindings": [
    "<key finding 1>",
    "<key finding 2>",
    "<key finding 3>",
    "<key finding 4>"
  ],
  "strengths": ["<compliance strength 1>", "<compliance strength 2>", "<compliance strength 3>"],
  "weaknesses": ["<compliance gap 1>", "<compliance gap 2>", "<compliance gap 3>"],
  "recommendations": [
    {
      "title": "<short action title>",
      "description": "<detailed remediation steps and rationale>",
      "priority": "<high|medium|low>",
      "category": "<Regulatory|Documentation|Process|Training|Risk>"
    }
  ]
}

Be thorough and specific. For each regulation, identify concrete issues and provide actionable remediation steps. Provide at least 3 strengths, 3 weaknesses, 4 key findings, and 4 recommendations.`;

      const systemMessage = 'You are a senior compliance officer with deep expertise in government procurement regulations (FAR, DFARS), industry standards, data protection, and environmental compliance. Provide rigorous, specific assessments. Always respond with valid JSON only, no markdown.';

      const response = await this.makeOpenRouterRequest(prompt, systemMessage, 4000, 0.1);
      const result = this.parseJSON(response);

      if (result.parseError) return result;

      return {
        overallCompliance: result.overallCompliance || 0,
        riskLevel: result.riskLevel || 'MEDIUM',
        summary: result.summary || '',
        regulationChecks: result.regulationChecks || {},
        criticalIssues: result.criticalIssues || [],
        keyFindings: result.keyFindings || [],
        strengths: result.strengths || [],
        weaknesses: result.weaknesses || [],
        recommendations: Array.isArray(result.recommendations)
          ? result.recommendations.map((r: any) =>
              typeof r === 'string'
                ? { title: r, description: r, priority: 'medium', category: 'Regulatory' }
                : { title: r.title || '', description: r.description || '', priority: r.priority || 'medium', category: r.category || 'Regulatory' }
            )
          : [],
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
      const result = this.parseJSON(response);
      
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
      const result = this.parseJSON(response);
      
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
      const result = this.parseJSON(response);
      
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
      const result = this.parseJSON(response);
      
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
      const result = this.parseJSON(response);
      
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
      const result = this.parseJSON(response);
      
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