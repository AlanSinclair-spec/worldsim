/**
 * AIExplanationPanel Component
 *
 * Displays AI-generated explanations and insights for simulation results.
 * Features structured output with summary, key insights, risks, and prioritized recommendations.
 */

import React, { useState, useCallback } from 'react';
import { AIExplanation } from '@/lib/types';

interface AIExplanationPanelProps {
  simulationType: 'energy' | 'water' | 'agriculture';
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
  scenarioParams: Record<string, unknown>;
  language?: 'en' | 'es';
}

const priorityColors = {
  critical: 'bg-red-100 text-red-800 border-red-300',
  high: 'bg-orange-100 text-orange-800 border-orange-300',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  low: 'bg-blue-100 text-blue-800 border-blue-300',
};

const priorityIcons = {
  critical: '🚨',
  high: '⚠️',
  medium: '📋',
  low: '💡',
};

export function AIExplanationPanel({
  simulationType,
  results,
  scenarioParams,
  language = 'en',
}: AIExplanationPanelProps) {
  const [explanation, setExplanation] = useState<AIExplanation | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'es'>(language);

  const labels = {
    title: { en: 'AI Executive Summary', es: 'Resumen Ejecutivo de IA' },
    generate: { en: 'Generate AI Summary', es: 'Generar Resumen de IA' },
    generating: { en: 'Analyzing...', es: 'Analizando...' },
    regenerate: { en: 'Regenerate', es: 'Regenerar' },
    summary: { en: 'Summary', es: 'Resumen' },
    keyInsights: { en: 'Key Insights', es: 'Hallazgos Clave' },
    risks: { en: 'Risks', es: 'Riesgos' },
    recommendations: { en: 'Priority Actions', es: 'Acciones Prioritarias' },
    confidence: { en: 'Confidence', es: 'Confianza' },
    generatedAt: { en: 'Generated at', es: 'Generado el' },
    timeline: { en: 'Timeline', es: 'Plazo' },
    estimatedCost: { en: 'Est. Cost', es: 'Costo Est.' },
    errorMessage: {
      en: 'Failed to generate explanation. Please try again.',
      es: 'Error al generar explicación. Por favor, intenta de nuevo.',
    },
  };

  const handleGenerateExplanation = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          structured: true,
          simulation_type: simulationType,
          results,
          scenario_params: scenarioParams,
          language: currentLanguage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setExplanation(data.data);
      } else {
        setError(data.error || labels.errorMessage[currentLanguage]);
      }
    } catch (err) {
      console.error('Failed to generate AI explanation:', err);
      setError(labels.errorMessage[currentLanguage]);
    } finally {
      setIsGenerating(false);
    }
  }, [simulationType, results, scenarioParams, currentLanguage, labels.errorMessage]);

  const handleLanguageToggle = useCallback(() => {
    const newLang = currentLanguage === 'en' ? 'es' : 'en';
    setCurrentLanguage(newLang);
    // Re-generate with new language if explanation already exists
    if (explanation) {
      setExplanation(null);
      setTimeout(() => handleGenerateExplanation(), 100);
    }
  }, [currentLanguage, explanation, handleGenerateExplanation]);

  return (
    <div className="mt-6 p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <span className="text-2xl">🤖</span>
          <span>{labels.title[currentLanguage]}</span>
        </h3>

        <div className="flex items-center gap-3">
          {/* Language Toggle */}
          <div className="flex bg-white rounded-lg border border-gray-200 p-1">
            <button
              onClick={() => {
                if (currentLanguage !== 'en') handleLanguageToggle();
              }}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                currentLanguage === 'en'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => {
                if (currentLanguage !== 'es') handleLanguageToggle();
              }}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                currentLanguage === 'es'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              ES
            </button>
          </div>

          {/* Generate/Regenerate Button */}
          <button
            onClick={handleGenerateExplanation}
            disabled={isGenerating}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 flex items-center gap-2"
          >
            {isGenerating ? (
              <>
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {labels.generating[currentLanguage]}
              </>
            ) : (
              <>
                {explanation ? labels.regenerate[currentLanguage] : labels.generate[currentLanguage]}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Explanation Content */}
      {explanation && (
        <div className="space-y-6">
          {/* Summary */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
              {labels.summary[currentLanguage]}
            </h4>
            <p className="text-base text-gray-800 leading-relaxed">{explanation.summary}</p>
          </div>

          {/* Key Insights */}
          {explanation.key_insights.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                {labels.keyInsights[currentLanguage]}
              </h4>
              <ul className="space-y-2">
                {explanation.key_insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-600 font-bold mt-1">•</span>
                    <span className="text-sm text-gray-700 leading-relaxed">{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risks */}
          {explanation.risks.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                {labels.risks[currentLanguage]}
              </h4>
              <ul className="space-y-2">
                {explanation.risks.map((risk, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-600 text-lg">⚠️</span>
                    <span className="text-sm text-gray-700 leading-relaxed">{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {explanation.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                {labels.recommendations[currentLanguage]}
              </h4>
              <div className="space-y-3">
                {explanation.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${priorityColors[rec.priority]}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg">{priorityIcons[rec.priority]}</span>
                          <h5 className="font-bold text-sm uppercase">
                            {rec.priority} Priority
                          </h5>
                        </div>
                        <p className="font-semibold text-base mb-2">{rec.title}</p>
                        <p className="text-sm leading-relaxed mb-3">{rec.description}</p>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold">{labels.timeline[currentLanguage]}:</span>
                            <span>{rec.timeline}</span>
                          </div>
                          {rec.estimated_cost_usd && (
                            <div className="flex items-center gap-1">
                              <span className="font-semibold">{labels.estimatedCost[currentLanguage]}:</span>
                              <span>${(rec.estimated_cost_usd / 1_000_000).toFixed(1)}M</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer with Metadata */}
          <div className="pt-4 border-t border-purple-200 flex items-center justify-between text-xs text-gray-600">
            <div className="flex items-center gap-4">
              <span>
                {labels.generatedAt[currentLanguage]}:{' '}
                {new Date(explanation.generated_at).toLocaleString(
                  currentLanguage === 'es' ? 'es-SV' : 'en-US'
                )}
              </span>
              <span>
                {labels.confidence[currentLanguage]}: {(explanation.confidence_score * 100).toFixed(0)}%
              </span>
            </div>
            <div className="text-purple-600 font-semibold">Powered by GPT-4</div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!explanation && !isGenerating && !error && (
        <div className="text-center py-8">
          <div className="text-5xl mb-3">🤖</div>
          <p className="text-gray-600 text-sm">
            {currentLanguage === 'en'
              ? 'Click "Generate AI Summary" to get cabinet-ready insights and recommendations'
              : 'Haz clic en "Generar Resumen de IA" para obtener insights y recomendaciones listas para gabinete'}
          </p>
        </div>
      )}
    </div>
  );
}
