import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { supabase } from '@/lib/supabase';
import { generateSimulationExplanation } from '@/lib/ai-explainer';

/**
 * POST /api/explain
 *
 * Generates natural language explanations of simulation results using LLMs
 *
 * Supports two modes:
 * 1. Legacy mode: Pass simulationId to fetch from database
 * 2. New structured mode: Pass results directly for structured insights
 *
 * Supports:
 * - OpenAI (GPT-4)
 * - Anthropic (Claude)
 * - Bilingual output (English/Spanish)
 * - Structured insights with recommendations
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      simulationId,
      simulation_type,
      results,
      scenario_params,
      language = 'en',
      provider = 'openai',
      structured = false,
    } = body;

    // Validate inputs
    if (!['en', 'es'].includes(language)) {
      return NextResponse.json(
        { success: false, error: 'Language must be "en" or "es"' },
        { status: 400 }
      );
    }

    if (!['openai', 'anthropic'].includes(provider)) {
      return NextResponse.json(
        { success: false, error: 'Provider must be "openai" or "anthropic"' },
        { status: 400 }
      );
    }

    // NEW STRUCTURED MODE: Direct results passed in request
    if (structured && simulation_type && results && scenario_params) {
      if (!['energy', 'water', 'agriculture'].includes(simulation_type)) {
        return NextResponse.json(
          { success: false, error: 'simulation_type must be "energy", "water", or "agriculture"' },
          { status: 400 }
        );
      }

      // Use new structured explainer module
      const explanation = await generateSimulationExplanation({
        simulation_type: simulation_type as 'energy' | 'water' | 'agriculture',
        results,
        scenario_params,
        language: language as 'en' | 'es',
      });

      return NextResponse.json({
        success: true,
        data: {
          ...explanation,
          provider: 'openai', // Always uses OpenAI for structured mode
        },
      });
    }

    // LEGACY MODE: Fetch simulation from database
    if (!simulationId) {
      return NextResponse.json(
        { success: false, error: 'Simulation ID is required for legacy mode, or use structured mode with results' },
        { status: 400 }
      );
    }

    // Fetch simulation from database
    const { data: simulation, error: fetchError } = await supabase
      .from('simulations')
      .select('*')
      .eq('id', simulationId)
      .single();

    if (fetchError || !simulation) {
      return NextResponse.json(
        { success: false, error: 'Simulation not found' },
        { status: 404 }
      );
    }

    // Prepare context for LLM
    const simulationResults = simulation.results;
    const summary = simulationResults.summary;
    const params = simulationResults.parameters;

    const contextPrompt = language === 'en'
      ? `Analyze this energy simulation for El Salvador:

Region: ${params.regionId}
Period: ${params.startDate} to ${params.endDate}
Solar Growth Rate: ${params.solarGrowthRate}% annually
Demand Growth Rate: ${params.demandGrowthRate}% annually
Rainfall Change: ${params.rainfallChange}%

Results:
- Total Energy Demand: ${(summary.totalDemandKwh / 1000).toFixed(1)} MWh
- Solar Generation: ${(summary.totalSolarKwh / 1000).toFixed(1)} MWh (${summary.solarPercentage.toFixed(1)}%)
- Grid Generation: ${(summary.totalGridKwh / 1000).toFixed(1)} MWh
- Peak Deficit: ${(summary.peakDeficit / 1000).toFixed(1)} MWh

Provide a concise analysis (2-3 paragraphs) covering:
1. Key findings and trends
2. Implications for energy infrastructure
3. Actionable recommendations`
      : `Analiza esta simulación de energía para El Salvador:

Región: ${params.regionId}
Período: ${params.startDate} hasta ${params.endDate}
Tasa de Crecimiento Solar: ${params.solarGrowthRate}% anual
Tasa de Crecimiento de Demanda: ${params.demandGrowthRate}% anual
Cambio en Precipitación: ${params.rainfallChange}%

Resultados:
- Demanda Total de Energía: ${(summary.totalDemandKwh / 1000).toFixed(1)} MWh
- Generación Solar: ${(summary.totalSolarKwh / 1000).toFixed(1)} MWh (${summary.solarPercentage.toFixed(1)}%)
- Generación de Red: ${(summary.totalGridKwh / 1000).toFixed(1)} MWh
- Déficit Máximo: ${(summary.peakDeficit / 1000).toFixed(1)} MWh

Proporciona un análisis conciso (2-3 párrafos) que cubra:
1. Hallazgos clave y tendencias
2. Implicaciones para la infraestructura energética
3. Recomendaciones accionables`;

    let explanation = '';

    // Generate explanation using selected provider
    if (provider === 'openai') {
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return NextResponse.json(
          { success: false, error: 'OpenAI API key not configured' },
          { status: 500 }
        );
      }

      const openai = new OpenAI({ apiKey: openaiApiKey });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content:
              language === 'en'
                ? 'You are an energy policy analyst helping government officials in El Salvador understand simulation results. Be clear, concise, and actionable.'
                : 'Eres un analista de política energética que ayuda a funcionarios del gobierno en El Salvador a entender resultados de simulaciones. Sé claro, conciso y orientado a la acción.',
          },
          {
            role: 'user',
            content: contextPrompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });

      explanation = completion.choices[0].message.content || '';
    } else if (provider === 'anthropic') {
      const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
      if (!anthropicApiKey) {
        return NextResponse.json(
          { success: false, error: 'Anthropic API key not configured' },
          { status: 500 }
        );
      }

      const anthropic = new Anthropic({ apiKey: anthropicApiKey });

      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        system:
          language === 'en'
            ? 'You are an energy policy analyst helping government officials in El Salvador understand simulation results. Be clear, concise, and actionable.'
            : 'Eres un analista de política energética que ayuda a funcionarios del gobierno en El Salvador a entender resultados de simulaciones. Sé claro, conciso y orientado a la acción.',
        messages: [
          {
            role: 'user',
            content: contextPrompt,
          },
        ],
      });

      explanation = message.content[0].type === 'text' ? message.content[0].text : '';
    }

    return NextResponse.json({
      success: true,
      data: {
        explanation,
        language,
        provider,
      },
    });
  } catch (error) {
    console.error('Explain API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
