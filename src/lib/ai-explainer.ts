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
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0].message.content || '';

    // Parse structured response
    const parsed = parseAIResponse(response, language);

    return {
      ...parsed,
      confidence_score: 0.85, // Based on GPT-4's reliability
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
    return `Eres un asesor experto en políticas para el gobierno de El Salvador.
Tu trabajo es explicar resultados complejos de simulación en un lenguaje claro y accionable para ministros de gabinete.

REGLAS:
- Escribe en español
- Sé conciso (máximo 250 palabras)
- Enfócate en insights accionables
- Incluye números específicos de los datos
- Menciona las 3 regiones más afectadas
- Proporciona recomendaciones concretas con plazos (30/90/180 días)
- Usa tono ejecutivo (confiado, claro, urgente cuando sea necesario)
- SIN jerga técnica
- Formato: 5-7 párrafos cortos

ESTRUCTURA DE RESPUESTA:
1. RESUMEN: 2-3 oraciones sobre el escenario probado y hallazgos clave
2. INSIGHTS CLAVE: 3-4 puntos específicos (usa "•" para cada punto)
3. RIESGOS: 2-3 riesgos principales (usa "⚠️" para cada riesgo)
4. RECOMENDACIONES: 3-4 acciones prioritarias con formato:
   [PRIORIDAD] Título
   Descripción breve
   Plazo: X días
   Costo estimado: $X M (si aplica)`;
  }

  return `You are an expert policy advisor for El Salvador's government.
Your job is to explain complex simulation results in clear, actionable language for cabinet ministers.

RULES:
- Write in English
- Be concise (max 250 words)
- Focus on actionable insights
- Include specific numbers from the data
- Mention top 3 affected regions
- Provide concrete recommendations with timelines (30/90/180 days)
- Use executive tone (confident, clear, urgent when needed)
- NO jargon or technical terms
- Format as 5-7 short paragraphs

RESPONSE STRUCTURE:
1. SUMMARY: 2-3 sentences about the scenario tested and key findings
2. KEY INSIGHTS: 3-4 specific points (use "•" for each)
3. RISKS: 2-3 main risks (use "⚠️" for each)
4. RECOMMENDATIONS: 3-4 priority actions with format:
   [PRIORITY] Title
   Brief description
   Timeline: X days
   Estimated cost: $X M (if applicable)`;
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
  const stressValue = results.summary?.avg_stress ?? results.summary?.avg_crop_stress ?? 0;
  const topRegions = results.summary?.top_stressed_regions
    ?.slice(0, 3)
    .map((r) => r.region_name || r.name)
    .join(', ');
  const economicExposure = results.economic_analysis?.total_economic_exposure_usd
    ? `$${(results.economic_analysis.total_economic_exposure_usd / 1_000_000).toFixed(1)}M`
    : 'N/A';
  const investment = results.economic_analysis?.infrastructure_investment_usd
    ? `$${(results.economic_analysis.infrastructure_investment_usd / 1_000_000).toFixed(1)}M`
    : 'N/A';
  const roi = results.economic_analysis?.roi_5_year
    ? `${(results.economic_analysis.roi_5_year * 100).toFixed(1)}%`
    : 'N/A';
  const annualSavings = results.economic_analysis?.annual_costs_prevented_usd
    ? `$${(results.economic_analysis.annual_costs_prevented_usd / 1_000_000).toFixed(1)}M/year`
    : 'N/A';

  if (language === 'es') {
    return `Analiza esta simulación de ${type} para El Salvador:

ESCENARIO PROBADO:
${JSON.stringify(params, null, 2)}

RESULTADOS:
- Estrés promedio: ${stressValue.toFixed(1)}%
- Regiones más afectadas: ${topRegions}
- Exposición económica: ${economicExposure}
- Inversión recomendada: ${investment}
- ROI (5 años): ${roi}
- Ahorros anuales: ${annualSavings}

Proporciona un análisis ejecutivo explicando:
1. Qué escenario se probó y por qué importa
2. Hallazgos clave (qué regiones más afectadas, gravedad del problema)
3. Implicaciones económicas (exposición vs inversión)
4. Riesgos principales si no se actúa
5. Acciones urgentes necesarias (con cronograma: 30/90/180 días y costos)

Escribe para un ministro que debe informar al presidente.`;
  }

  return `Analyze this ${type} simulation for El Salvador:

SCENARIO TESTED:
${JSON.stringify(params, null, 2)}

RESULTS:
- Average stress: ${stressValue.toFixed(1)}%
- Most affected regions: ${topRegions}
- Economic exposure: ${economicExposure}
- Recommended investment: ${investment}
- ROI (5-year): ${roi}
- Annual savings: ${annualSavings}

Provide an executive analysis explaining:
1. What scenario was tested and why it matters
2. Key findings (which regions most affected, severity of problem)
3. Economic implications (exposure vs investment)
4. Main risks if no action is taken
5. Urgent actions needed (with timeline: 30/90/180 days and costs)

Write for a cabinet minister who needs to brief the president.`;
}

/**
 * Parse AI response into structured format
 */
function parseAIResponse(
  response: string,
  language: 'en' | 'es'
): Omit<AIExplanationResponse, 'confidence_score' | 'generated_at'> {
  const sections = response.split('\n\n');

  // Extract summary (first paragraph)
  const summary = sections[0] || '';

  // Extract key insights (look for bullet points)
  const insights: string[] = [];
  const insightsMatch = response.match(/[•·-]\s+(.+?)(?=\n[•·-]|\n\n|\n⚠️|$)/gs);
  if (insightsMatch) {
    insightsMatch.forEach((match) => {
      const clean = match.replace(/^[•·-]\s+/, '').trim();
      if (clean && !clean.startsWith('⚠️')) insights.push(clean);
    });
  }

  // Extract risks (look for warning emoji)
  const risks: string[] = [];
  const risksMatch = response.match(/⚠️\s*(.+?)(?=\n⚠️|\n\n|\n\[|$)/gs);
  if (risksMatch) {
    risksMatch.forEach((match) => {
      const clean = match.replace(/^⚠️\s*/, '').trim();
      if (clean) risks.push(clean);
    });
  }

  // Extract recommendations
  const recommendations: AIExplanationResponse['recommendations'] = [];
  const recsMatch = response.match(/\[(CRITICAL|CRÍTICO|HIGH|ALTO|MEDIUM|MEDIO|LOW|BAJO)\]\s+(.+?)(?=\n\[|\n\n|$)/gis);
  if (recsMatch) {
    recsMatch.forEach((match) => {
      const priorityMatch = match.match(/\[(CRITICAL|CRÍTICO|HIGH|ALTO|MEDIUM|MEDIO|LOW|BAJO)\]/i);
      const priority = priorityMatch
        ? mapPriority(priorityMatch[1])
        : 'medium';

      const content = match.replace(/\[.+?\]\s+/, '').trim();
      const lines = content.split('\n');
      const title = lines[0] || '';
      const description = lines[1] || '';

      // Extract timeline
      const timelineMatch = content.match(/(?:Timeline|Plazo):\s*(\d+\s*(?:days|días|months|meses))/i);
      const timeline = timelineMatch ? timelineMatch[1] : '90 days';

      // Extract cost
      const costMatch = content.match(/\$(\d+(?:\.\d+)?)\s*M/);
      const cost = costMatch ? parseFloat(costMatch[1]) * 1_000_000 : undefined;

      recommendations.push({
        priority,
        title,
        description,
        timeline,
        estimated_cost_usd: cost,
      });
    });
  }

  // Fallback: create default structure if parsing failed
  if (insights.length === 0) {
    insights.push(language === 'en' ? 'Analysis completed' : 'Análisis completado');
  }
  if (risks.length === 0) {
    risks.push(
      language === 'en'
        ? 'Risks assessment in progress'
        : 'Evaluación de riesgos en progreso'
    );
  }
  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'high',
      title: language === 'en' ? 'Review full analysis' : 'Revisar análisis completo',
      description:
        language === 'en'
          ? 'Detailed recommendations require further review'
          : 'Las recomendaciones detalladas requieren revisión adicional',
      timeline: '30 days',
    });
  }

  return {
    summary,
    key_insights: insights.slice(0, 4),
    risks: risks.slice(0, 3),
    recommendations: recommendations.slice(0, 4),
  };
}

/**
 * Map priority string to enum
 */
function mapPriority(
  priority: string
): 'critical' | 'high' | 'medium' | 'low' {
  const normalized = priority.toLowerCase();
  if (normalized.includes('critical') || normalized.includes('crítico'))
    return 'critical';
  if (normalized.includes('high') || normalized.includes('alto')) return 'high';
  if (normalized.includes('low') || normalized.includes('bajo')) return 'low';
  return 'medium';
}
