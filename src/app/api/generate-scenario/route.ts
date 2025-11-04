import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';

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
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Initialize OpenAI client
    const openai = new OpenAI({ apiKey: openaiApiKey });

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
    {"name": "San Salvador", "stress": [number], "demand_mwh": [number], "supply_mwh": [number], "deficit_mwh": [number], "population": 1800000, "color": "[color]", "severity": "[severity]"},
    {"name": "Santa Ana", "stress": [number], "demand_mwh": [number], "supply_mwh": [number], "deficit_mwh": [number], "population": 580000, "color": "[color]", "severity": "[severity]"},
    {"name": "San Miguel", "stress": [number], "demand_mwh": [number], "supply_mwh": [number], "deficit_mwh": [number], "population": 520000, "color": "[color]", "severity": "[severity]"},
    {"name": "La Libertad", "stress": [number], "demand_mwh": [number], "supply_mwh": [number], "deficit_mwh": [number], "population": 850000, "color": "[color]", "severity": "[severity]"},
    {"name": "Sonsonate", "stress": [number], "demand_mwh": [number], "supply_mwh": [number], "deficit_mwh": [number], "population": 480000, "color": "[color]", "severity": "[severity]"},
    {"name": "La Paz", "stress": [number], "demand_mwh": [number], "supply_mwh": [number], "deficit_mwh": [number], "population": 350000, "color": "[color]", "severity": "[severity]"},
    {"name": "Usulután", "stress": [number], "demand_mwh": [number], "supply_mwh": [number], "deficit_mwh": [number], "population": 380000, "color": "[color]", "severity": "[severity]"},
    {"name": "Ahuachapán", "stress": [number], "demand_mwh": [number], "supply_mwh": [number], "deficit_mwh": [number], "population": 340000, "color": "[color]", "severity": "[severity]"},
    {"name": "Cuscatlán", "stress": [number], "demand_mwh": [number], "supply_mwh": [number], "deficit_mwh": [number], "population": 260000, "color": "[color]", "severity": "[severity]"},
    {"name": "Chalatenango", "stress": [number], "demand_mwh": [number], "supply_mwh": [number], "deficit_mwh": [number], "population": 220000, "color": "[color]", "severity": "[severity]"},
    {"name": "Morazán", "stress": [number], "demand_mwh": [number], "supply_mwh": [number], "deficit_mwh": [number], "population": 195000, "color": "[color]", "severity": "[severity]"},
    {"name": "La Unión", "stress": [number], "demand_mwh": [number], "supply_mwh": [number], "deficit_mwh": [number], "population": 290000, "color": "[color]", "severity": "[severity]"},
    {"name": "San Vicente", "stress": [number], "demand_mwh": [number], "supply_mwh": [number], "deficit_mwh": [number], "population": 180000, "color": "[color]", "severity": "[severity]"},
    {"name": "Cabañas", "stress": [number], "demand_mwh": [number], "supply_mwh": [number], "deficit_mwh": [number], "population": 160000, "color": "[color]", "severity": "[severity]"}
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
1. MUST include all 14 regions in the exact order shown above - no shortcuts or abbreviations
2. Make stress levels realistic based on parameters (higher demand = more stress, more solar = less stress, less rainfall = more stress)
3. San Salvador should have highest demand (~660 MWh baseline + demand increase)
4. Larger populations should have higher demand
5. Calculate deficit_mwh = demand_mwh - supply_mwh
6. Color coding: Red (#EF4444) for critical (>60%), Orange (#F59E0B) for high (35-60%), Yellow (#FBBF24) for moderate (15-35%), Green (#22C55E) for low (<15%)
7. Economics should be proportional to the severity of the problem
8. Include 3 priority actions and top 3 most stressed regions in regional_breakdown
9. Return ONLY valid JSON, no comments, no markdown, no other text`;

    console.log('🤖 Generating custom scenario with GPT-4o-mini...');

    // Call OpenAI API (using gpt-4o-mini for speed and cost efficiency)
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are an expert infrastructure simulation analyst for El Salvador. Generate realistic, actionable policy scenarios based on input parameters. Always respond with valid JSON only, no markdown code blocks.'
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 4096,
      temperature: 0.7,
    });

    // Extract JSON from response
    let responseText = completion.choices[0].message.content || '';

    // Remove markdown code blocks if present
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Remove comments from JSON (GPT-4 sometimes adds them)
    responseText = responseText
      .split('\n')
      .filter(line => !line.trim().startsWith('//'))  // Remove lines starting with //
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, '')  // Remove /* */ comments
      .replace(/,(\s*[}\]])/g, '$1');  // Remove trailing commas

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
      provider: 'openai',
      model: 'gpt-4o-mini',
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
