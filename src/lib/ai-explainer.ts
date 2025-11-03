/**
 * AI Explainer Module for WorldSim
 *
 * Generates executive-friendly AI summaries of simulation results using GPT-4.
 * Provides actionable insights, risk analysis, and recommendations for
 * government officials and policymakers in El Salvador.
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface SimulationExplanationParams {
  simulation_type: 'energy' | 'water' | 'agriculture';
  results: {
    summary: {
      avg_stress?: number;
      avg_crop_stress?: number;
      top_stressed_regions: Array<{ region_name?: string; name?: string; avg_stress: number }>;
    };
    economic_analysis?: {
      total_economic_exposure_usd?: number;
      infrastructure_investment_usd?: number;
      roi_5_year?: number;
      annual_costs_prevented_usd?: number;
    };
  };
  scenario_params: Record<string, unknown>;
  language: 'en' | 'es';
}

export interface AIExplanationResponse {
  summary: string;
  key_insights: string[];
  risks: string[];
  recommendations: {
    priority: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    timeline: string;
    estimated_cost_usd?: number;
  }[];
  confidence_score: number;
  generated_at: string;
  // Enhanced fields (v3.1+)
  executiveSummary?: string;
  investmentRequired?: {
    amount: number;
    explanation: string;
  };
  economicLossPrevented?: {
    amount: number;
    explanation: string;
  };
  roi?: {
    value: number;
    explanation: string;
  };
  inputParametersImpact?: string;
  visualizationRecommendations?: string;
  regionalBreakdown?: {
    region: string;
    stressLevel: number;
    analysis: string;
    recommendation: string;
    timeline: string;
    estimatedCost: number;
  }[];
  priorityActions?: {
    action: string;
    timeline: string;
    cost: number;
  }[];
}

/**
 * Generate AI-powered explanation of simulation results
 *
 * Uses GPT-4 to analyze simulation data and produce actionable insights
 * for government decision-makers in bilingual format.
 *
 * @param params - Simulation type, results, scenario parameters, and language
 * @returns Structured explanation with insights, risks, and recommendations
 */
export async function generateSimulationExplanation(
  params: SimulationExplanationParams
): Promise<AIExplanationResponse> {
  const { simulation_type, results, scenario_params, language } = params;

  // Build context-rich prompt
  const systemPrompt = buildSystemPrompt(language);
  const userPrompt = buildUserPrompt(simulation_type, results, scenario_params, language);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2500,
      response_format: { type: 'json_object' },
    });

    const response = completion.choices[0].message.content || '{}';

    // Parse JSON response
    const parsed = JSON.parse(response);

    return {
      summary: parsed.summary || '',
      key_insights: parsed.key_insights || [],
      risks: parsed.risks || [],
      recommendations: parsed.recommendations || [],
      executiveSummary: parsed.executiveSummary,
      investmentRequired: parsed.investmentRequired,
      economicLossPrevented: parsed.economicLossPrevented,
      roi: parsed.roi,
      inputParametersImpact: parsed.inputParametersImpact,
      visualizationRecommendations: parsed.visualizationRecommendations,
      regionalBreakdown: parsed.regionalBreakdown,
      priorityActions: parsed.priorityActions,
      confidence_score: 0.88, // Based on GPT-4o's reliability
      generated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('AI explanation generation failed:', error);
    throw new Error('Failed to generate AI explanation');
  }
}

/**
 * Build system prompt with role and guidelines
 */
function buildSystemPrompt(language: 'en' | 'es'): string {
  if (language === 'es') {
    return `Eres un asesor senior de políticas para el gobierno de El Salvador con experiencia en infraestructura.
Proporciona recomendaciones basadas en datos y accionables basadas en resultados de simulación.
Siempre cita números específicos y nombres de departamentos.
Responde en formato JSON con la estructura exacta especificada.`;
  }

  return `You are a senior policy advisor for El Salvador's government with expertise in infrastructure.
Provide data-driven, actionable recommendations based on simulation results.
Always cite specific numbers and department names.
Respond in JSON format with the exact structure specified.`;
}

/**
 * Build user prompt with simulation context
 */
function buildUserPrompt(
  type: string,
  results: SimulationExplanationParams['results'],
  params: Record<string, unknown>,
  language: 'en' | 'es'
): string {
  const stressValue = (results.summary?.avg_stress ?? results.summary?.avg_crop_stress ?? 0) * 100;
  const topRegions = results.summary?.top_stressed_regions || [];

  const topRegionsData = topRegions
    .slice(0, 5)
    .map((r, i) => `${i + 1}. ${r.region_name || r.name}: ${((r.avg_stress || 0) * 100).toFixed(1)}% stress`)
    .join('\n');

  if (language === 'es') {
    return `Analiza esta simulación de ${type} para El Salvador y proporciona una recomendación de política comprensiva.

DATOS DE SIMULACIÓN:
Escenario: ${type}
Parámetros de entrada: ${JSON.stringify(params, null, 2)}
Estrés promedio: ${stressValue.toFixed(1)}%

TOP 5 REGIONES ESTRESADAS:
${topRegionsData}

PROPORCIONA UN ANÁLISIS COMPRENSIVO CON ESTAS SECCIONES EXACTAS:

1. INVERSIÓN REQUERIDA
Calcula inversión realista basada en niveles de estrés:
- Si estrés promedio < 30%: Mantenimiento base ($1M por región)
- Si estrés promedio 30-60%: Mejoras específicas ($2.5M por región afectada)
- Si estrés promedio > 60%: Expansión de emergencia ($5M por región afectada)
Proporciona cantidad total en millones de $.

2. PÉRDIDA ECONÓMICA PREVENIDA
Estima pérdidas económicas prevenidas por esta inversión:
- Considera población afectada
- Costos de fallo de infraestructura
- Disrupción económica
Proporciona cantidad total en millones de $ (típicamente 2-4x la inversión).

3. RETORNO DE INVERSIÓN
Calcula ROI = Pérdida Económica Prevenida / Inversión Requerida
Expresa como multiplicador (ej., 3.2x significa $3.20 retornados por $1 invertido)

4. IMPACTO DE PARÁMETROS DE ENTRADA
Explica cómo los parámetros de entrada (crecimiento solar, cambios de lluvia, etc.) impulsaron estos resultados.

5. RESULTADO E INSIGHTS
Proporciona 3-5 insights clave sobre:
- Qué regiones necesitan atención inmediata
- Causas raíz del estrés
- Implicaciones a largo plazo

6. DESGLOSE REGIONAL
Para cada una de las 3 regiones más estresadas, proporciona:
- Nivel de estrés específico
- Por qué esta región está afectada
- Acción recomendada
- Cronograma
- Costo estimado

Responde en formato JSON con esta estructura:
{
  "summary": "2-3 oraciones",
  "key_insights": ["insight1", "insight2", "insight3"],
  "risks": ["riesgo1", "riesgo2", "riesgo3"],
  "recommendations": [
    {
      "priority": "critical" | "high" | "medium" | "low",
      "title": "título",
      "description": "descripción",
      "timeline": "30 días",
      "estimated_cost_usd": 50000000
    }
  ],
  "executiveSummary": "resumen ejecutivo para políticos",
  "investmentRequired": { "amount": número, "explanation": "explicación" },
  "economicLossPrevented": { "amount": número, "explanation": "explicación" },
  "roi": { "value": número, "explanation": "explicación" },
  "inputParametersImpact": "análisis de impacto",
  "regionalBreakdown": [
    {
      "region": "nombre",
      "stressLevel": número,
      "analysis": "análisis",
      "recommendation": "recomendación",
      "timeline": "cronograma",
      "estimatedCost": número
    }
  ],
  "priorityActions": [
    { "action": "acción", "timeline": "cronograma", "cost": número }
  ]
}`;
  }

  return `Analyze this ${type} simulation for El Salvador and provide comprehensive policy recommendations.

SIMULATION DATA:
Scenario: ${type}
Input Parameters: ${JSON.stringify(params, null, 2)}
Average Stress: ${stressValue.toFixed(1)}%

TOP 5 STRESSED REGIONS:
${topRegionsData}

PROVIDE A COMPREHENSIVE POLICY ANALYSIS WITH THESE EXACT SECTIONS:

1. INVESTMENT REQUIRED
Calculate realistic investment needed based on stress levels:
- If avg stress < 30%: Baseline maintenance ($1M per region)
- If avg stress 30-60%: Targeted upgrades ($2.5M per affected region)
- If avg stress > 60%: Emergency expansion ($5M per affected region)
Provide total $ amount in millions.

2. ECONOMIC LOSS PREVENTED
Estimate economic losses prevented by this investment:
- Consider population affected
- Infrastructure failure costs
- Economic disruption
Provide total $ amount in millions (typically 2-4x the investment).

3. RETURN ON INVESTMENT
Calculate ROI = Economic Loss Prevented / Investment Required
Express as multiplier (e.g., 3.2x means $3.20 returned per $1 invested)

4. INPUT PARAMETERS IMPACT
Explain how the input parameters (solar growth, rainfall changes, etc.) drove these results.

5. OUTCOME & INSIGHTS
Provide 3-5 key insights about:
- Which regions need immediate attention
- Root causes of stress
- Long-term implications

6. REGIONAL BREAKDOWN
For each of the top 3 stressed regions, provide:
- Specific stress level
- Why this region is affected
- Recommended action
- Timeline
- Estimated cost

CRITICAL REQUIREMENTS:
- Be specific with department names (San Salvador, Santa Ana, etc.)
- Use concrete numbers and timelines
- Prioritize actions (Immediate, Short-term, Long-term)
- Consider El Salvador's geography and infrastructure
- Recommendations must be actionable
- Explain your reasoning

Respond in JSON format with this structure:
{
  "summary": "2-3 sentences",
  "key_insights": ["insight1", "insight2", "insight3"],
  "risks": ["risk1", "risk2", "risk3"],
  "recommendations": [
    {
      "priority": "critical" | "high" | "medium" | "low",
      "title": "title",
      "description": "description",
      "timeline": "30 days",
      "estimated_cost_usd": 50000000
    }
  ],
  "executiveSummary": "executive summary for policy makers",
  "investmentRequired": { "amount": number, "explanation": "explanation" },
  "economicLossPrevented": { "amount": number, "explanation": "explanation" },
  "roi": { "value": number, "explanation": "explanation" },
  "inputParametersImpact": "impact analysis",
  "regionalBreakdown": [
    {
      "region": "name",
      "stressLevel": number,
      "analysis": "analysis",
      "recommendation": "recommendation",
      "timeline": "timeline",
      "estimatedCost": number
    }
  ],
  "priorityActions": [
    { "action": "action", "timeline": "timeline", "cost": number }
  ]
}`;
}

