import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

/**
 * POST /api/generate-scenario
 *
 * Generates a custom simulation scenario using AI based on user parameters
 *
 * Request body:
 * - solar_growth_pct: number (-100 to 500)
 * - rainfall_change_pct: number (-100 to 100)
 * - demand_increase_pct: number (0 to 200)
 * - scenario_name: string
 * - language: 'en' | 'es'
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      solar_growth_pct = 0,
      rainfall_change_pct = 0,
      demand_increase_pct = 0,
      scenario_name = 'Custom Scenario',
    } = body;

    // Validate inputs
    if (typeof solar_growth_pct !== 'number' || solar_growth_pct < -100 || solar_growth_pct > 500) {
      return NextResponse.json(
        { success: false, error: 'solar_growth_pct must be a number between -100 and 500' },
        { status: 400 }
      );
    }

    if (typeof rainfall_change_pct !== 'number' || rainfall_change_pct < -100 || rainfall_change_pct > 100) {
      return NextResponse.json(
        { success: false, error: 'rainfall_change_pct must be a number between -100 and 100' },
        { status: 400 }
      );
    }

    if (typeof demand_increase_pct !== 'number' || demand_increase_pct < 0 || demand_increase_pct > 200) {
      return NextResponse.json(
        { success: false, error: 'demand_increase_pct must be a number between 0 and 200' },
        { status: 400 }
      );
    }

    // Check API key
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    if (!anthropicApiKey) {
      return NextResponse.json(
        { success: false, error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    // Create prompt for Claude to generate realistic scenario data
    const prompt = `Generate a realistic infrastructure simulation scenario for El Salvador with these parameters:

**Scenario Name:** ${scenario_name}

**Parameters:**
- Solar growth: ${solar_growth_pct > 0 ? '+' : ''}${solar_growth_pct}% (renewable energy expansion)
- Rainfall change: ${rainfall_change_pct > 0 ? '+' : ''}${rainfall_change_pct}% (impacts hydroelectric power)
- Demand increase: ${demand_increase_pct > 0 ? '+' : ''}${demand_increase_pct}% (population/industry growth)

**Task:** Generate ONLY a valid JSON object (no markdown, no explanation) matching this exact structure:

{
  "id": "custom-scenario",
  "name": "${scenario_name}",
  "emoji": "🎯",
  "tagline": "[One sentence summary of this scenario]",
  "description": "[2-3 sentence description]",
  "parameters": {
    "solar_growth_pct": ${solar_growth_pct},
    "rainfall_change_pct": ${rainfall_change_pct},
    "demand_increase_pct": ${demand_increase_pct},
    "period": "30 days"
  },
  "summary": {
    "national_avg_stress": [number 0-100],
    "peak_stress": [number 0-100],
    "affected_population": [number in millions],
    "critical_regions": [number 0-14],
    "high_risk_regions": [number 0-14]
  },
  "regions": [
    {
      "name": "San Salvador",
      "stress": [realistic number based on parameters],
      "demand_mwh": [realistic number ~660 base],
      "supply_mwh": [realistic number based on parameters],
      "deficit_mwh": [demand - supply],
      "population": 1800000,
      "color": "[#EF4444 for >60% stress, #F59E0B for 35-60%, #FBBF24 for 15-35%, #22C55E for <15%]",
      "severity": "[critical/high/moderate/low/surplus]"
    }
    // ... include all 14 regions: San Salvador, Santa Ana, San Miguel, La Libertad, Sonsonate, La Paz, Usulután, Ahuachapán, Cuscatlán, Chalatenango, Morazán, La Unión, San Vicente, Cabañas
  ],
  "economics": {
    "investment_required_million": [realistic number],
    "investment_breakdown": "[Brief description of where money goes]",
    "economic_loss_prevented_million": [realistic number],
    "economic_loss_explanation": "[Brief explanation]",
    "roi_multiplier": [realistic number 1.5-4.0],
    "roi_explanation": "[Brief explanation]",
    "timeline_days": [realistic number 30-1000],
    "payback_period_years": [realistic number 2-15]
  },
  "ai_analysis": {
    "executive_summary": "[3-4 sentences for cabinet-level decision makers]",
    "priority_actions": [
      {
        "rank": 1,
        "action": "[Specific action]",
        "timeline": "[e.g., 30 days, 90 days]",
        "cost_million": [number],
        "impact": "[1 sentence describing impact]"
      }
      // Include 3 priority actions
    ],
    "regional_breakdown": [
      {
        "region": "[Region name]",
        "stress": [number],
        "severity": "[critical/high/moderate/low]",
        "analysis": "[2-3 sentences]",
        "recommendation": "[Specific recommendation]",
        "timeline": "[Timeline]",
        "cost_million": [number]
      }
      // Include top 3 most stressed regions
    ],
    "risks": [
      "[Risk 1]",
      "[Risk 2]",
      "[Risk 3]",
      "[Risk 4]"
    ],
    "opportunities": [
      "[Opportunity 1]",
      "[Opportunity 2]",
      "[Opportunity 3]",
      "[Opportunity 4]"
    ]
  }
}

**Important Rules:**
1. Make stress levels realistic based on parameters (higher demand = more stress, more solar = less stress, less rainfall = more stress)
2. San Salvador should have highest demand (~660 MWh baseline)
3. Larger populations should have higher demand
4. Calculate deficit_mwh = demand_mwh - supply_mwh
5. Color coding: Red (#EF4444) for critical (>60%), Orange (#F59E0B) for high (35-60%), Yellow (#FBBF24) for moderate (15-35%), Green (#22C55E) for low (<15%)
6. Economics should be proportional to the severity of the problem
7. Return ONLY the JSON object, no other text`;

    console.log('🤖 Generating custom scenario with Claude...');

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 4096,
      temperature: 0.7,
      system: 'You are an expert infrastructure simulation analyst for El Salvador. Generate realistic, actionable policy scenarios based on input parameters. Always respond with valid JSON only.',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract JSON from response
    let responseText = message.content[0].type === 'text' ? message.content[0].text : '';

    // Remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse JSON
    let scenarioData;
    try {
      scenarioData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse Claude response as JSON:', responseText);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to parse AI response as JSON',
          details: parseError instanceof Error ? parseError.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    console.log('✅ Custom scenario generated successfully');

    return NextResponse.json({
      success: true,
      data: scenarioData,
      provider: 'anthropic',
      model: 'claude-3-5-sonnet-20241022',
    });

  } catch (error) {
    console.error('Generate Scenario API Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate scenario',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
