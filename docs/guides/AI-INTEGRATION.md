# AI Integration & Features

## Overview
Artificial Intelligence is integrated throughout the Orca platform to enhance efficiency, accuracy, and decision-making capabilities across all modules.

## AI Capabilities

### 1. Document Processing & Data Extraction

#### Insurance Document Processing
- **Automated fax/letter parsing**: Extract structured data from insurance correspondence
- **Patient information reconciliation**: Match extracted data with existing patient records
- **EOB processing**: Automatically parse Explanation of Benefits documents
- **Claims response handling**: Extract denial reasons and required actions

#### Clinical Documentation
- **Handwriting recognition**: Convert handwritten notes to digital text
- **Medical history extraction**: Parse patient medical history forms
- **Referral letter processing**: Extract key information from referring doctor letters

### 2. Intelligent Data Entry & Validation

#### Smart Forms
- **Auto-complete suggestions**: Predict and suggest form field values
- **Data validation**: Real-time validation of entered data
- **Duplicate detection**: Identify potential duplicate patient records
- **Format correction**: Automatically correct common data entry errors

#### Automated Coding
- **Procedure code suggestions**: Recommend appropriate dental codes
- **ICD-10 code mapping**: Suggest diagnosis codes based on clinical notes
- **Insurance code optimization**: Recommend optimal coding for reimbursement

### 3. Predictive Analytics

#### Treatment Planning
- **Treatment duration prediction**: Estimate treatment timeline based on case complexity
- **Outcome prediction**: Predict treatment success probability
- **Case complexity analysis**: Assess case difficulty and resource requirements

#### Business Intelligence
- **Appointment no-show prediction**: Identify high-risk no-show appointments
- **Patient churn prediction**: Identify patients at risk of discontinuing treatment
- **Revenue forecasting**: Predict future revenue based on treatment pipeline
- **Optimal scheduling**: Recommend appointment scheduling for maximum efficiency

#### Financial Predictions
- **Payment default risk**: Identify patients likely to have payment difficulties
- **Collection success probability**: Predict likelihood of collecting overdue balances
- **Insurance reimbursement estimation**: Predict expected insurance payment amounts

### 4. Intelligent Automation

#### Appointment Management
- **Smart scheduling recommendations**: Suggest optimal appointment times
- **Automatic rescheduling**: Propose alternative times for conflicts
- **Waitlist optimization**: Intelligently fill cancellations from waitlist

#### Communication
- **Message drafting**: Generate personalized patient communications
- **Response suggestions**: Suggest replies to common patient inquiries
- **Sentiment analysis**: Analyze patient communication for satisfaction indicators

#### Billing & Collections
- **Payment plan recommendations**: Suggest appropriate payment plans
- **Follow-up prioritization**: Prioritize collection efforts based on success probability
- **Claims optimization**: Suggest improvements before claims submission

### 5. Clinical Decision Support

#### Treatment Recommendations
- **Evidence-based suggestions**: Recommend treatments based on clinical research
- **Alternative treatment options**: Suggest alternative approaches for consideration
- **Risk assessment**: Identify potential complications or concerns

#### Image Analysis
- **Anomaly detection**: Flag unusual findings in diagnostic images
- **Progress assessment**: Compare images over time to assess treatment progress
- **Measurement automation**: Automatically measure orthodontic parameters

#### Smart Report Generation
- **Auto-select best images**: AI picks optimal photos/X-rays based on quality and relevance
- **Before/after matching**: Automatically pair comparable images across treatment timeline
- **Layout recommendations**: Suggest optimal collage layout based on available content
- **Auto-captioning**: Generate descriptive labels from image metadata and visual analysis
- **Treatment summary drafting**: Create clinical narrative summarizing visible progress
- **Template learning**: Convert AI-generated reports into reusable templates

### 6. Natural Language Processing

#### Search & Retrieval
- **Semantic search**: Understand natural language queries
- **Quick patient lookup**: "Find the patient who came in last Tuesday with a broken bracket"
- **Clinical note search**: Search notes using natural language

#### Voice Input
- **Voice dictation**: Convert speech to text for clinical notes
- **Voice commands**: Control system features using voice
- **Multi-language support**: Support for multiple languages

### 7. Quality Assurance

#### Error Detection
- **Data inconsistency detection**: Identify conflicting information
- **Missing information alerts**: Flag incomplete records
- **Billing error detection**: Identify potential billing mistakes before submission

#### Compliance Monitoring
- **Documentation completeness**: Ensure required documentation is complete
- **Protocol adherence**: Monitor adherence to clinical protocols
- **Regulatory compliance**: Check for compliance with regulations

### 8. Lab Work Intelligence

#### Order Optimization
- **Vendor recommendation**: Suggest optimal lab vendor based on item type, turnaround, and cost
- **Order timing prediction**: Recommend when to place orders based on treatment timeline
- **Rush order necessity**: Predict when rush orders are needed to meet appointment schedules

#### Quality Prediction
- **Vendor quality scoring**: AI-powered quality ratings based on historical data
- **Remake prediction**: Identify orders at risk of quality issues
- **Delivery time estimation**: Predict actual delivery dates based on vendor history

### 9. Practice Orchestration Intelligence

#### Real-Time Operations
- **Delay prediction**: Predict appointment delays before they cascade
- **Resource optimization**: AI-powered chair and staff assignment recommendations
- **Patient flow optimization**: Predict bottlenecks and suggest flow improvements

#### Proactive Alerts
- **Intelligent alert prioritization**: Learn which alerts are most actionable
- **Pattern recognition**: Identify recurring operational issues
- **Staffing recommendations**: Suggest staffing adjustments based on predicted demand

### 10. Compliance & Documentation AI

#### Automated Compliance Monitoring
- **HIPAA/PIPEDA compliance checking**: Automated review of documentation for compliance gaps
- **Consent form tracking**: Alert for missing or expired consent forms
- **Certification expiration prediction**: Proactive alerts for upcoming staff certification renewals

#### Protocol Adherence
- **Clinical protocol monitoring**: Track adherence to established protocols
- **Incident pattern analysis**: Identify trends in incident reports
- **Audit readiness scoring**: AI-assessed readiness for regulatory audits

## AI Infrastructure

### On-Premises AI Processing
- **Local AI models**: Privacy-sensitive operations run on local servers
- **No data transmission**: Patient data never leaves the practice for AI processing

### Cloud AI Services
- **Secure API integration**: Encrypted outbound connections for cloud AI services
- **Data anonymization**: Remove PHI before cloud processing when required
- **Fallback mechanisms**: Local operation when internet unavailable

### Model Training & Improvement
- **Privacy-preserving learning**: Improve models without exposing patient data
- **Practice-specific customization**: Adapt AI to specific practice patterns
- **Continuous improvement**: Regular model updates and refinements

## AI Ethics & Transparency

### Human-in-the-Loop
- **AI suggestions, not decisions**: All AI recommendations require human review
- **Override capability**: Users can always override AI suggestions
- **Audit trails**: Track all AI recommendations and human decisions

### Transparency
- **Explainable AI**: Clear explanations for AI recommendations
- **Confidence scores**: Show certainty level of AI predictions
- **Data sources**: Display what data informed AI suggestions

### Bias Prevention
- **Regular bias audits**: Monitor for and address algorithmic bias
- **Diverse training data**: Ensure representative training datasets
- **Fairness metrics**: Track AI performance across patient demographics

## AI Service Architecture

### Provider Abstraction Layer

Orca uses a provider-agnostic AI architecture that supports multiple AI services while maintaining consistent interfaces.

```typescript
// lib/ai/types.ts
export interface AIProvider {
  name: string;
  isLocal: boolean;  // Whether PHI is kept on-premises
  capabilities: AICapability[];
}

export type AICapability =
  | 'text-generation'
  | 'text-embedding'
  | 'image-analysis'
  | 'document-ocr'
  | 'speech-to-text'
  | 'text-to-speech';

export interface AIRequest<T = unknown> {
  capability: AICapability;
  input: T;
  options?: AIRequestOptions;
}

export interface AIRequestOptions {
  maxTokens?: number;
  temperature?: number;
  confidenceThreshold?: number;
  timeout?: number;
}

export interface AIResponse<T = unknown> {
  success: boolean;
  data?: T;
  confidence?: number;  // 0-1 score
  provider: string;
  latencyMs: number;
  error?: AIError;
}

export interface AIError {
  code: 'PROVIDER_ERROR' | 'TIMEOUT' | 'RATE_LIMITED' | 'INVALID_INPUT' | 'LOW_CONFIDENCE';
  message: string;
  retryable: boolean;
}
```

### Provider Configuration

```typescript
// lib/ai/config.ts
import { z } from 'zod';

const aiConfigSchema = z.object({
  providers: z.object({
    local: z.object({
      enabled: z.boolean(),
      endpoint: z.string().url().optional(),
      models: z.record(z.string()),
    }),
    openai: z.object({
      enabled: z.boolean(),
      apiKey: z.string().optional(),
      organization: z.string().optional(),
    }),
    anthropic: z.object({
      enabled: z.boolean(),
      apiKey: z.string().optional(),
    }),
  }),
  defaults: z.object({
    preferLocal: z.boolean().default(true),  // Prefer local for PHI
    confidenceThreshold: z.number().min(0).max(1).default(0.8),
    timeoutMs: z.number().default(30000),
  }),
});

export type AIConfig = z.infer<typeof aiConfigSchema>;

export function loadAIConfig(): AIConfig {
  return aiConfigSchema.parse({
    providers: {
      local: {
        enabled: process.env.LOCAL_AI_ENABLED === 'true',
        endpoint: process.env.LOCAL_AI_ENDPOINT,
        models: {
          'text-generation': process.env.LOCAL_MODEL_TEXT ?? 'llama-3',
          'text-embedding': process.env.LOCAL_MODEL_EMBED ?? 'nomic-embed',
        },
      },
      openai: {
        enabled: !!process.env.OPENAI_API_KEY,
        apiKey: process.env.OPENAI_API_KEY,
        organization: process.env.OPENAI_ORG_ID,
      },
      anthropic: {
        enabled: !!process.env.ANTHROPIC_API_KEY,
        apiKey: process.env.ANTHROPIC_API_KEY,
      },
    },
    defaults: {
      preferLocal: process.env.AI_PREFER_LOCAL !== 'false',
      confidenceThreshold: parseFloat(process.env.AI_CONFIDENCE_THRESHOLD ?? '0.8'),
      timeoutMs: parseInt(process.env.AI_TIMEOUT_MS ?? '30000'),
    },
  });
}
```

### AI Service Factory

```typescript
// lib/ai/service.ts
import { AIProvider, AIRequest, AIResponse, AICapability } from './types';
import { loadAIConfig } from './config';
import { LocalAIProvider } from './providers/local';
import { OpenAIProvider } from './providers/openai';
import { AnthropicProvider } from './providers/anthropic';

export class AIService {
  private providers: Map<string, AIProvider> = new Map();
  private config = loadAIConfig();

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    if (this.config.providers.local.enabled) {
      this.providers.set('local', new LocalAIProvider(this.config.providers.local));
    }
    if (this.config.providers.openai.enabled) {
      this.providers.set('openai', new OpenAIProvider(this.config.providers.openai));
    }
    if (this.config.providers.anthropic.enabled) {
      this.providers.set('anthropic', new AnthropicProvider(this.config.providers.anthropic));
    }
  }

  /**
   * Execute AI request with automatic provider selection
   * @param request - The AI request to execute
   * @param containsPHI - Whether request contains Protected Health Information
   */
  async execute<TInput, TOutput>(
    request: AIRequest<TInput>,
    containsPHI: boolean = true
  ): Promise<AIResponse<TOutput>> {
    const provider = this.selectProvider(request.capability, containsPHI);

    if (!provider) {
      return {
        success: false,
        provider: 'none',
        latencyMs: 0,
        error: {
          code: 'PROVIDER_ERROR',
          message: 'No provider available for this capability',
          retryable: false,
        },
      };
    }

    const startTime = Date.now();

    try {
      const result = await provider.execute<TInput, TOutput>(request);
      return {
        ...result,
        latencyMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        provider: provider.name,
        latencyMs: Date.now() - startTime,
        error: {
          code: 'PROVIDER_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
          retryable: true,
        },
      };
    }
  }

  private selectProvider(capability: AICapability, containsPHI: boolean): AIProvider | null {
    // If PHI is involved and local preference is set, use local provider
    if (containsPHI && this.config.defaults.preferLocal) {
      const local = this.providers.get('local');
      if (local?.capabilities.includes(capability)) {
        return local;
      }
    }

    // Find any provider with the capability
    for (const provider of this.providers.values()) {
      if (provider.capabilities.includes(capability)) {
        // Skip cloud providers for PHI if local preference is strict
        if (containsPHI && !provider.isLocal && this.config.defaults.preferLocal) {
          continue;
        }
        return provider;
      }
    }

    return null;
  }
}

// Singleton instance
export const aiService = new AIService();
```

---

## Implementation Patterns

### Document Processing

```typescript
// lib/ai/features/document-processing.ts
import { aiService } from '../service';
import { db } from '@/lib/db';
import { logAudit } from '@/lib/audit';

interface ExtractedInsuranceData {
  patientName?: string;
  patientDob?: string;
  insuranceCompany?: string;
  policyNumber?: string;
  groupNumber?: string;
  effectiveDate?: string;
  claimNumber?: string;
  denialReason?: string;
  amountApproved?: number;
  amountDenied?: number;
}

export async function processInsuranceDocument(
  documentPath: string,
  clinicId: string,
  userId: string
): Promise<{
  success: boolean;
  data?: ExtractedInsuranceData;
  confidence: number;
  requiresReview: boolean;
}> {
  // Step 1: OCR the document
  const ocrResult = await aiService.execute<{ path: string }, { text: string }>(
    {
      capability: 'document-ocr',
      input: { path: documentPath },
    },
    true // Contains PHI
  );

  if (!ocrResult.success || !ocrResult.data) {
    return { success: false, confidence: 0, requiresReview: true };
  }

  // Step 2: Extract structured data
  const extractionResult = await aiService.execute<
    { text: string; schema: string },
    ExtractedInsuranceData
  >(
    {
      capability: 'text-generation',
      input: {
        text: ocrResult.data.text,
        schema: 'insurance-document',
      },
      options: { temperature: 0.1 }, // Low temperature for factual extraction
    },
    true
  );

  if (!extractionResult.success || !extractionResult.data) {
    return { success: false, confidence: 0, requiresReview: true };
  }

  const confidence = extractionResult.confidence ?? 0;
  const requiresReview = confidence < 0.85;

  // Step 3: Audit log the AI processing
  await logAudit({
    action: 'AI_PROCESS',
    entity: 'InsuranceDocument',
    entityId: documentPath,
    userId,
    clinicId,
    details: {
      type: 'insurance-extraction',
      confidence,
      requiresReview,
    },
  });

  return {
    success: true,
    data: extractionResult.data,
    confidence,
    requiresReview,
  };
}
```

### Smart Autocomplete

```typescript
// lib/ai/features/autocomplete.ts
import { aiService } from '../service';

interface AutocompleteSuggestion {
  value: string;
  confidence: number;
  source: 'history' | 'ai' | 'standard';
}

export async function getAutocompleteSuggestions(
  field: string,
  partialInput: string,
  context: {
    clinicId: string;
    patientId?: string;
    formType: string;
  }
): Promise<AutocompleteSuggestion[]> {
  const suggestions: AutocompleteSuggestion[] = [];

  // First, check historical data (no AI needed)
  const historicalSuggestions = await getHistoricalSuggestions(field, partialInput, context);
  suggestions.push(...historicalSuggestions);

  // If we have enough high-confidence suggestions, return early
  if (suggestions.filter((s) => s.confidence > 0.9).length >= 3) {
    return suggestions.slice(0, 5);
  }

  // Use AI for additional suggestions (non-PHI context only)
  if (isNonPHIField(field)) {
    const aiResult = await aiService.execute<
      { field: string; partial: string; formType: string },
      string[]
    >(
      {
        capability: 'text-generation',
        input: {
          field,
          partial: partialInput,
          formType: context.formType,
        },
        options: { maxTokens: 100, temperature: 0.3 },
      },
      false // Non-PHI field
    );

    if (aiResult.success && aiResult.data) {
      aiResult.data.forEach((value) => {
        suggestions.push({
          value,
          confidence: aiResult.confidence ?? 0.7,
          source: 'ai',
        });
      });
    }
  }

  // Sort by confidence and deduplicate
  return deduplicateAndSort(suggestions).slice(0, 5);
}

function isNonPHIField(field: string): boolean {
  const phiFields = [
    'patientName',
    'dateOfBirth',
    'ssn',
    'address',
    'phone',
    'email',
    'insuranceNumber',
  ];
  return !phiFields.includes(field);
}
```

### Predictive Analytics

```typescript
// lib/ai/features/predictions.ts
import { aiService } from '../service';
import { db } from '@/lib/db';

interface NoShowPrediction {
  patientId: string;
  appointmentId: string;
  probability: number;
  riskFactors: string[];
  recommendedActions: string[];
}

export async function predictNoShowRisk(
  appointmentId: string,
  clinicId: string
): Promise<NoShowPrediction | null> {
  // Fetch appointment with patient history
  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, clinicId },
    include: {
      patient: {
        include: {
          appointments: {
            where: { status: { in: ['completed', 'no_show', 'cancelled'] } },
            orderBy: { date: 'desc' },
            take: 20,
          },
        },
      },
    },
  });

  if (!appointment) return null;

  // Calculate historical metrics (non-AI)
  const pastAppointments = appointment.patient.appointments;
  const noShowRate =
    pastAppointments.filter((a) => a.status === 'no_show').length / pastAppointments.length;
  const cancellationRate =
    pastAppointments.filter((a) => a.status === 'cancelled').length / pastAppointments.length;

  // Prepare anonymized features for AI model
  const features = {
    dayOfWeek: new Date(appointment.date).getDay(),
    hourOfDay: new Date(appointment.date).getHours(),
    appointmentType: appointment.type,
    historicalNoShowRate: noShowRate,
    historicalCancellationRate: cancellationRate,
    daysSinceLastVisit: calculateDaysSinceLastVisit(pastAppointments),
    appointmentLeadTimeDays: calculateLeadTime(appointment.date, appointment.createdAt),
  };

  // Use local AI for prediction (data stays on-premises)
  const prediction = await aiService.execute<typeof features, { probability: number; factors: string[] }>(
    {
      capability: 'text-generation',
      input: features,
      options: { temperature: 0 },
    },
    false // Using anonymized features only
  );

  if (!prediction.success || !prediction.data) {
    // Fallback to rule-based prediction
    return {
      patientId: appointment.patientId,
      appointmentId,
      probability: noShowRate * 0.6 + cancellationRate * 0.2,
      riskFactors: generateRuleBasedFactors(noShowRate, cancellationRate),
      recommendedActions: generateRecommendedActions(noShowRate),
    };
  }

  return {
    patientId: appointment.patientId,
    appointmentId,
    probability: prediction.data.probability,
    riskFactors: prediction.data.factors,
    recommendedActions: generateRecommendedActions(prediction.data.probability),
  };
}

function generateRecommendedActions(probability: number): string[] {
  const actions: string[] = [];

  if (probability > 0.3) {
    actions.push('Send appointment reminder 48 hours before');
  }
  if (probability > 0.5) {
    actions.push('Make confirmation call 24 hours before');
    actions.push('Add to waitlist backfill candidates');
  }
  if (probability > 0.7) {
    actions.push('Consider overbooking time slot');
    actions.push('Require deposit or prepayment');
  }

  return actions;
}
```

### Natural Language Search

```typescript
// lib/ai/features/search.ts
import { aiService } from '../service';
import { db } from '@/lib/db';

interface SearchResult {
  type: 'patient' | 'appointment' | 'treatment' | 'document';
  id: string;
  title: string;
  snippet: string;
  relevance: number;
}

interface ParsedQuery {
  intent: 'find_patient' | 'find_appointment' | 'find_treatment' | 'general_search';
  entities: {
    patientName?: string;
    date?: string;
    dateRange?: { start: string; end: string };
    appointmentType?: string;
    treatmentType?: string;
    keywords?: string[];
  };
  filters: Record<string, string>;
}

export async function semanticSearch(
  query: string,
  clinicId: string,
  userId: string
): Promise<SearchResult[]> {
  // Step 1: Parse natural language query
  const parsedQuery = await parseNaturalLanguageQuery(query);

  // Step 2: Execute appropriate search based on intent
  switch (parsedQuery.intent) {
    case 'find_patient':
      return searchPatients(parsedQuery.entities, clinicId);
    case 'find_appointment':
      return searchAppointments(parsedQuery.entities, clinicId);
    case 'find_treatment':
      return searchTreatments(parsedQuery.entities, clinicId);
    default:
      return generalSearch(parsedQuery.entities.keywords ?? [], clinicId);
  }
}

async function parseNaturalLanguageQuery(query: string): Promise<ParsedQuery> {
  const result = await aiService.execute<{ query: string }, ParsedQuery>(
    {
      capability: 'text-generation',
      input: { query },
      options: { temperature: 0.1 },
    },
    false // Query parsing doesn't contain PHI
  );

  if (!result.success || !result.data) {
    // Fallback to keyword extraction
    return {
      intent: 'general_search',
      entities: { keywords: query.split(' ').filter((w) => w.length > 2) },
      filters: {},
    };
  }

  return result.data;
}

async function searchPatients(
  entities: ParsedQuery['entities'],
  clinicId: string
): Promise<SearchResult[]> {
  const whereClause: any = { clinicId };

  if (entities.patientName) {
    const nameParts = entities.patientName.split(' ');
    whereClause.OR = [
      { firstName: { contains: nameParts[0], mode: 'insensitive' } },
      { lastName: { contains: nameParts[nameParts.length - 1], mode: 'insensitive' } },
    ];
  }

  const patients = await db.patient.findMany({
    where: whereClause,
    take: 10,
    orderBy: { updatedAt: 'desc' },
  });

  return patients.map((p) => ({
    type: 'patient' as const,
    id: p.id,
    title: `${p.firstName} ${p.lastName}`,
    snippet: `DOB: ${p.dateOfBirth?.toLocaleDateString()} | ${p.email ?? 'No email'}`,
    relevance: 0.9,
  }));
}
```

### Clinical Decision Support

```typescript
// lib/ai/features/clinical-support.ts
import { aiService } from '../service';

interface TreatmentSuggestion {
  treatment: string;
  confidence: number;
  rationale: string;
  evidenceLevel: 'high' | 'moderate' | 'low';
  contraindications: string[];
  alternatives: string[];
}

interface ClinicalContext {
  diagnosis: string;
  patientAge: number;
  severity: string;
  previousTreatments: string[];
  allergies: string[];
  conditions: string[];
}

export async function getTreatmentSuggestions(
  context: ClinicalContext,
  clinicId: string
): Promise<{
  suggestions: TreatmentSuggestion[];
  disclaimer: string;
  requiresReview: boolean;
}> {
  // Anonymize context for AI processing
  const anonymizedContext = {
    ageGroup: getAgeGroup(context.patientAge),
    diagnosis: context.diagnosis,
    severity: context.severity,
    hasPreviousTreatment: context.previousTreatments.length > 0,
    hasAllergies: context.allergies.length > 0,
    hasComorbidities: context.conditions.length > 0,
  };

  const result = await aiService.execute<
    typeof anonymizedContext,
    { suggestions: TreatmentSuggestion[] }
  >(
    {
      capability: 'text-generation',
      input: anonymizedContext,
      options: { temperature: 0.2, maxTokens: 1000 },
    },
    false // Anonymized data
  );

  // Filter suggestions based on patient-specific contraindications
  let suggestions = result.data?.suggestions ?? [];
  suggestions = filterByContraindications(suggestions, context.allergies, context.conditions);

  return {
    suggestions,
    disclaimer:
      'AI-generated suggestions for clinical consideration only. ' +
      'All treatment decisions must be made by licensed healthcare providers.',
    requiresReview: true, // Clinical suggestions always require human review
  };
}

function getAgeGroup(age: number): string {
  if (age < 12) return 'pediatric';
  if (age < 18) return 'adolescent';
  if (age < 65) return 'adult';
  return 'senior';
}

function filterByContraindications(
  suggestions: TreatmentSuggestion[],
  allergies: string[],
  conditions: string[]
): TreatmentSuggestion[] {
  return suggestions.map((suggestion) => ({
    ...suggestion,
    contraindications: suggestion.contraindications.filter(
      (c) =>
        allergies.some((a) => c.toLowerCase().includes(a.toLowerCase())) ||
        conditions.some((cond) => c.toLowerCase().includes(cond.toLowerCase()))
    ),
  }));
}
```

---

## Integration by Area

### Area-to-AI-Capability Mapping

| Area | AI Capabilities | Implementation Priority |
|------|-----------------|-------------------------|
| **Billing & Insurance** | Document OCR, Data Extraction, Coding Suggestions | Phase 1 |
| **CRM & Onboarding** | Duplicate Detection, Data Validation, Lead Scoring | Phase 1 |
| **Booking & Scheduling** | No-Show Prediction, Smart Scheduling, Waitlist Optimization | Phase 2 |
| **Practice Orchestration** | Real-time Delay Prediction, Resource Optimization, NL Queries | Phase 2 |
| **Treatment Management** | Clinical Decision Support, Progress Prediction, Timeline Estimation | Phase 2 |
| **Patient Communications** | Message Drafting, Sentiment Analysis, Response Suggestions | Phase 2 |
| **Imaging Management** | Image Analysis, Anomaly Detection, Auto-measurements | Phase 3 |
| **Lab Work Management** | Vendor Recommendation, Quality Prediction, Order Timing | Phase 3 |
| **Compliance & Documentation** | Completeness Checking, Protocol Monitoring, Audit Readiness | Phase 4 |
| **Financial Management** | Revenue Forecasting, Collection Prediction, Payment Risk | Phase 4 |

### API Route Integration Pattern

```typescript
// app/api/insurance/process-document/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth/withAuth';
import { processInsuranceDocument } from '@/lib/ai/features/document-processing';
import { z } from 'zod';

const requestSchema = z.object({
  documentPath: z.string(),
  documentType: z.enum(['eob', 'denial', 'authorization', 'correspondence']),
});

export const POST = withAuth(
  async (req: NextRequest, session) => {
    const body = await req.json();
    const { documentPath, documentType } = requestSchema.parse(body);

    const result = await processInsuranceDocument(
      documentPath,
      session.user.clinicId,
      session.user.id
    );

    return NextResponse.json({
      success: true,
      data: {
        extractedData: result.data,
        confidence: result.confidence,
        requiresReview: result.requiresReview,
        status: result.requiresReview ? 'pending_review' : 'auto_processed',
      },
    });
  },
  { permissions: ['insurance:process'] }
);
```

### React Hook for AI Features

```typescript
// hooks/useAIPrediction.ts
'use client';

import { useState, useCallback } from 'react';

interface UsePredictionOptions<T> {
  endpoint: string;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface PredictionResult<T> {
  data: T | null;
  confidence: number;
  requiresReview: boolean;
}

export function useAIPrediction<TInput, TOutput>({
  endpoint,
  onSuccess,
  onError,
}: UsePredictionOptions<TOutput>) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictionResult<TOutput> | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const predict = useCallback(
    async (input: TInput) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          throw new Error('Prediction request failed');
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error?.message ?? 'Unknown error');
        }

        const predictionResult: PredictionResult<TOutput> = {
          data: data.data,
          confidence: data.confidence ?? 1,
          requiresReview: data.requiresReview ?? false,
        };

        setResult(predictionResult);
        onSuccess?.(data.data);

        return predictionResult;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        onError?.(error);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [endpoint, onSuccess, onError]
  );

  return { predict, isLoading, result, error };
}

// Usage example
function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const { predict, isLoading, result } = useAIPrediction<
    { appointmentId: string },
    { probability: number; riskFactors: string[] }
  >({
    endpoint: '/api/predictions/no-show',
  });

  useEffect(() => {
    predict({ appointmentId: appointment.id });
  }, [appointment.id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{appointment.patientName}</CardTitle>
        {result && result.data && (
          <Badge variant={result.data.probability > 0.5 ? 'destructive' : 'secondary'}>
            No-show risk: {Math.round(result.data.probability * 100)}%
          </Badge>
        )}
      </CardHeader>
    </Card>
  );
}
```

---

## Operational Patterns

### Confidence Thresholds

```typescript
// lib/ai/confidence.ts

export const CONFIDENCE_THRESHOLDS = {
  // Auto-accept threshold - AI decision applied automatically
  AUTO_ACCEPT: 0.95,

  // Review threshold - Show to user with recommendation
  SUGGEST: 0.80,

  // Low confidence - Show alternatives or request manual input
  LOW: 0.60,

  // Reject threshold - Don't show AI suggestion
  REJECT: 0.40,
} as const;

export type ConfidenceAction = 'auto_accept' | 'suggest' | 'review' | 'manual_required';

export function getConfidenceAction(confidence: number, isCritical: boolean): ConfidenceAction {
  // Critical operations (clinical, financial) have stricter thresholds
  if (isCritical) {
    if (confidence >= 0.98) return 'suggest'; // Never auto-accept critical
    if (confidence >= 0.85) return 'review';
    return 'manual_required';
  }

  // Non-critical operations
  if (confidence >= CONFIDENCE_THRESHOLDS.AUTO_ACCEPT) return 'auto_accept';
  if (confidence >= CONFIDENCE_THRESHOLDS.SUGGEST) return 'suggest';
  if (confidence >= CONFIDENCE_THRESHOLDS.LOW) return 'review';
  return 'manual_required';
}
```

### Fallback Strategies

```typescript
// lib/ai/fallback.ts

export interface FallbackChain<T> {
  primary: () => Promise<T>;
  fallbacks: Array<{
    name: string;
    condition: (error: Error) => boolean;
    handler: () => Promise<T>;
  }>;
  default: T;
}

export async function executeWithFallback<T>(chain: FallbackChain<T>): Promise<{
  result: T;
  source: string;
  usedFallback: boolean;
}> {
  try {
    const result = await chain.primary();
    return { result, source: 'primary', usedFallback: false };
  } catch (primaryError) {
    for (const fallback of chain.fallbacks) {
      if (fallback.condition(primaryError as Error)) {
        try {
          const result = await fallback.handler();
          return { result, source: fallback.name, usedFallback: true };
        } catch {
          continue; // Try next fallback
        }
      }
    }

    // All fallbacks failed, return default
    return { result: chain.default, source: 'default', usedFallback: true };
  }
}

// Usage example
const prediction = await executeWithFallback({
  primary: () => aiService.execute({ capability: 'prediction', input: data }),
  fallbacks: [
    {
      name: 'local-model',
      condition: (err) => err.message.includes('rate limit'),
      handler: () => localPredictionModel.predict(data),
    },
    {
      name: 'rule-based',
      condition: () => true, // Always try rule-based as last resort
      handler: () => ruleBasedPrediction(data),
    },
  ],
  default: { probability: 0.5, confidence: 0 },
});
```

### Rate Limiting and Quotas

```typescript
// lib/ai/rate-limiter.ts
import { db } from '@/lib/db';

interface RateLimitConfig {
  maxRequestsPerMinute: number;
  maxRequestsPerDay: number;
  maxTokensPerDay: number;
}

const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  'text-generation': { maxRequestsPerMinute: 20, maxRequestsPerDay: 1000, maxTokensPerDay: 100000 },
  'document-ocr': { maxRequestsPerMinute: 10, maxRequestsPerDay: 500, maxTokensPerDay: 50000 },
  'image-analysis': { maxRequestsPerMinute: 5, maxRequestsPerDay: 200, maxTokensPerDay: 50000 },
};

export class AIRateLimiter {
  async checkLimit(
    clinicId: string,
    capability: string
  ): Promise<{ allowed: boolean; retryAfter?: number }> {
    const limits = DEFAULT_LIMITS[capability] ?? DEFAULT_LIMITS['text-generation'];
    const now = new Date();
    const minuteAgo = new Date(now.getTime() - 60000);
    const dayStart = new Date(now.setHours(0, 0, 0, 0));

    // Check minute limit
    const recentRequests = await db.aiUsage.count({
      where: {
        clinicId,
        capability,
        createdAt: { gte: minuteAgo },
      },
    });

    if (recentRequests >= limits.maxRequestsPerMinute) {
      return { allowed: false, retryAfter: 60 };
    }

    // Check daily limit
    const dailyRequests = await db.aiUsage.count({
      where: {
        clinicId,
        capability,
        createdAt: { gte: dayStart },
      },
    });

    if (dailyRequests >= limits.maxRequestsPerDay) {
      const nextDay = new Date(dayStart.getTime() + 86400000);
      return { allowed: false, retryAfter: Math.ceil((nextDay.getTime() - Date.now()) / 1000) };
    }

    return { allowed: true };
  }

  async recordUsage(clinicId: string, capability: string, tokensUsed: number): Promise<void> {
    await db.aiUsage.create({
      data: {
        clinicId,
        capability,
        tokensUsed,
      },
    });
  }
}
```

### Human-in-the-Loop Workflow

```typescript
// lib/ai/review-queue.ts
import { db } from '@/lib/db';

export interface AIReviewItem {
  id: string;
  type: string;
  input: Record<string, unknown>;
  aiOutput: Record<string, unknown>;
  confidence: number;
  status: 'pending' | 'approved' | 'rejected' | 'modified';
  reviewedBy?: string;
  reviewedAt?: Date;
  modifications?: Record<string, unknown>;
}

export async function queueForReview(
  clinicId: string,
  type: string,
  input: Record<string, unknown>,
  aiOutput: Record<string, unknown>,
  confidence: number
): Promise<string> {
  const item = await db.aiReviewQueue.create({
    data: {
      clinicId,
      type,
      input,
      aiOutput,
      confidence,
      status: 'pending',
    },
  });

  return item.id;
}

export async function processReview(
  reviewId: string,
  decision: 'approved' | 'rejected' | 'modified',
  userId: string,
  modifications?: Record<string, unknown>
): Promise<void> {
  await db.aiReviewQueue.update({
    where: { id: reviewId },
    data: {
      status: decision,
      reviewedBy: userId,
      reviewedAt: new Date(),
      modifications,
    },
  });

  // Track for model improvement (anonymized)
  if (decision === 'modified' || decision === 'rejected') {
    await db.aiTrainingFeedback.create({
      data: {
        reviewId,
        decision,
        hasModifications: !!modifications,
        // Don't store actual PHI, just metadata for learning
      },
    });
  }
}
```

---

## Testing AI Features

### Mock AI Provider

```typescript
// tests/mocks/ai-provider.ts
import { AIProvider, AIRequest, AIResponse, AICapability } from '@/lib/ai/types';

export class MockAIProvider implements AIProvider {
  name = 'mock';
  isLocal = true;
  capabilities: AICapability[] = [
    'text-generation',
    'text-embedding',
    'document-ocr',
    'image-analysis',
  ];

  private responses: Map<string, unknown> = new Map();

  setResponse(capability: string, inputMatch: string, response: unknown): void {
    this.responses.set(`${capability}:${inputMatch}`, response);
  }

  async execute<TInput, TOutput>(request: AIRequest<TInput>): Promise<AIResponse<TOutput>> {
    const key = `${request.capability}:${JSON.stringify(request.input)}`;

    // Check for exact match
    if (this.responses.has(key)) {
      return {
        success: true,
        data: this.responses.get(key) as TOutput,
        confidence: 0.95,
        provider: this.name,
        latencyMs: 10,
      };
    }

    // Return default mock response
    return {
      success: true,
      data: this.getDefaultResponse(request.capability) as TOutput,
      confidence: 0.85,
      provider: this.name,
      latencyMs: 10,
    };
  }

  private getDefaultResponse(capability: AICapability): unknown {
    const defaults: Record<AICapability, unknown> = {
      'text-generation': { text: 'Mock generated text' },
      'text-embedding': { embedding: new Array(1536).fill(0) },
      'document-ocr': { text: 'Mock OCR text' },
      'image-analysis': { labels: ['mock-label'], confidence: 0.9 },
      'speech-to-text': { text: 'Mock transcription' },
      'text-to-speech': { audioUrl: '/mock/audio.mp3' },
    };
    return defaults[capability];
  }
}
```

### AI Feature Tests

```typescript
// tests/integration/ai/document-processing.test.ts
import { describe, it, expect, beforeEach } from '@jest/globals';
import { MockAIProvider } from '@/tests/mocks/ai-provider';
import { processInsuranceDocument } from '@/lib/ai/features/document-processing';
import { aiService } from '@/lib/ai/service';

describe('Insurance Document Processing', () => {
  let mockProvider: MockAIProvider;

  beforeEach(() => {
    mockProvider = new MockAIProvider();
    // Replace provider for testing
    (aiService as any).providers.set('mock', mockProvider);
  });

  it('extracts data from insurance EOB', async () => {
    mockProvider.setResponse('document-ocr', '/test/eob.pdf', {
      text: 'Patient: John Doe\nClaim #: 12345\nAmount Approved: $500.00',
    });

    mockProvider.setResponse('text-generation', expect.anything(), {
      patientName: 'John Doe',
      claimNumber: '12345',
      amountApproved: 500,
    });

    const result = await processInsuranceDocument('/test/eob.pdf', 'clinic-1', 'user-1');

    expect(result.success).toBe(true);
    expect(result.data?.patientName).toBe('John Doe');
    expect(result.data?.amountApproved).toBe(500);
  });

  it('flags low confidence results for review', async () => {
    mockProvider.setResponse('text-generation', expect.anything(), {
      patientName: 'John',
      confidence: 0.6,
    });

    const result = await processInsuranceDocument('/test/unclear.pdf', 'clinic-1', 'user-1');

    expect(result.requiresReview).toBe(true);
  });
});
```

### Evaluation Framework

```typescript
// lib/ai/evaluation.ts

interface EvaluationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  averageConfidence: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
}

interface EvaluationCase {
  input: unknown;
  expectedOutput: unknown;
  actualOutput: unknown;
  confidence: number;
}

export function evaluateAIPerformance(cases: EvaluationCase[]): EvaluationMetrics {
  let truePositives = 0;
  let falsePositives = 0;
  let trueNegatives = 0;
  let falseNegatives = 0;
  let totalConfidence = 0;

  for (const testCase of cases) {
    const isCorrect = deepEqual(testCase.expectedOutput, testCase.actualOutput);
    const predictedPositive = testCase.actualOutput !== null;
    const actualPositive = testCase.expectedOutput !== null;

    if (predictedPositive && actualPositive && isCorrect) truePositives++;
    else if (predictedPositive && !actualPositive) falsePositives++;
    else if (!predictedPositive && !actualPositive) trueNegatives++;
    else if (!predictedPositive && actualPositive) falseNegatives++;

    totalConfidence += testCase.confidence;
  }

  const precision = truePositives / (truePositives + falsePositives) || 0;
  const recall = truePositives / (truePositives + falseNegatives) || 0;

  return {
    accuracy: (truePositives + trueNegatives) / cases.length,
    precision,
    recall,
    f1Score: (2 * precision * recall) / (precision + recall) || 0,
    averageConfidence: totalConfidence / cases.length,
    falsePositiveRate: falsePositives / (falsePositives + trueNegatives) || 0,
    falseNegativeRate: falseNegatives / (falseNegatives + truePositives) || 0,
  };
}
```

---

## Implementation Roadmap

### Phase 1: Foundation
- Document processing for insurance correspondence
- Basic data validation and auto-complete
- Simple predictive analytics

### Phase 2: Intelligence
- Advanced predictive models
- Clinical decision support
- Natural language search

### Phase 3: Automation
- Intelligent workflow automation
- Advanced image analysis
- Voice input capabilities

### Phase 4: Optimization
- Practice-specific model customization
- Advanced analytics and insights
- Continuous learning systems

---

**Status**: Active
**Last Updated**: 2024-11-28
