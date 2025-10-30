'use client';

import { useState } from 'react';
import Link from 'next/link';
import { EL_SALVADOR_ECONOMICS } from '@/lib/economics';

/**
 * Cost Assumptions Transparency Page
 *
 * Documents all economic assumptions, methodologies, and data sources
 * used in WorldSim economic calculations. Provides transparency for
 * government officials, researchers, and stakeholders.
 */
export default function AssumptionsPage() {
  const [language, setLanguage] = useState<'en' | 'es'>('en');

  const labels = {
    title: { en: 'Economic Assumptions & Methodology', es: 'Supuestos Económicos y Metodología' },
    subtitle: {
      en: 'Transparent documentation of all costs, calculations, and data sources used in WorldSim economic analysis',
      es: 'Documentación transparente de todos los costos, cálculos y fuentes de datos utilizados en el análisis económico de WorldSim'
    },
    lastUpdated: { en: 'Last Updated', es: 'Última Actualización' },
    backToHome: { en: 'Back to Simulator', es: 'Volver al Simulador' },
    downloadPDF: { en: 'Download PDF', es: 'Descargar PDF' },
    tableOfContents: { en: 'Table of Contents', es: 'Tabla de Contenidos' },
    infrastructureCosts: { en: 'Infrastructure Costs', es: 'Costos de Infraestructura' },
    socialCosts: { en: 'Social & Economic Costs', es: 'Costos Sociales y Económicos' },
    economicConstants: { en: 'Economic Constants', es: 'Constantes Económicas' },
    financialMetrics: { en: 'Financial Metrics & Formulas', es: 'Métricas Financieras y Fórmulas' },
    references: { en: 'References & Data Sources', es: 'Referencias y Fuentes de Datos' },
    methodology: { en: 'Calculation Methodology', es: 'Metodología de Cálculo' },
    disclaimer: { en: 'Disclaimer', es: 'Descargo de Responsabilidad' },
    disclaimerText: {
      en: 'These assumptions are based on publicly available data, industry standards, and academic research. Actual costs may vary based on specific project conditions, market fluctuations, and regional factors. This tool is for planning and scenario analysis purposes only.',
      es: 'Estos supuestos se basan en datos públicos, estándares de la industria e investigación académica. Los costos reales pueden variar según las condiciones específicas del proyecto, fluctuaciones del mercado y factores regionales. Esta herramienta es solo para fines de planificación y análisis de escenarios.'
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {labels.title[language]}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {labels.subtitle[language]}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {language === 'en' ? 'ES' : 'EN'}
              </button>
              <Link
                href="/interactive"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {labels.backToHome[language]}
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Disclaimer Box */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-bold text-yellow-800 mb-2">
                {labels.disclaimer[language]}
              </h3>
              <p className="text-sm text-yellow-700">
                {labels.disclaimerText[language]}
              </p>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">{labels.lastUpdated[language]}:</span>{' '}
              <span className="font-semibold text-gray-900">2025-10-30</span>
            </div>
            <div>
              <span className="text-gray-500">Version:</span>{' '}
              <span className="font-semibold text-gray-900">1.0</span>
            </div>
            <div>
              <span className="text-gray-500">Currency:</span>{' '}
              <span className="font-semibold text-gray-900">USD</span>
            </div>
          </div>
        </div>

        {/* Table of Contents */}
        <nav className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            {labels.tableOfContents[language]}
          </h2>
          <ul className="space-y-2 text-sm">
            {[
              { id: 'infrastructure', label: labels.infrastructureCosts[language] },
              { id: 'social', label: labels.socialCosts[language] },
              { id: 'constants', label: labels.economicConstants[language] },
              { id: 'metrics', label: labels.financialMetrics[language] },
              { id: 'methodology', label: labels.methodology[language] },
              { id: 'references', label: labels.references[language] },
            ].map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Section 1: Infrastructure Costs */}
        <section id="infrastructure" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-3xl mr-3">🏗️</span>
            {labels.infrastructureCosts[language]}
          </h2>

          {/* Energy Infrastructure */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {language === 'en' ? 'Energy Infrastructure' : 'Infraestructura Energética'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      {language === 'en' ? 'Item' : 'Artículo'}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      {language === 'en' ? 'Unit Cost' : 'Costo Unitario'}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      {language === 'en' ? 'Source' : 'Fuente'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3">
                      {language === 'en' ? 'Solar PV Installation' : 'Instalación Solar FV'}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      ${EL_SALVADOR_ECONOMICS.infrastructure.solar_cost_per_kw.toLocaleString()}/kW
                    </td>
                    <td className="px-4 py-3 text-gray-600">IRENA 2024, NREL</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3">
                      {language === 'en' ? 'Grid Upgrade (per 10% capacity)' : 'Mejora de Red (por 10% capacidad)'}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      ${(EL_SALVADOR_ECONOMICS.infrastructure.grid_upgrade_base_cost_per_region / 1_000_000).toFixed(1)}M per region
                    </td>
                    <td className="px-4 py-3 text-gray-600">World Bank, IDB</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3">
                      {language === 'en' ? 'Battery Storage' : 'Almacenamiento de Baterías'}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      $250/kWh
                    </td>
                    <td className="px-4 py-3 text-gray-600">BloombergNEF 2024</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Water Infrastructure */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {language === 'en' ? 'Water Infrastructure' : 'Infraestructura Hídrica'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      {language === 'en' ? 'Item' : 'Artículo'}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      {language === 'en' ? 'Unit Cost' : 'Costo Unitario'}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      {language === 'en' ? 'Source' : 'Fuente'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3">
                      {language === 'en' ? 'Water Treatment Plant' : 'Planta de Tratamiento de Agua'}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      ${(EL_SALVADOR_ECONOMICS.infrastructure.water_treatment_cost_per_100k_m3 / 1_000_000).toFixed(1)}M per 100k m³/day
                    </td>
                    <td className="px-4 py-3 text-gray-600">WHO, World Bank</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3">
                      {language === 'en' ? 'Distribution Pipes' : 'Tuberías de Distribución'}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      ${(EL_SALVADOR_ECONOMICS.infrastructure.pipes_cost_per_10km / 1_000_000).toFixed(1)}M per 10km
                    </td>
                    <td className="px-4 py-3 text-gray-600">IDB, ANDA</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3">
                      {language === 'en' ? 'Desalination Plant' : 'Planta Desalinizadora'}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      ${(EL_SALVADOR_ECONOMICS.infrastructure.desalination_cost_per_100k_m3 / 1_000_000).toFixed(1)}M per 100k m³/day
                    </td>
                    <td className="px-4 py-3 text-gray-600">UN-Habitat</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Agriculture Infrastructure */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {language === 'en' ? 'Agriculture Infrastructure' : 'Infraestructura Agrícola'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      {language === 'en' ? 'Item' : 'Artículo'}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      {language === 'en' ? 'Unit Cost' : 'Costo Unitario'}
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                      {language === 'en' ? 'Source' : 'Fuente'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3">
                      {language === 'en' ? 'Drip Irrigation System' : 'Sistema de Riego por Goteo'}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      ${EL_SALVADOR_ECONOMICS.infrastructure.drip_irrigation_cost_per_hectare.toLocaleString()}/hectare
                    </td>
                    <td className="px-4 py-3 text-gray-600">FAO, MAG</td>
                  </tr>
                  <tr className="border-b border-gray-100">
                    <td className="px-4 py-3">
                      {language === 'en' ? 'Sprinkler Irrigation System' : 'Sistema de Riego por Aspersión'}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      ${EL_SALVADOR_ECONOMICS.infrastructure.sprinkler_irrigation_cost_per_hectare.toLocaleString()}/hectare
                    </td>
                    <td className="px-4 py-3 text-gray-600">CIAT, CGIAR</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Section 2: Social & Economic Costs */}
        <section id="social" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-3xl mr-3">👥</span>
            {labels.socialCosts[language]}
          </h2>

          <div className="space-y-6">
            {/* Power Outages */}
            <div className="border-l-4 border-red-400 pl-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {language === 'en' ? 'Power Outage Costs' : 'Costos de Cortes de Energía'}
              </h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>
                  <strong>{language === 'en' ? 'Per Person Impact' : 'Impacto por Persona'}:</strong>{' '}
                  ${EL_SALVADOR_ECONOMICS.energy.cost_per_outage_hour_per_capita}/hour
                </li>
                <li>
                  <strong>{language === 'en' ? 'Business Impact' : 'Impacto en Negocios'}:</strong>{' '}
                  ${EL_SALVADOR_ECONOMICS.energy.business_cost_per_outage_hour}/hour per business
                </li>
                <li>
                  <strong>{language === 'en' ? 'Industrial Loss' : 'Pérdida Industrial'}:</strong>{' '}
                  ${EL_SALVADOR_ECONOMICS.energy.industrial_rate_usd_per_kwh}/kWh + productivity loss
                </li>
                <li>
                  <strong>{language === 'en' ? 'Methodology' : 'Metodología'}:</strong>{' '}
                  {language === 'en'
                    ? 'Based on lost wages, business revenue, food spoilage, and medical impacts'
                    : 'Basado en salarios perdidos, ingresos comerciales, deterioro de alimentos e impactos médicos'}
                </li>
                <li>
                  <strong>{language === 'en' ? 'Source' : 'Fuente'}:</strong> World Bank VoLL Studies 2023
                </li>
              </ul>
            </div>

            {/* Water Shortages */}
            <div className="border-l-4 border-blue-400 pl-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {language === 'en' ? 'Water Shortage Costs' : 'Costos de Escasez de Agua'}
              </h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>
                  <strong>{language === 'en' ? 'Health Impact' : 'Impacto en Salud'}:</strong>{' '}
                  ${EL_SALVADOR_ECONOMICS.water.health_cost_per_shortage_day_per_capita}/person/day
                </li>
                <li>
                  <strong>{language === 'en' ? 'Time Cost' : 'Costo de Tiempo'}:</strong>{' '}
                  ${EL_SALVADOR_ECONOMICS.water.time_cost_per_shortage_day_per_capita}/person/day (travel to alternative sources)
                </li>
                <li>
                  <strong>{language === 'en' ? 'Industrial Impact' : 'Impacto Industrial'}:</strong>{' '}
                  ${EL_SALVADOR_ECONOMICS.water.industrial_rate_usd_per_m3}/m³ unmet demand
                </li>
                <li>
                  <strong>{language === 'en' ? 'Methodology' : 'Metodología'}:</strong>{' '}
                  {language === 'en'
                    ? 'Includes medical costs, time spent fetching water, crop losses, and livestock impacts'
                    : 'Incluye costos médicos, tiempo dedicado a buscar agua, pérdidas de cultivos e impactos en el ganado'}
                </li>
                <li>
                  <strong>{language === 'en' ? 'Source' : 'Fuente'}:</strong> WHO, UNICEF WaSH Studies
                </li>
              </ul>
            </div>

            {/* Crop Losses */}
            <div className="border-l-4 border-green-400 pl-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {language === 'en' ? 'Agricultural Losses' : 'Pérdidas Agrícolas'}
              </h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>
                  <strong>{language === 'en' ? 'Coffee' : 'Café'}:</strong>{' '}
                  ${EL_SALVADOR_ECONOMICS.agriculture.coffee_price_per_kg}/kg
                </li>
                <li>
                  <strong>{language === 'en' ? 'Corn' : 'Maíz'}:</strong>{' '}
                  ${EL_SALVADOR_ECONOMICS.agriculture.corn_price_per_kg}/kg
                </li>
                <li>
                  <strong>{language === 'en' ? 'Beans' : 'Frijoles'}:</strong>{' '}
                  ${EL_SALVADOR_ECONOMICS.agriculture.beans_price_per_kg}/kg
                </li>
                <li>
                  <strong>{language === 'en' ? 'Sugar Cane' : 'Caña de Azúcar'}:</strong>{' '}
                  ${EL_SALVADOR_ECONOMICS.agriculture.sugarcane_price_per_kg}/kg
                </li>
                <li>
                  <strong>{language === 'en' ? 'Economic Multiplier' : 'Multiplicador Económico'}:</strong>{' '}
                  {EL_SALVADOR_ECONOMICS.agriculture.gdp_multiplier}x (indirect GDP impact)
                </li>
                <li>
                  <strong>{language === 'en' ? 'Source' : 'Fuente'}:</strong> MAG, FAO Price Database
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3: Economic Constants */}
        <section id="constants" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-3xl mr-3">📊</span>
            {labels.economicConstants[language]}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Population */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">
                {language === 'en' ? 'Population' : 'Población'}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Total:</span>
                  <span className="font-semibold text-gray-900">
                    {EL_SALVADOR_ECONOMICS.population.total.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Urban:</span>
                  <span className="font-semibold text-gray-900">
                    73%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Rural:</span>
                  <span className="font-semibold text-gray-900">
                    27%
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">Source: World Bank 2024</p>
              </div>
            </div>

            {/* GDP */}
            <div className="bg-green-50 rounded-lg p-6 border border-green-200">
              <h3 className="text-lg font-semibold text-green-900 mb-4">
                {language === 'en' ? 'GDP' : 'PIB'}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Total:</span>
                  <span className="font-semibold text-gray-900">
                    ${(EL_SALVADOR_ECONOMICS.gdp.total_usd / 1_000_000_000).toFixed(1)}B
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Per Capita:</span>
                  <span className="font-semibold text-gray-900">
                    ${EL_SALVADOR_ECONOMICS.gdp.per_capita_usd.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Agriculture:</span>
                  <span className="font-semibold text-gray-900">
                    {(EL_SALVADOR_ECONOMICS.gdp.agriculture_share * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">Source: IMF World Economic Outlook 2024</p>
              </div>
            </div>

            {/* Discount Rate */}
            <div className="bg-purple-50 rounded-lg p-6 border border-purple-200">
              <h3 className="text-lg font-semibold text-purple-900 mb-4">
                {language === 'en' ? 'Financial Parameters' : 'Parámetros Financieros'}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Discount Rate:</span>
                  <span className="font-semibold text-gray-900">
                    {(EL_SALVADOR_ECONOMICS.discount_rate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Analysis Period:</span>
                  <span className="font-semibold text-gray-900">5 years</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Delay Cost:</span>
                  <span className="font-semibold text-gray-900">2%/month</span>
                </div>
                <p className="text-xs text-gray-600 mt-2">Source: BCR, Infrastructure Best Practices</p>
              </div>
            </div>

            {/* Energy Rates */}
            <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
              <h3 className="text-lg font-semibold text-yellow-900 mb-4">
                {language === 'en' ? 'Energy Rates' : 'Tarifas Energéticas'}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-700">Residential:</span>
                  <span className="font-semibold text-gray-900">
                    ${EL_SALVADOR_ECONOMICS.energy.residential_rate_usd_per_kwh}/kWh
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Industrial:</span>
                  <span className="font-semibold text-gray-900">
                    ${EL_SALVADOR_ECONOMICS.energy.industrial_rate_usd_per_kwh}/kWh
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Avg Consumption:</span>
                  <span className="font-semibold text-gray-900">
                    {EL_SALVADOR_ECONOMICS.energy.avg_household_consumption_kwh_monthly.toLocaleString()} kWh/month
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-2">Source: CEL, SIGET 2024</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Financial Metrics & Formulas */}
        <section id="metrics" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-3xl mr-3">🧮</span>
            {labels.financialMetrics[language]}
          </h2>

          <div className="space-y-8">
            {/* ROI Formula */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                {language === 'en' ? 'Return on Investment (ROI)' : 'Retorno de Inversión (ROI)'}
              </h3>
              <div className="bg-gray-50 rounded-lg p-6 font-mono text-sm border border-gray-200">
                <div className="mb-4">
                  <div className="text-gray-700 mb-2">ROI = (Total NPV Benefits - Investment) / Investment</div>
                  <div className="text-gray-700">
                    NPV = Σ (Annual Benefits / (1 + discount_rate)^year)
                  </div>
                </div>
                <p className="text-xs text-gray-600 font-sans">
                  {language === 'en'
                    ? 'Uses Net Present Value (NPV) to account for time value of money with 5% discount rate'
                    : 'Utiliza Valor Presente Neto (VPN) para contabilizar el valor del dinero en el tiempo con tasa de descuento del 5%'}
                </p>
              </div>
            </div>

            {/* Payback Period */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                {language === 'en' ? 'Payback Period' : 'Período de Recuperación'}
              </h3>
              <div className="bg-gray-50 rounded-lg p-6 font-mono text-sm border border-gray-200">
                <div className="mb-4">
                  <div className="text-gray-700 mb-2">
                    Payback Period (months) = (Investment / Annual Savings) × 12
                  </div>
                  <div className="text-gray-700">Capped at 60 months maximum</div>
                </div>
                <p className="text-xs text-gray-600 font-sans">
                  {language === 'en'
                    ? 'Time required to recover initial investment from cumulative savings'
                    : 'Tiempo requerido para recuperar la inversión inicial de ahorros acumulados'}
                </p>
              </div>
            </div>

            {/* Opportunity Cost */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                {language === 'en' ? 'Opportunity Cost of Delay' : 'Costo de Oportunidad del Retraso'}
              </h3>
              <div className="bg-gray-50 rounded-lg p-6 font-mono text-sm border border-gray-200">
                <div className="mb-4">
                  <div className="text-gray-700 mb-2">
                    Opportunity Cost = Annual Savings × Delay Months × 0.02
                  </div>
                  <div className="text-gray-700">Compounds at 2% per month</div>
                </div>
                <p className="text-xs text-gray-600 font-sans">
                  {language === 'en'
                    ? 'Cost of delaying infrastructure investment, including continued losses and escalating problems'
                    : 'Costo de retrasar la inversión en infraestructura, incluidas pérdidas continuas y problemas crecientes'}
                </p>
              </div>
            </div>

            {/* Cost of Inaction */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                {language === 'en' ? 'Cost of Inaction (5-Year)' : 'Costo de Inacción (5 Años)'}
              </h3>
              <div className="bg-gray-50 rounded-lg p-6 font-mono text-sm border border-gray-200">
                <div className="mb-4">
                  <div className="text-gray-700 mb-2">
                    Cost of Inaction = Σ (Annual Costs × 1.05^year) for 5 years
                  </div>
                  <div className="text-gray-700">Assumes 5% annual escalation</div>
                </div>
                <p className="text-xs text-gray-600 font-sans">
                  {language === 'en'
                    ? 'Total economic losses over 5 years if no action is taken, with escalating severity'
                    : 'Pérdidas económicas totales en 5 años si no se toma acción, con severidad creciente'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 5: Methodology */}
        <section id="methodology" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-3xl mr-3">🔬</span>
            {labels.methodology[language]}
          </h2>

          <div className="space-y-6 text-sm text-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {language === 'en' ? '1. Infrastructure Investment Calculation' : '1. Cálculo de Inversión en Infraestructura'}
              </h3>
              <p className="mb-2">
                {language === 'en'
                  ? 'Infrastructure needs are calculated based on stress levels in each simulation:'
                  : 'Las necesidades de infraestructura se calculan según los niveles de estrés en cada simulación:'}
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  {language === 'en'
                    ? 'Regions with stress >0.6 require intervention'
                    : 'Regiones con estrés >0.6 requieren intervención'}
                </li>
                <li>
                  {language === 'en'
                    ? 'Investment scales linearly with stress levels >0.6'
                    : 'La inversión escala linealmente con niveles de estrés >0.6'}
                </li>
                <li>
                  {language === 'en'
                    ? 'Regional population weights determine priority'
                    : 'Los pesos poblacionales regionales determinan la prioridad'}
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {language === 'en' ? '2. Social Cost Aggregation' : '2. Agregación de Costos Sociales'}
              </h3>
              <p className="mb-2">
                {language === 'en'
                  ? 'Social costs are summed across all affected individuals over the simulation period:'
                  : 'Los costos sociales se suman en todos los individuos afectados durante el período de simulación:'}
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  {language === 'en'
                    ? 'Daily costs per person multiplied by affected population'
                    : 'Costos diarios por persona multiplicados por población afectada'}
                </li>
                <li>
                  {language === 'en'
                    ? 'Economic multipliers applied for indirect effects'
                    : 'Multiplicadores económicos aplicados para efectos indirectos'}
                </li>
                <li>
                  {language === 'en'
                    ? 'Healthcare, productivity, and time costs included'
                    : 'Costos de salud, productividad y tiempo incluidos'}
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {language === 'en' ? '3. Economic Exposure Assessment' : '3. Evaluación de Exposición Económica'}
              </h3>
              <p>
                {language === 'en'
                  ? 'Total economic exposure represents the sum of all at-risk economic activity, including affected population economic output, sectoral GDP contribution, and infrastructure asset values.'
                  : 'La exposición económica total representa la suma de toda la actividad económica en riesgo, incluida la producción económica de la población afectada, la contribución sectorial al PIB y los valores de activos de infraestructura.'}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                {language === 'en' ? '4. Validation & Limitations' : '4. Validación y Limitaciones'}
              </h3>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="mb-2 font-semibold text-yellow-900">
                  {language === 'en' ? 'Known Limitations:' : 'Limitaciones Conocidas:'}
                </p>
                <ul className="list-disc pl-6 space-y-1 text-yellow-800">
                  <li>
                    {language === 'en'
                      ? 'Assumes linear relationships in many calculations'
                      : 'Asume relaciones lineales en muchos cálculos'}
                  </li>
                  <li>
                    {language === 'en'
                      ? 'Does not model second-order economic effects'
                      : 'No modela efectos económicos de segundo orden'}
                  </li>
                  <li>
                    {language === 'en'
                      ? 'Regional data may have varying accuracy levels'
                      : 'Los datos regionales pueden tener niveles variables de precisión'}
                  </li>
                  <li>
                    {language === 'en'
                      ? 'Market dynamics and policy changes not included'
                      : 'Dinámicas de mercado y cambios de política no incluidos'}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: References */}
        <section id="references" className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <span className="text-3xl mr-3">📚</span>
            {labels.references[language]}
          </h2>

          <div className="space-y-4 text-sm">
            <div className="border-l-4 border-blue-400 pl-4">
              <h4 className="font-semibold text-gray-800">International Organizations</h4>
              <ul className="mt-2 space-y-1 text-gray-700">
                <li>• World Bank - Infrastructure Cost Database 2024</li>
                <li>• Inter-American Development Bank (IDB) - Latin America Infrastructure Studies</li>
                <li>• International Monetary Fund (IMF) - World Economic Outlook 2024</li>
                <li>• World Health Organization (WHO) - Water & Sanitation Economics</li>
                <li>• Food and Agriculture Organization (FAO) - Crop Price Database</li>
                <li>• United Nations Habitat - Water Infrastructure Guidelines</li>
              </ul>
            </div>

            <div className="border-l-4 border-green-400 pl-4">
              <h4 className="font-semibold text-gray-800">Energy & Climate</h4>
              <ul className="mt-2 space-y-1 text-gray-700">
                <li>• International Renewable Energy Agency (IRENA) - Renewable Cost Database 2024</li>
                <li>• National Renewable Energy Laboratory (NREL) - Solar & Battery Costs</li>
                <li>• BloombergNEF - Energy Storage Market Outlook 2024</li>
                <li>• International Energy Agency (IEA) - Value of Lost Load Studies</li>
              </ul>
            </div>

            <div className="border-l-4 border-yellow-400 pl-4">
              <h4 className="font-semibold text-gray-800">
                {language === 'en' ? 'El Salvador Government Sources' : 'Fuentes Gubernamentales de El Salvador'}
              </h4>
              <ul className="mt-2 space-y-1 text-gray-700">
                <li>• Banco Central de Reserva (BCR) - Economic Statistics</li>
                <li>• Ministerio de Agricultura y Ganadería (MAG) - Agricultural Data</li>
                <li>• Comisión Ejecutiva Hidroeléctrica del Río Lempa (CEL) - Energy Data</li>
                <li>• Superintendencia General de Electricidad y Telecomunicaciones (SIGET) - Tariffs</li>
                <li>• Administración Nacional de Acueductos y Alcantarillados (ANDA) - Water Data</li>
              </ul>
            </div>

            <div className="border-l-4 border-purple-400 pl-4">
              <h4 className="font-semibold text-gray-800">Academic & Research</h4>
              <ul className="mt-2 space-y-1 text-gray-700">
                <li>• CGIAR - Climate-Smart Agriculture Research</li>
                <li>• Centro Internacional de Agricultura Tropical (CIAT) - Crop Studies</li>
                <li>• Various peer-reviewed studies on infrastructure economics</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 bg-gray-50 rounded-lg p-6 border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-2">
              {language === 'en' ? 'Data Access & Transparency' : 'Acceso a Datos y Transparencia'}
            </h4>
            <p className="text-sm text-gray-700">
              {language === 'en'
                ? 'All data sources are publicly accessible. For detailed citations, methodology papers, or to request underlying datasets, contact: '
                : 'Todas las fuentes de datos son de acceso público. Para citas detalladas, documentos de metodología o solicitar conjuntos de datos subyacentes, contacte: '}
              <a href="mailto:data@worldsim.org" className="text-blue-600 hover:underline">
                data@worldsim.org
              </a>
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-gray-500">
          <p>
            {language === 'en'
              ? 'WorldSim Policy Flight Simulator • Version 1.0 • Last Updated 2025-10-30'
              : 'Simulador de Vuelo de Políticas WorldSim • Versión 1.0 • Última Actualización 2025-10-30'}
          </p>
          <p className="mt-2">
            {language === 'en'
              ? 'Built for transparency, designed for impact'
              : 'Construido para transparencia, diseñado para impacto'}
          </p>
        </footer>
      </div>
    </div>
  );
}
