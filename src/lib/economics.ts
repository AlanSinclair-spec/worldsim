/**
 * Economic Cost Calculations Engine for WorldSim
 *
 * Provides comprehensive financial analysis for Energy, Water, and Agriculture
 * simulations across El Salvador's 14 departments.
 *
 * Features:
 * - Infrastructure investment calculations
 * - Social and economic cost modeling
 * - ROI, NPV, and payback period calculations
 * - Opportunity cost analysis
 * - Integrated economic impact assessment
 *
 * All costs in USD. Data sources cited in /assumptions page.
 */

/**
 * El Salvador Economic Constants
 *
 * Sources:
 * - DIGESTYC Census 2023 (population)
 * - Central Reserve Bank Annual Report 2023 (GDP)
 * - CEL Tariff Schedule 2024 (energy rates)
 * - ANDA Rate Structure 2024 (water rates)
 * - MAG Agricultural Statistics 2023 (agriculture)
 */
export const EL_SALVADOR_ECONOMICS = {
  population: {
    total: 6_300_000,
    by_region: {
      'San Salvador': 1_800_000,
      'La Libertad': 750_000,
      'Santa Ana': 550_000,
      'San Miguel': 520_000,
      'Sonsonate': 480_000,
      'La Paz': 340_000,
      'Usulután': 370_000,
      'Chalatenango': 220_000,
      'Cuscatlán': 250_000,
      'Ahuachapán': 340_000,
      'Morazán': 190_000,
      'La Unión': 270_000,
      'San Vicente': 180_000,
      'Cabañas': 160_000
    }
  },
  gdp: {
    total_usd: 32_000_000_000, // $32 billion
    per_capita_usd: 5_079,
    agriculture_share: 0.12, // 12%
    industry_share: 0.27,    // 27%
    services_share: 0.61     // 61%
  },
  energy: {
    avg_household_consumption_kwh_monthly: 200,
    industrial_rate_usd_per_kwh: 0.15,
    residential_rate_usd_per_kwh: 0.12,
    avg_households_per_region: 50_000,
    cost_per_outage_hour_per_capita: 5.00, // Productivity loss
    business_cost_per_outage_hour: 50.00    // Per business (1 per 50 people)
  },
  water: {
    avg_household_consumption_m3_monthly: 15,
    industrial_rate_usd_per_m3: 1.50,
    residential_rate_usd_per_m3: 0.80,
    health_cost_per_shortage_day_per_capita: 10.00, // Waterborne disease risk
    time_cost_per_shortage_day_per_capita: 6.00     // 2 hours @ $3/hr to find water
  },
  agriculture: {
    total_hectares: 1_200_000,
    coffee_hectares: 150_000,
    sugarcane_hectares: 80_000,
    corn_hectares: 300_000,
    beans_hectares: 100_000,
    coffee_price_per_kg: 2.50,
    sugarcane_price_per_kg: 0.08,
    corn_price_per_kg: 0.40,
    beans_price_per_kg: 1.20,
    gdp_multiplier: 1.3 // Each $1 lost in ag affects $1.30 in economy
  },
  labor: {
    avg_hourly_wage_usd: 3.00,
    unemployment_rate: 0.07
  },
  infrastructure: {
    solar_cost_per_kw: 1_200,              // $1,200 per kW installed capacity
    grid_upgrade_base_cost_per_region: 2_000_000, // $2M per region for 10% upgrade
    remote_region_multiplier: 1.5,         // Remote regions cost 50% more
    water_treatment_cost_per_100k_m3: 5_000_000,
    desalination_cost_per_100k_m3: 10_000_000,
    pipes_cost_per_10km: 1_000_000,
    drip_irrigation_cost_per_hectare: 3_000,
    sprinkler_irrigation_cost_per_hectare: 2_000,
    annual_maintenance_rate: 0.05          // 5% of installation cost annually
  },
  discount_rate: 0.05, // 5% for government infrastructure projects
  opportunity_cost_monthly_compound_rate: 0.02 // 2% per month for delays
} as const;

/**
 * Remote regions that have higher infrastructure costs
 * due to difficult terrain and distance from urban centers
 */
const REMOTE_REGIONS = ['Morazán', 'La Unión', 'Cabañas', 'Chalatenango'];

/**
 * Get population for a given region
 */
function getRegionPopulation(region: string): number {
  return EL_SALVADOR_ECONOMICS.population.by_region[region as keyof typeof EL_SALVADOR_ECONOMICS.population.by_region] || 0;
}

// ═══════════════════════════════════════════════════════════════════
// INFRASTRUCTURE INVESTMENT CALCULATIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate cost to install solar panel capacity
 *
 * Based on World Bank Energy Sector Assessment 2024
 * Cost: $1,200 per kW = $1.2M per MW
 *
 * @param capacity_mw - Megawatts of solar capacity to install
 * @returns Total investment cost in USD
 */
export function calculateSolarInvestment(capacity_mw: number): number {
  const cost_per_mw = EL_SALVADOR_ECONOMICS.infrastructure.solar_cost_per_kw * 1000;
  return capacity_mw * cost_per_mw;
}

/**
 * Calculate cost to upgrade electrical grid capacity
 *
 * Based on CEL Infrastructure Development Plan 2023-2030
 * Base cost: $2M per region for 10% capacity increase
 * Remote regions (difficult terrain): 1.5x multiplier
 *
 * @param region - Region name
 * @param capacity_increase_pct - Percentage increase in capacity (e.g., 20 for 20%)
 * @returns Total upgrade cost in USD
 */
export function calculateGridUpgrade(region: string, capacity_increase_pct: number): number {
  const base_cost_per_10pct = EL_SALVADOR_ECONOMICS.infrastructure.grid_upgrade_base_cost_per_region;
  const scaling_factor = capacity_increase_pct / 10;

  // Remote regions cost 1.5x more
  const location_multiplier = REMOTE_REGIONS.includes(region)
    ? EL_SALVADOR_ECONOMICS.infrastructure.remote_region_multiplier
    : 1.0;

  return base_cost_per_10pct * scaling_factor * location_multiplier;
}

/**
 * Calculate cost for water infrastructure projects
 *
 * Based on ANDA Capital Investment Analysis 2024
 * - Treatment plant: $5M per 100,000 m³/day
 * - Desalination: $10M per 100,000 m³/day
 * - Pipes: $1M per 10km
 *
 * @param type - Infrastructure type
 * @param capacity_or_length - Capacity in m³/day or length in km
 * @returns Total infrastructure cost in USD
 */
export function calculateWaterInfrastructure(
  type: 'treatment' | 'desalination' | 'pipes',
  capacity_or_length: number
): number {
  const costs = {
    treatment: EL_SALVADOR_ECONOMICS.infrastructure.water_treatment_cost_per_100k_m3,
    desalination: EL_SALVADOR_ECONOMICS.infrastructure.desalination_cost_per_100k_m3,
    pipes: EL_SALVADOR_ECONOMICS.infrastructure.pipes_cost_per_10km
  };

  if (type === 'pipes') {
    return costs[type] * (capacity_or_length / 10); // Per 10km
  }

  return costs[type] * (capacity_or_length / 100_000); // Per 100k m³/day
}

/**
 * Calculate cost to install modern irrigation systems
 *
 * Based on MAG Agricultural Modernization Report
 * - Drip irrigation: $3,000/hectare (more efficient, higher cost)
 * - Sprinkler irrigation: $2,000/hectare (less efficient, lower cost)
 * - Annual maintenance: 5% of installation cost
 *
 * @param hectares - Number of hectares to irrigate
 * @param system_type - Type of irrigation system
 * @returns Total 5-year cost (installation + maintenance) in USD
 */
export function calculateIrrigationSystem(
  hectares: number,
  system_type: 'drip' | 'sprinkler' = 'drip'
): number {
  const costs = {
    drip: EL_SALVADOR_ECONOMICS.infrastructure.drip_irrigation_cost_per_hectare,
    sprinkler: EL_SALVADOR_ECONOMICS.infrastructure.sprinkler_irrigation_cost_per_hectare
  };

  const installation = hectares * costs[system_type];
  const annual_maintenance = installation * EL_SALVADOR_ECONOMICS.infrastructure.annual_maintenance_rate;

  // Return 5-year total cost
  return installation + (annual_maintenance * 5);
}

// ═══════════════════════════════════════════════════════════════════
// SOCIAL & ECONOMIC COST CALCULATIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate economic cost of power outages
 *
 * Includes:
 * - Lost productivity ($5 per person per hour)
 * - Business losses ($50 per business per hour, 1 business per 50 people)
 * - Health impacts for extended outages (>4 hours)
 *
 * @param population - Affected population
 * @param outage_hours_per_year - Total hours of outages annually
 * @returns Total annual cost in USD
 */
export function calculatePowerOutageCost(
  population: number,
  outage_hours_per_year: number
): number {
  // Lost productivity
  const productivity_loss = population *
    EL_SALVADOR_ECONOMICS.energy.cost_per_outage_hour_per_capita *
    outage_hours_per_year;

  // Business losses (1 business per 50 people)
  const businesses = population / 50;
  const business_loss = businesses *
    EL_SALVADOR_ECONOMICS.energy.business_cost_per_outage_hour *
    outage_hours_per_year;

  // Health impacts for extended outages (>4 hours cumulative)
  const extended_outage_impact = outage_hours_per_year > 4
    ? population * 2
    : 0;

  return productivity_loss + business_loss + extended_outage_impact;
}

/**
 * Calculate economic cost of water shortages
 *
 * Includes:
 * - Health costs ($10/person/day - waterborne disease risk)
 * - Time cost (2 hours/day @ $3/hr to find alternative water sources)
 *
 * @param population - Affected population
 * @param shortage_days_per_year - Total days with water shortages annually
 * @returns Total annual cost in USD
 */
export function calculateWaterShortageCost(
  population: number,
  shortage_days_per_year: number
): number {
  // Health costs (waterborne disease risk)
  const health_costs = population *
    EL_SALVADOR_ECONOMICS.water.health_cost_per_shortage_day_per_capita *
    shortage_days_per_year;

  // Time cost (2 hours/day to find water @ $3/hr wage)
  const time_costs = population *
    EL_SALVADOR_ECONOMICS.water.time_cost_per_shortage_day_per_capita *
    shortage_days_per_year;

  return health_costs + time_costs;
}

/**
 * Calculate economic loss from crop yield reductions
 *
 * Includes:
 * - Direct market value loss
 * - GDP multiplier effect (agriculture = 12% of GDP, ripple effects)
 *
 * @param yield_reduction_kg - Kilograms of crop lost
 * @param crop_type - Type of crop
 * @returns Total economic loss in USD
 */
export function calculateCropLoss(
  yield_reduction_kg: number,
  crop_type: string
): number {
  const price_map: Record<string, number> = {
    coffee: EL_SALVADOR_ECONOMICS.agriculture.coffee_price_per_kg,
    sugar_cane: EL_SALVADOR_ECONOMICS.agriculture.sugarcane_price_per_kg,
    corn: EL_SALVADOR_ECONOMICS.agriculture.corn_price_per_kg,
    beans: EL_SALVADOR_ECONOMICS.agriculture.beans_price_per_kg
  };

  const direct_loss = yield_reduction_kg * (price_map[crop_type] || 0);

  // GDP multiplier: Each dollar lost in agriculture affects $1.30 in economy
  const total_loss = direct_loss * EL_SALVADOR_ECONOMICS.agriculture.gdp_multiplier;

  return total_loss;
}

// ═══════════════════════════════════════════════════════════════════
// FINANCIAL METRICS & ROI CALCULATIONS
// ═══════════════════════════════════════════════════════════════════

/**
 * Calculate Return on Investment (ROI) using NPV method
 *
 * Uses discount rate to account for time value of money.
 * Formula: ROI = (NPV of benefits - Investment) / Investment
 *
 * @param investment - Initial investment in USD
 * @param annual_benefits - Annual benefits/savings in USD
 * @param years - Number of years to calculate over
 * @param discount_rate - Discount rate (default 5% for government projects)
 * @returns ROI as decimal (e.g., 4.2 means 420% return or 4.2x)
 */
export function calculateROI(
  investment: number,
  annual_benefits: number,
  years: number,
  discount_rate: number = EL_SALVADOR_ECONOMICS.discount_rate
): number {
  if (investment === 0) return 0;

  let total_benefits = 0;
  for (let year = 1; year <= years; year++) {
    total_benefits += annual_benefits / Math.pow(1 + discount_rate, year);
  }

  return (total_benefits - investment) / investment;
}

/**
 * Calculate payback period in months
 *
 * Simple payback calculation without discounting.
 * Returns time to recover initial investment.
 *
 * @param investment - Initial investment in USD
 * @param annual_savings - Annual savings/benefits in USD
 * @returns Payback period in months
 */
export function calculatePaybackPeriod(
  investment: number,
  annual_savings: number
): number {
  if (annual_savings === 0) return Infinity;
  return (investment / annual_savings) * 12;
}

/**
 * Calculate Net Present Value (NPV)
 *
 * NPV accounts for time value of money using discount rate.
 * Positive NPV indicates project adds value.
 *
 * Formula: NPV = -Investment + Σ(Cashflow_t / (1 + r)^t)
 *
 * @param investment - Initial investment in USD
 * @param annual_cashflows - Array of annual cashflows
 * @param discount_rate - Discount rate (default 5%)
 * @returns Net Present Value in USD
 */
export function calculateNPV(
  investment: number,
  annual_cashflows: number[],
  discount_rate: number = EL_SALVADOR_ECONOMICS.discount_rate
): number {
  let npv = -investment;

  annual_cashflows.forEach((cashflow, index) => {
    npv += cashflow / Math.pow(1 + discount_rate, index + 1);
  });

  return npv;
}

/**
 * Calculate opportunity cost of project delays
 *
 * Cost compounds at 2% per month as problems worsen.
 * Models escalating costs of infrastructure stress.
 *
 * @param delayed_months - Number of months delayed
 * @param monthly_loss - Monthly economic loss in USD
 * @returns Total opportunity cost in USD
 */
export function calculateOpportunityCost(
  delayed_months: number,
  monthly_loss: number
): number {
  const compound_rate = EL_SALVADOR_ECONOMICS.opportunity_cost_monthly_compound_rate;

  let total_cost = 0;
  for (let month = 1; month <= delayed_months; month++) {
    total_cost += monthly_loss * Math.pow(1 + compound_rate, month - 1);
  }

  return total_cost;
}

// ═══════════════════════════════════════════════════════════════════
// INTEGRATED ECONOMIC ANALYSIS
// ═══════════════════════════════════════════════════════════════════

/**
 * Economic Analysis Result Interface
 *
 * Standardized output for all simulation types
 */
export interface EconomicAnalysis {
  /** Total infrastructure investment needed (USD) */
  infrastructure_investment_usd: number;

  /** Annual savings from investment (USD/year) */
  annual_savings_usd: number;

  /** Annual costs prevented by taking action (USD/year) */
  annual_costs_prevented_usd: number;

  /** Return on Investment over 5 years (as multiplier, e.g. 4.2x) */
  roi_5_year: number;

  /** Time to recover investment (months) */
  payback_period_months: number;

  /** Net Present Value of investment (USD) */
  net_present_value_usd: number;

  /** Cost of delaying action by 6 months (USD) */
  opportunity_cost_6mo_delay_usd: number;

  /** Total economic exposure if no action taken (USD) */
  total_economic_exposure_usd: number;

  /** Cumulative cost of inaction over 5 years (USD) */
  cost_of_inaction_5_year_usd: number;
}

/**
 * Stressed Region Interface
 */
interface StressedRegion {
  region: string;
  population: number;
  stress_level: number; // 0-1
}

/**
 * Calculate comprehensive economic impact for energy simulations
 */
function calculateEnergyEconomics(
  stressed_regions: StressedRegion[],
  scenario_params: any
): EconomicAnalysis {
  // Calculate infrastructure needs based on stress levels
  let total_investment = 0;
  let annual_outage_costs = 0;

  for (const region of stressed_regions) {
    const { region: region_name, population, stress_level } = region;

    // High stress (>0.6) requires grid upgrade
    if (stress_level > 0.6) {
      const capacity_increase = (stress_level - 0.5) * 100; // Percentage
      total_investment += calculateGridUpgrade(region_name, capacity_increase);
    }

    // Calculate outage costs (stress level maps to hours)
    const outage_hours_per_year = stress_level * 100; // 0-100 hours/year
    annual_outage_costs += calculatePowerOutageCost(population, outage_hours_per_year);
  }

  // Add solar investment if scenario specifies
  if (scenario_params.solar_growth_pct > 0) {
    const solar_capacity_mw = (scenario_params.solar_growth_pct / 100) * 500; // 500 MW baseline
    total_investment += calculateSolarInvestment(solar_capacity_mw);
  }

  // Calculate financial metrics
  const annual_savings = annual_outage_costs * 0.8; // 80% reduction in outages
  const roi_5_year = calculateROI(total_investment, annual_savings, 5);
  const payback_period_months = calculatePaybackPeriod(total_investment, annual_savings);
  const npv = calculateNPV(total_investment, Array(5).fill(annual_savings));
  const opportunity_cost = calculateOpportunityCost(6, annual_outage_costs / 12);
  const cost_of_inaction_5_year = annual_outage_costs * 5 * 1.1; // 10% escalation

  return {
    infrastructure_investment_usd: Math.round(total_investment),
    annual_savings_usd: Math.round(annual_savings),
    annual_costs_prevented_usd: Math.round(annual_outage_costs),
    roi_5_year: Math.round(roi_5_year * 10) / 10,
    payback_period_months: Math.round(payback_period_months),
    net_present_value_usd: Math.round(npv),
    opportunity_cost_6mo_delay_usd: Math.round(opportunity_cost),
    total_economic_exposure_usd: Math.round(annual_outage_costs),
    cost_of_inaction_5_year_usd: Math.round(cost_of_inaction_5_year)
  };
}

/**
 * Calculate comprehensive economic impact for water simulations
 */
function calculateWaterEconomics(
  stressed_regions: StressedRegion[],
  _scenario_params: any // Prefix with underscore to indicate intentionally unused
): EconomicAnalysis {
  let total_investment = 0;
  let annual_shortage_costs = 0;

  for (const region of stressed_regions) {
    const { population, stress_level } = region;

    // High stress requires infrastructure
    if (stress_level > 0.6) {
      // Calculate needed capacity (m³/day)
      const daily_capacity_needed = (population * 0.15) * stress_level; // 150L per person per day
      total_investment += calculateWaterInfrastructure('treatment', daily_capacity_needed);
    }

    // Calculate shortage costs
    const shortage_days_per_year = stress_level * 60; // 0-60 days/year
    annual_shortage_costs += calculateWaterShortageCost(population, shortage_days_per_year);
  }

  const annual_savings = annual_shortage_costs * 0.85; // 85% reduction
  const roi_5_year = calculateROI(total_investment, annual_savings, 5);
  const payback_period_months = calculatePaybackPeriod(total_investment, annual_savings);
  const npv = calculateNPV(total_investment, Array(5).fill(annual_savings));
  const opportunity_cost = calculateOpportunityCost(6, annual_shortage_costs / 12);
  const cost_of_inaction_5_year = annual_shortage_costs * 5 * 1.15; // 15% escalation

  return {
    infrastructure_investment_usd: Math.round(total_investment),
    annual_savings_usd: Math.round(annual_savings),
    annual_costs_prevented_usd: Math.round(annual_shortage_costs),
    roi_5_year: Math.round(roi_5_year * 10) / 10,
    payback_period_months: Math.round(payback_period_months),
    net_present_value_usd: Math.round(npv),
    opportunity_cost_6mo_delay_usd: Math.round(opportunity_cost),
    total_economic_exposure_usd: Math.round(annual_shortage_costs),
    cost_of_inaction_5_year_usd: Math.round(cost_of_inaction_5_year)
  };
}

/**
 * Calculate comprehensive economic impact for agriculture simulations
 */
function calculateAgricultureEconomics(
  stressed_regions: StressedRegion[],
  crop_losses: Record<string, number>
): EconomicAnalysis {
  // Calculate total crop losses
  let annual_crop_losses = 0;
  for (const [crop_type, loss_kg] of Object.entries(crop_losses)) {
    annual_crop_losses += calculateCropLoss(loss_kg, crop_type);
  }

  // Estimate hectares affected (simplified)
  const affected_hectares = Math.min(50_000, stressed_regions.length * 5_000);

  // Calculate irrigation investment
  const total_investment = calculateIrrigationSystem(affected_hectares, 'drip');

  const annual_savings = annual_crop_losses * 0.70; // 70% loss prevention
  const roi_5_year = calculateROI(total_investment, annual_savings, 5);
  const payback_period_months = calculatePaybackPeriod(total_investment, annual_savings);
  const npv = calculateNPV(total_investment, Array(5).fill(annual_savings));
  const opportunity_cost = calculateOpportunityCost(6, annual_crop_losses / 12);
  const cost_of_inaction_5_year = annual_crop_losses * 5 * 1.2; // 20% escalation

  return {
    infrastructure_investment_usd: Math.round(total_investment),
    annual_savings_usd: Math.round(annual_savings),
    annual_costs_prevented_usd: Math.round(annual_crop_losses),
    roi_5_year: Math.round(roi_5_year * 10) / 10,
    payback_period_months: Math.round(payback_period_months),
    net_present_value_usd: Math.round(npv),
    opportunity_cost_6mo_delay_usd: Math.round(opportunity_cost),
    total_economic_exposure_usd: Math.round(annual_crop_losses),
    cost_of_inaction_5_year_usd: Math.round(cost_of_inaction_5_year)
  };
}

/**
 * Master function: Calculate economic impact for any simulation type
 *
 * Analyzes stressed regions and scenario parameters to determine:
 * - Required infrastructure investment
 * - Economic costs of inaction
 * - ROI and financial metrics
 * - Opportunity costs of delays
 *
 * @param params - Simulation parameters
 * @returns Comprehensive economic analysis
 */
export function calculateEconomicImpact(params: {
  simulation_type: 'energy' | 'water' | 'agriculture';
  stressed_regions: StressedRegion[];
  scenario_params: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  crop_losses?: Record<string, number>;
}): EconomicAnalysis {
  const { simulation_type, stressed_regions, scenario_params, crop_losses } = params;

  // Add population data if missing
  const regions_with_population = stressed_regions.map(region => ({
    ...region,
    population: region.population || getRegionPopulation(region.region)
  }));

  switch (simulation_type) {
    case 'energy':
      return calculateEnergyEconomics(regions_with_population, scenario_params);

    case 'water':
      return calculateWaterEconomics(regions_with_population, scenario_params);

    case 'agriculture':
      return calculateAgricultureEconomics(regions_with_population, crop_losses || {});

    default:
      throw new Error(`Unknown simulation type: ${simulation_type}`);
  }
}
