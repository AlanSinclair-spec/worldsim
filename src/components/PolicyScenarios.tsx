'use client';

import { SimulationScenario, WaterSimulationScenario } from '@/lib/types';

interface PolicyScenario {
  id: string;
  title: { en: string; es: string };
  description: { en: string; es: string };
  icon: string;
  category: 'energy' | 'water' | 'agriculture';
  impact: 'critical' | 'high' | 'moderate';
  parameters: SimulationScenario | WaterSimulationScenario;
}

interface PolicyScenariosProps {
  /** Current active category (energy/water/agriculture/economics/compare/trends) */
  category: 'energy' | 'water' | 'agriculture' | 'economics' | 'compare' | 'trends';
  /** Language for labels (EN/ES) */
  language?: 'en' | 'es';
  /** Callback when scenario is selected */
  onScenarioSelect: (scenario: SimulationScenario | WaterSimulationScenario) => void;
  /** Currently loaded scenario ID (optional) */
  activeScenarioId?: string;
}

/**
 * Pre-configured policy scenarios for one-click testing
 *
 * Provides executives with ready-to-test critical scenarios like:
 * - Climate crisis (30% rainfall reduction)
 * - Renewable transition (ban coal by 2030)
 * - Population growth (500K climate refugees)
 */
const POLICY_SCENARIOS: PolicyScenario[] = [
  // Energy Scenarios
  {
    id: 'drought-crisis',
    title: {
      en: 'El Salvador: Drought Crisis',
      es: 'El Salvador: Crisis de Sequía',
    },
    description: {
      en: 'Climate crisis scenario: Test grid resilience under severe water scarcity',
      es: 'Escenario de crisis climática: Pruebe resiliencia de red bajo escasez severa',
    },
    icon: '🌵',
    category: 'energy',
    impact: 'critical',
    parameters: {
      solar_growth_pct: 20,
      rainfall_change_pct: -30,
      start_date: '2025-01-01',
      end_date: '2025-12-31',
    },
  },
  {
    id: 'coal-ban',
    title: {
      en: 'El Salvador: Coal Phase-Out by 2030',
      es: 'El Salvador: Eliminación del Carbón para 2030',
    },
    description: {
      en: 'Test 100% renewable transition with aggressive solar expansion',
      es: 'Pruebe transición 100% renovable con expansión solar agresiva',
    },
    icon: '🌞',
    category: 'energy',
    impact: 'high',
    parameters: {
      solar_growth_pct: 150,
      rainfall_change_pct: 0,
      start_date: '2025-01-01',
      end_date: '2030-12-31',
    },
  },
  {
    id: 'climate-refugees',
    title: {
      en: 'El Salvador: 500K Climate Refugees',
      es: 'El Salvador: 500K Refugiados Climáticos',
    },
    description: {
      en: 'Population surge scenario: Test infrastructure under 40% demand increase',
      es: 'Escenario de aumento poblacional: Pruebe infraestructura bajo aumento 40%',
    },
    icon: '👥',
    category: 'energy',
    impact: 'critical',
    parameters: {
      solar_growth_pct: 50,
      rainfall_change_pct: -10,
      start_date: '2025-01-01',
      end_date: '2027-12-31',
    },
  },
  {
    id: 'bitcoin-mining',
    title: {
      en: 'El Salvador: Bitcoin Mining Doubles',
      es: 'El Salvador: Minería Bitcoin se Duplica',
    },
    description: {
      en: 'Industrial expansion scenario: Test grid capacity under crypto growth',
      es: 'Escenario de expansión industrial: Pruebe capacidad de red bajo crecimiento crypto',
    },
    icon: '₿',
    category: 'energy',
    impact: 'high',
    parameters: {
      solar_growth_pct: 80,
      rainfall_change_pct: 0,
      start_date: '2025-01-01',
      end_date: '2026-12-31',
    },
  },
  {
    id: 'optimal-growth',
    title: {
      en: 'El Salvador: Optimal 5-Year Plan',
      es: 'El Salvador: Plan Óptimo a 5 Años',
    },
    description: {
      en: 'Balanced scenario: Moderate solar expansion with climate resilience',
      es: 'Escenario equilibrado: Expansión solar moderada con resiliencia climática',
    },
    icon: '📈',
    category: 'energy',
    impact: 'moderate',
    parameters: {
      solar_growth_pct: 40,
      rainfall_change_pct: -5,
      start_date: '2025-01-01',
      end_date: '2030-12-31',
    },
  },
  // Water Scenarios
  {
    id: 'water-drought',
    title: {
      en: 'El Salvador: Severe Drought',
      es: 'El Salvador: Sequía Severa',
    },
    description: {
      en: 'Worst-case climate scenario: Test water infrastructure resilience',
      es: 'Escenario climático peor caso: Pruebe resiliencia de infraestructura hídrica',
    },
    icon: '💧',
    category: 'water',
    impact: 'critical',
    parameters: {
      water_demand_growth_pct: 10,
      rainfall_change_pct: -40,
      conservation_rate_pct: 0,
      start_date: '2025-01-01',
      end_date: '2025-12-31',
    } as WaterSimulationScenario,
  },
  {
    id: 'water-refugees',
    title: {
      en: 'El Salvador: 500K New Residents',
      es: 'El Salvador: 500K Nuevos Residentes',
    },
    description: {
      en: 'Population growth scenario: Test water supply capacity expansion',
      es: 'Escenario de crecimiento poblacional: Pruebe expansión de capacidad hídrica',
    },
    icon: '🚰',
    category: 'water',
    impact: 'high',
    parameters: {
      water_demand_growth_pct: 40,
      rainfall_change_pct: -15,
      conservation_rate_pct: 10,
      start_date: '2025-01-01',
      end_date: '2027-12-31',
    } as WaterSimulationScenario,
  },
  {
    id: 'water-optimal',
    title: {
      en: 'El Salvador: Sustainable Water Management',
      es: 'El Salvador: Gestión Sostenible del Agua',
    },
    description: {
      en: 'Best-case scenario: Moderate growth with climate adaptation',
      es: 'Mejor escenario: Crecimiento moderado con adaptación climática',
    },
    icon: '🌊',
    category: 'water',
    impact: 'moderate',
    parameters: {
      water_demand_growth_pct: 20,
      rainfall_change_pct: -10,
      conservation_rate_pct: 20,
      start_date: '2025-01-01',
      end_date: '2030-12-31',
    } as WaterSimulationScenario,
  },
];

/**
 * PolicyScenarios Component
 *
 * Displays pre-configured policy scenarios that executives can test with one click.
 * Eliminates the need to manually configure parameters for common critical questions.
 *
 * Features:
 * - Category-filtered scenarios (energy/water)
 * - Impact level indicators (critical/high/moderate)
 * - One-click scenario loading
 * - Active scenario highlighting
 * - Bilingual support (EN/ES)
 *
 * @example
 * <PolicyScenarios
 *   category="energy"
 *   language="en"
 *   onScenarioSelect={(params) => setScenario(params)}
 *   activeScenarioId="drought-crisis"
 * />
 */
export function PolicyScenarios({
  category,
  language = 'en',
  onScenarioSelect,
  activeScenarioId,
}: PolicyScenariosProps) {
  const labels = {
    title: {
      en: 'Quick-Start Policy Scenarios',
      es: 'Escenarios de Política Pre-configurados',
    },
    subtitle: {
      en: 'Test critical decisions with one click. Each scenario is based on real policy questions.',
      es: 'Pruebe decisiones críticas con un clic. Cada escenario se basa en preguntas de política reales.',
    },
    impact: {
      critical: { en: 'Critical', es: 'Crítico' },
      high: { en: 'High Impact', es: 'Alto Impacto' },
      moderate: { en: 'Moderate', es: 'Moderado' },
    },
    testScenario: {
      en: 'Test Scenario',
      es: 'Probar Escenario',
    },
    active: {
      en: 'Active',
      es: 'Activo',
    },
  };

  // Filter scenarios by category
  const filteredScenarios = POLICY_SCENARIOS.filter((s) => s.category === category);

  // Impact color mapping
  const impactColors = {
    critical: 'border-red-500 bg-red-50',
    high: 'border-orange-500 bg-orange-50',
    moderate: 'border-green-500 bg-green-50',
  };

  const impactBadgeColors = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    moderate: 'bg-green-100 text-green-800',
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200 shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {labels.title[language]}
        </h3>
        <p className="text-sm text-gray-600">
          {labels.subtitle[language]}
        </p>
      </div>

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredScenarios.map((scenario) => {
          const isActive = activeScenarioId === scenario.id;

          return (
            <div
              key={scenario.id}
              className={`
                relative bg-white rounded-lg p-4 border-2 transition-all duration-200 cursor-pointer
                hover:shadow-lg hover:scale-105
                ${isActive ? 'ring-2 ring-blue-500 shadow-xl' : impactColors[scenario.impact]}
              `}
              onClick={() => onScenarioSelect(scenario.parameters)}
            >
              {/* Active Badge */}
              {isActive && (
                <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                  {labels.active[language]}
                </div>
              )}

              {/* Icon & Impact Badge */}
              <div className="flex items-start justify-between mb-3">
                <div className="text-4xl">{scenario.icon}</div>
                <div className={`text-xs font-semibold px-2 py-1 rounded ${impactBadgeColors[scenario.impact]}`}>
                  {labels.impact[scenario.impact][language]}
                </div>
              </div>

              {/* Title */}
              <h4 className="text-base font-bold text-gray-900 mb-2 leading-tight">
                {scenario.title[language]}
              </h4>

              {/* Description */}
              <p className="text-xs text-gray-600 mb-4 leading-relaxed">
                {scenario.description[language]}
              </p>

              {/* Parameters Preview */}
              <div className="text-xs text-gray-500 space-y-1 mb-3 bg-gray-50 rounded p-2">
                {'solar_growth_pct' in scenario.parameters && scenario.parameters.solar_growth_pct !== 0 && (
                  <div>Solar: {scenario.parameters.solar_growth_pct > 0 ? '+' : ''}{scenario.parameters.solar_growth_pct}%</div>
                )}
                {'water_demand_growth_pct' in scenario.parameters && scenario.parameters.water_demand_growth_pct !== 0 && (
                  <div>Demand: {scenario.parameters.water_demand_growth_pct > 0 ? '+' : ''}{scenario.parameters.water_demand_growth_pct}%</div>
                )}
                {'conservation_rate_pct' in scenario.parameters && scenario.parameters.conservation_rate_pct !== 0 && (
                  <div>Conservation: {scenario.parameters.conservation_rate_pct}%</div>
                )}
                {scenario.parameters.rainfall_change_pct !== 0 && (
                  <div>Rainfall: {scenario.parameters.rainfall_change_pct > 0 ? '+' : ''}{scenario.parameters.rainfall_change_pct}%</div>
                )}
                <div>
                  {new Date(scenario.parameters.start_date).getFullYear()} - {new Date(scenario.parameters.end_date).getFullYear()}
                </div>
              </div>

              {/* Action Button */}
              <button
                className={`
                  w-full py-2 px-4 rounded-md font-semibold text-sm transition-colors
                  ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
                onClick={(e) => {
                  e.stopPropagation();
                  onScenarioSelect(scenario.parameters);
                }}
              >
                {isActive ? labels.active[language] : labels.testScenario[language]}
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom Note */}
      <div className="mt-6 pt-4 border-t border-blue-200">
        <p className="text-xs text-gray-500 text-center">
          {language === 'en'
            ? '💡 Each scenario takes 10 seconds to run. Test multiple scenarios to compare outcomes.'
            : '💡 Cada escenario toma 10 segundos en ejecutarse. Pruebe múltiples escenarios para comparar resultados.'}
        </p>
      </div>
    </div>
  );
}
