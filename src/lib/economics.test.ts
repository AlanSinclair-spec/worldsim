/**
 * Unit Tests for Economic Cost Calculations
 *
 * Tests financial analysis functions for infrastructure investments:
 * - Infrastructure cost calculations (solar, grid, water, irrigation)
 * - Social and economic costs (outages, shortages, crop losses)
 * - ROI, NPV, and payback period calculations
 * - Integrated economic impact analysis
 *
 * @module lib/economics.test
 */

import {
  calculateSolarInvestment,
  calculateGridUpgrade,
  calculateWaterInfrastructure,
  calculateIrrigationSystem,
  calculatePowerOutageCost,
  calculateWaterShortageCost,
  calculateCropLoss,
  calculateROI,
  calculatePaybackPeriod,
  calculateNPV,
  calculateOpportunityCost,
  calculateEconomicImpact,
  EL_SALVADOR_ECONOMICS,
} from './economics';

// ═══════════════════════════════════════════════════════════════════
// INFRASTRUCTURE INVESTMENT CALCULATIONS
// ═══════════════════════════════════════════════════════════════════

describe('calculateSolarInvestment', () => {
  describe('Happy Path', () => {
    it('should calculate solar investment for 1 MW correctly', () => {
      const cost = calculateSolarInvestment(1);
      expect(cost).toBe(1_200_000); // $1,200 per kW * 1000 kW = $1.2M
    });

    it('should calculate solar investment for 100 MW correctly', () => {
      const cost = calculateSolarInvestment(100);
      expect(cost).toBe(120_000_000); // $120M
    });

    it('should calculate solar investment for fractional MW', () => {
      const cost = calculateSolarInvestment(0.5);
      expect(cost).toBe(600_000); // $600K
    });
  });

  describe('Edge Cases', () => {
    it('should return 0 for zero capacity', () => {
      const cost = calculateSolarInvestment(0);
      expect(cost).toBe(0);
    });

    it('should handle large capacity values', () => {
      const cost = calculateSolarInvestment(1000);
      expect(cost).toBe(1_200_000_000); // $1.2B
    });
  });
});

describe('calculateGridUpgrade', () => {
  describe('Happy Path', () => {
    it('should calculate 10% grid upgrade for non-remote region', () => {
      const cost = calculateGridUpgrade('San Salvador', 10);
      expect(cost).toBe(2_000_000); // Base cost for 10%
    });

    it('should calculate 20% grid upgrade for non-remote region', () => {
      const cost = calculateGridUpgrade('San Salvador', 20);
      expect(cost).toBe(4_000_000); // 2x base cost
    });

    it('should calculate 10% grid upgrade for remote region', () => {
      const cost = calculateGridUpgrade('Morazán', 10);
      expect(cost).toBe(3_000_000); // Base cost * 1.5 (remote multiplier)
    });

    it('should calculate 20% grid upgrade for remote region', () => {
      const cost = calculateGridUpgrade('Chalatenango', 20);
      expect(cost).toBe(6_000_000); // Base cost * 2 * 1.5
    });
  });

  describe('Remote Regions', () => {
    it('should apply 1.5x multiplier for Morazán', () => {
      const cost = calculateGridUpgrade('Morazán', 10);
      expect(cost).toBe(3_000_000);
    });

    it('should apply 1.5x multiplier for La Unión', () => {
      const cost = calculateGridUpgrade('La Unión', 10);
      expect(cost).toBe(3_000_000);
    });

    it('should apply 1.5x multiplier for Cabañas', () => {
      const cost = calculateGridUpgrade('Cabañas', 10);
      expect(cost).toBe(3_000_000);
    });

    it('should apply 1.5x multiplier for Chalatenango', () => {
      const cost = calculateGridUpgrade('Chalatenango', 10);
      expect(cost).toBe(3_000_000);
    });
  });

  describe('Edge Cases', () => {
    it('should return 0 for zero capacity increase', () => {
      const cost = calculateGridUpgrade('San Salvador', 0);
      expect(cost).toBe(0);
    });

    it('should handle fractional capacity increases', () => {
      const cost = calculateGridUpgrade('San Salvador', 5);
      expect(cost).toBe(1_000_000); // Half of base cost
    });

    it('should handle large capacity increases', () => {
      const cost = calculateGridUpgrade('San Salvador', 100);
      expect(cost).toBe(20_000_000); // 10x base cost
    });
  });
});

describe('calculateWaterInfrastructure', () => {
  describe('Treatment Plants', () => {
    it('should calculate cost for 100,000 m³/day treatment plant', () => {
      const cost = calculateWaterInfrastructure('treatment', 100_000);
      expect(cost).toBe(5_000_000); // $5M per 100k m³/day
    });

    it('should calculate cost for 200,000 m³/day treatment plant', () => {
      const cost = calculateWaterInfrastructure('treatment', 200_000);
      expect(cost).toBe(10_000_000); // $10M
    });

    it('should calculate cost for 50,000 m³/day treatment plant', () => {
      const cost = calculateWaterInfrastructure('treatment', 50_000);
      expect(cost).toBe(2_500_000); // $2.5M
    });
  });

  describe('Desalination Plants', () => {
    it('should calculate cost for 100,000 m³/day desalination', () => {
      const cost = calculateWaterInfrastructure('desalination', 100_000);
      expect(cost).toBe(10_000_000); // $10M per 100k m³/day
    });

    it('should calculate cost for 200,000 m³/day desalination', () => {
      const cost = calculateWaterInfrastructure('desalination', 200_000);
      expect(cost).toBe(20_000_000); // $20M
    });
  });

  describe('Pipes', () => {
    it('should calculate cost for 10 km of pipes', () => {
      const cost = calculateWaterInfrastructure('pipes', 10);
      expect(cost).toBe(1_000_000); // $1M per 10km
    });

    it('should calculate cost for 50 km of pipes', () => {
      const cost = calculateWaterInfrastructure('pipes', 50);
      expect(cost).toBe(5_000_000); // $5M
    });

    it('should calculate cost for 5 km of pipes', () => {
      const cost = calculateWaterInfrastructure('pipes', 5);
      expect(cost).toBe(500_000); // $500K
    });
  });
});

describe('calculateIrrigationSystem', () => {
  describe('Drip Irrigation', () => {
    it('should calculate 5-year cost for 1000 hectares of drip irrigation', () => {
      const cost = calculateIrrigationSystem(1000, 'drip');
      const installation = 1000 * 3000; // $3M
      const maintenance = installation * 0.05 * 5; // $750K
      expect(cost).toBe(installation + maintenance); // $3.75M
    });

    it('should calculate 5-year cost for 500 hectares of drip irrigation', () => {
      const cost = calculateIrrigationSystem(500, 'drip');
      expect(cost).toBe(1_875_000); // $1.875M
    });
  });

  describe('Sprinkler Irrigation', () => {
    it('should calculate 5-year cost for 1000 hectares of sprinkler irrigation', () => {
      const cost = calculateIrrigationSystem(1000, 'sprinkler');
      const installation = 1000 * 2000; // $2M
      const maintenance = installation * 0.05 * 5; // $500K
      expect(cost).toBe(installation + maintenance); // $2.5M
    });

    it('should calculate 5-year cost for 500 hectares of sprinkler irrigation', () => {
      const cost = calculateIrrigationSystem(500, 'sprinkler');
      expect(cost).toBe(1_250_000); // $1.25M
    });
  });

  describe('Edge Cases', () => {
    it('should return 0 for zero hectares', () => {
      const cost = calculateIrrigationSystem(0, 'drip');
      expect(cost).toBe(0);
    });

    it('should default to drip if system_type not specified', () => {
      const cost = calculateIrrigationSystem(1000);
      const dripCost = calculateIrrigationSystem(1000, 'drip');
      expect(cost).toBe(dripCost);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// SOCIAL & ECONOMIC COST CALCULATIONS
// ═══════════════════════════════════════════════════════════════════

describe('calculatePowerOutageCost', () => {
  describe('Happy Path', () => {
    it('should calculate outage cost for 100k people, 10 hours/year', () => {
      const population = 100_000;
      const outage_hours = 10;

      const productivity_loss = population * 5 * outage_hours; // $5/person/hour
      const business_loss = (population / 50) * 50 * outage_hours; // $50/business/hour
      const health_impact = population * 2; // Extended outage (>4 hours)
      const expected = productivity_loss + business_loss + health_impact;

      const cost = calculatePowerOutageCost(population, outage_hours);
      expect(cost).toBe(expected); // Includes health impact for >4 hours
    });

    it('should include health impacts for extended outages (>4 hours)', () => {
      const population = 100_000;
      const outage_hours = 10;

      const cost = calculatePowerOutageCost(population, outage_hours);
      expect(cost).toBeGreaterThan(5_000_000); // Includes health impact
    });

    it('should not include health impacts for short outages (≤4 hours)', () => {
      const population = 100_000;
      const outage_hours = 3;

      const productivity_loss = population * 5 * outage_hours;
      const business_loss = (population / 50) * 50 * outage_hours;
      const expected = productivity_loss + business_loss;

      const cost = calculatePowerOutageCost(population, outage_hours);
      expect(cost).toBe(expected); // No health impact
    });
  });

  describe('Edge Cases', () => {
    it('should return 0 for zero population', () => {
      const cost = calculatePowerOutageCost(0, 10);
      expect(cost).toBe(0);
    });

    it('should return 0 for zero outage hours', () => {
      const cost = calculatePowerOutageCost(100_000, 0);
      expect(cost).toBe(0);
    });

    it('should handle large populations', () => {
      const cost = calculatePowerOutageCost(1_000_000, 24);
      expect(cost).toBeGreaterThan(100_000_000); // >$100M
    });
  });
});

describe('calculateWaterShortageCost', () => {
  describe('Happy Path', () => {
    it('should calculate shortage cost for 100k people, 30 days/year', () => {
      const population = 100_000;
      const shortage_days = 30;

      const health_costs = population * 10 * shortage_days; // $10/person/day
      const time_costs = population * 6 * shortage_days; // $6/person/day
      const expected = health_costs + time_costs;

      const cost = calculateWaterShortageCost(population, shortage_days);
      expect(cost).toBe(expected); // $48M
    });

    it('should calculate shortage cost for 500k people, 60 days/year', () => {
      const cost = calculateWaterShortageCost(500_000, 60);
      expect(cost).toBe(480_000_000); // $480M
    });
  });

  describe('Edge Cases', () => {
    it('should return 0 for zero population', () => {
      const cost = calculateWaterShortageCost(0, 30);
      expect(cost).toBe(0);
    });

    it('should return 0 for zero shortage days', () => {
      const cost = calculateWaterShortageCost(100_000, 0);
      expect(cost).toBe(0);
    });
  });
});

describe('calculateCropLoss', () => {
  describe('Happy Path', () => {
    it('should calculate coffee crop loss correctly', () => {
      const yield_reduction_kg = 100_000;
      const direct_loss = 100_000 * 2.5; // $2.50/kg
      const expected = direct_loss * 1.3; // GDP multiplier

      const loss = calculateCropLoss(yield_reduction_kg, 'coffee');
      expect(loss).toBe(expected); // $325K
    });

    it('should calculate sugar cane crop loss correctly', () => {
      const yield_reduction_kg = 1_000_000;
      const direct_loss = 1_000_000 * 0.08; // $0.08/kg
      const expected = direct_loss * 1.3;

      const loss = calculateCropLoss(yield_reduction_kg, 'sugar_cane');
      expect(loss).toBe(expected); // $104K
    });

    it('should calculate corn crop loss correctly', () => {
      const loss = calculateCropLoss(100_000, 'corn');
      expect(loss).toBe(52_000); // $0.40/kg * 100k * 1.3
    });

    it('should calculate beans crop loss correctly', () => {
      const loss = calculateCropLoss(100_000, 'beans');
      expect(loss).toBe(156_000); // $1.20/kg * 100k * 1.3
    });
  });

  describe('Edge Cases', () => {
    it('should return 0 for unknown crop type', () => {
      const loss = calculateCropLoss(100_000, 'unknown_crop');
      expect(loss).toBe(0);
    });

    it('should return 0 for zero yield reduction', () => {
      const loss = calculateCropLoss(0, 'coffee');
      expect(loss).toBe(0);
    });

    it('should apply GDP multiplier of 1.3', () => {
      const direct_loss = 100_000 * 2.5;
      const loss = calculateCropLoss(100_000, 'coffee');
      expect(loss).toBe(direct_loss * 1.3);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// FINANCIAL METRICS & ROI CALCULATIONS
// ═══════════════════════════════════════════════════════════════════

describe('calculateROI', () => {
  describe('Happy Path', () => {
    it('should calculate 5-year ROI correctly', () => {
      const investment = 1_000_000;
      const annual_benefits = 300_000;
      const years = 5;

      const roi = calculateROI(investment, annual_benefits, years);
      expect(roi).toBeGreaterThan(0); // Positive ROI
      expect(roi).toBeCloseTo(0.297, 2); // ~30% ROI
    });

    it('should calculate 10-year ROI correctly', () => {
      const investment = 1_000_000;
      const annual_benefits = 200_000;
      const years = 10;

      const roi = calculateROI(investment, annual_benefits, years);
      expect(roi).toBeGreaterThan(0.5); // >50% ROI over 10 years
    });

    it('should use 5% discount rate by default', () => {
      const roi1 = calculateROI(1_000_000, 300_000, 5);
      const roi2 = calculateROI(1_000_000, 300_000, 5, 0.05);
      expect(roi1).toBe(roi2);
    });

    it('should account for discount rate in NPV calculation', () => {
      const roi_low = calculateROI(1_000_000, 300_000, 5, 0.03);
      const roi_high = calculateROI(1_000_000, 300_000, 5, 0.10);
      expect(roi_low).toBeGreaterThan(roi_high); // Lower discount = higher ROI
    });
  });

  describe('Edge Cases', () => {
    it('should return 0 for zero investment', () => {
      const roi = calculateROI(0, 300_000, 5);
      expect(roi).toBe(0);
    });

    it('should return negative ROI when benefits < investment', () => {
      const roi = calculateROI(1_000_000, 50_000, 5);
      expect(roi).toBeLessThan(0);
    });

    it('should handle zero annual benefits', () => {
      const roi = calculateROI(1_000_000, 0, 5);
      expect(roi).toBe(-1); // -100% ROI (total loss)
    });

    it('should handle 1-year period', () => {
      const roi = calculateROI(1_000_000, 1_200_000, 1);
      expect(roi).toBeCloseTo(0.142, 2); // ~14% ROI after discounting
    });
  });
});

describe('calculatePaybackPeriod', () => {
  describe('Happy Path', () => {
    it('should calculate payback period in months correctly', () => {
      const investment = 1_200_000;
      const annual_savings = 300_000;

      const payback = calculatePaybackPeriod(investment, annual_savings);
      expect(payback).toBe(48); // 4 years = 48 months
    });

    it('should calculate payback period for 2-year payback', () => {
      const payback = calculatePaybackPeriod(1_000_000, 500_000);
      expect(payback).toBe(24); // 2 years
    });

    it('should calculate payback period for 6-month payback', () => {
      const payback = calculatePaybackPeriod(100_000, 200_000);
      expect(payback).toBe(6); // 6 months
    });
  });

  describe('Edge Cases', () => {
    it('should return Infinity for zero annual savings', () => {
      const payback = calculatePaybackPeriod(1_000_000, 0);
      expect(payback).toBe(Infinity);
    });

    it('should handle fractional months', () => {
      const payback = calculatePaybackPeriod(1_000_000, 333_333);
      expect(payback).toBeCloseTo(36, 0); // ~3 years
    });
  });
});

describe('calculateNPV', () => {
  describe('Happy Path', () => {
    it('should calculate positive NPV for profitable project', () => {
      const investment = 1_000_000;
      const annual_cashflows = [300_000, 300_000, 300_000, 300_000, 300_000];

      const npv = calculateNPV(investment, annual_cashflows);
      expect(npv).toBeGreaterThan(0); // Positive NPV
      expect(npv).toBeCloseTo(298_843, 0); // ~$299K NPV
    });

    it('should calculate negative NPV for unprofitable project', () => {
      const investment = 1_000_000;
      const annual_cashflows = [50_000, 50_000, 50_000, 50_000, 50_000];

      const npv = calculateNPV(investment, annual_cashflows);
      expect(npv).toBeLessThan(0); // Negative NPV
    });

    it('should use 5% discount rate by default', () => {
      const npv1 = calculateNPV(1_000_000, [300_000, 300_000, 300_000]);
      const npv2 = calculateNPV(1_000_000, [300_000, 300_000, 300_000], 0.05);
      expect(npv1).toBe(npv2);
    });

    it('should discount future cashflows properly', () => {
      const npv_low = calculateNPV(1_000_000, [300_000, 300_000], 0.03);
      const npv_high = calculateNPV(1_000_000, [300_000, 300_000], 0.10);
      expect(npv_low).toBeGreaterThan(npv_high); // Lower discount = higher NPV
    });
  });

  describe('Edge Cases', () => {
    it('should return negative investment for zero cashflows', () => {
      const npv = calculateNPV(1_000_000, []);
      expect(npv).toBe(-1_000_000);
    });

    it('should handle single year cashflow', () => {
      const npv = calculateNPV(1_000_000, [1_200_000]);
      expect(npv).toBeGreaterThan(0);
    });

    it('should handle varying cashflows', () => {
      const npv = calculateNPV(1_000_000, [200_000, 300_000, 400_000, 500_000]);
      expect(npv).toBeGreaterThan(0);
    });
  });
});

describe('calculateOpportunityCost', () => {
  describe('Happy Path', () => {
    it('should calculate opportunity cost for 6-month delay', () => {
      const monthly_loss = 100_000;
      const delayed_months = 6;

      const cost = calculateOpportunityCost(delayed_months, monthly_loss);
      expect(cost).toBeGreaterThan(600_000); // >$600K due to compounding
      expect(cost).toBeCloseTo(630_812, 0); // ~$631K
    });

    it('should calculate opportunity cost for 12-month delay', () => {
      const cost = calculateOpportunityCost(12, 100_000);
      expect(cost).toBeGreaterThan(1_200_000); // >$1.2M
    });

    it('should compound at 2% per month', () => {
      const cost_6mo = calculateOpportunityCost(6, 100_000);
      const cost_12mo = calculateOpportunityCost(12, 100_000);
      expect(cost_12mo).toBeGreaterThan(cost_6mo * 2); // More than double due to compounding
    });
  });

  describe('Edge Cases', () => {
    it('should return 0 for zero delay', () => {
      const cost = calculateOpportunityCost(0, 100_000);
      expect(cost).toBe(0);
    });

    it('should return monthly_loss for 1-month delay', () => {
      const cost = calculateOpportunityCost(1, 100_000);
      expect(cost).toBe(100_000); // No compounding for first month
    });

    it('should return 0 for zero monthly loss', () => {
      const cost = calculateOpportunityCost(6, 0);
      expect(cost).toBe(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════
// INTEGRATED ECONOMIC ANALYSIS
// ═══════════════════════════════════════════════════════════════════

describe('calculateEconomicImpact', () => {
  describe('Energy Simulations', () => {
    it('should calculate energy economic impact correctly', () => {
      const params = {
        simulation_type: 'energy' as const,
        stressed_regions: [
          { region: 'San Salvador', population: 1_800_000, stress_level: 0.7 },
          { region: 'La Libertad', population: 750_000, stress_level: 0.5 },
        ],
        scenario_params: {
          solar_growth_pct: 20,
          rainfall_change_pct: -10,
        },
      };

      const result = calculateEconomicImpact(params);

      expect(result.infrastructure_investment_usd).toBeGreaterThan(0);
      expect(result.annual_savings_usd).toBeGreaterThan(0);
      expect(result.roi_5_year).toBeDefined();
      expect(result.payback_period_months).toBeGreaterThan(0);
      expect(result.net_present_value_usd).toBeDefined();
    });

    it('should include solar investment when solar_growth_pct > 0', () => {
      const params = {
        simulation_type: 'energy' as const,
        stressed_regions: [
          { region: 'San Salvador', population: 1_800_000, stress_level: 0.7 },
        ],
        scenario_params: {
          solar_growth_pct: 50,
          rainfall_change_pct: 0,
        },
      };

      const result = calculateEconomicImpact(params);
      expect(result.infrastructure_investment_usd).toBeGreaterThan(100_000_000); // >$100M
    });

    it('should calculate grid upgrades for high stress regions (>0.6)', () => {
      const params = {
        simulation_type: 'energy' as const,
        stressed_regions: [
          { region: 'San Salvador', population: 1_800_000, stress_level: 0.8 },
        ],
        scenario_params: {
          solar_growth_pct: 0,
          rainfall_change_pct: 0,
        },
      };

      const result = calculateEconomicImpact(params);
      expect(result.infrastructure_investment_usd).toBeGreaterThan(0);
    });
  });

  describe('Water Simulations', () => {
    it('should calculate water economic impact correctly', () => {
      const params = {
        simulation_type: 'water' as const,
        stressed_regions: [
          { region: 'San Salvador', population: 1_800_000, stress_level: 0.7 },
        ],
        scenario_params: {
          water_demand_growth_pct: 10,
          rainfall_change_pct: -20,
        },
      };

      const result = calculateEconomicImpact(params);

      expect(result.infrastructure_investment_usd).toBeGreaterThan(0);
      expect(result.annual_savings_usd).toBeGreaterThan(0);
      expect(result.roi_5_year).toBeDefined();
    });

    it('should calculate water treatment infrastructure for high stress', () => {
      const params = {
        simulation_type: 'water' as const,
        stressed_regions: [
          { region: 'San Salvador', population: 1_800_000, stress_level: 0.9 },
        ],
        scenario_params: {},
      };

      const result = calculateEconomicImpact(params);
      expect(result.infrastructure_investment_usd).toBeGreaterThan(1_000_000);
    });
  });

  describe('Agriculture Simulations', () => {
    it('should calculate agriculture economic impact correctly', () => {
      const params = {
        simulation_type: 'agriculture' as const,
        stressed_regions: [
          { region: 'Santa Ana', population: 550_000, stress_level: 0.6 },
        ],
        scenario_params: {},
        crop_losses: {
          coffee: 1_000_000, // 1M kg lost
          corn: 500_000,
        },
      };

      const result = calculateEconomicImpact(params);

      expect(result.infrastructure_investment_usd).toBeGreaterThan(0);
      expect(result.annual_savings_usd).toBeGreaterThan(0);
      expect(result.roi_5_year).toBeDefined();
    });

    it('should calculate irrigation system costs', () => {
      const params = {
        simulation_type: 'agriculture' as const,
        stressed_regions: [
          { region: 'Santa Ana', population: 550_000, stress_level: 0.7 },
          { region: 'Chalatenango', population: 220_000, stress_level: 0.6 },
        ],
        scenario_params: {},
        crop_losses: {
          coffee: 500_000,
        },
      };

      const result = calculateEconomicImpact(params);
      expect(result.infrastructure_investment_usd).toBeGreaterThan(10_000_000);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty stressed_regions array', () => {
      const params = {
        simulation_type: 'energy' as const,
        stressed_regions: [],
        scenario_params: {},
      };

      const result = calculateEconomicImpact(params);
      expect(result.infrastructure_investment_usd).toBe(0);
    });

    it('should throw error for unknown simulation type', () => {
      const params = {
        simulation_type: 'unknown' as any,
        stressed_regions: [],
        scenario_params: {},
      };

      expect(() => calculateEconomicImpact(params)).toThrow(/Unknown simulation type/);
    });

    it('should add population data if missing', () => {
      const params = {
        simulation_type: 'energy' as const,
        stressed_regions: [
          { region: 'San Salvador', population: 0, stress_level: 0.7 },
        ],
        scenario_params: {},
      };

      const result = calculateEconomicImpact(params);
      expect(result).toBeDefined(); // Should not throw
    });
  });

  describe('Response Structure', () => {
    it('should return all required fields', () => {
      const params = {
        simulation_type: 'energy' as const,
        stressed_regions: [
          { region: 'San Salvador', population: 1_800_000, stress_level: 0.7 },
        ],
        scenario_params: {
          solar_growth_pct: 10,
        },
      };

      const result = calculateEconomicImpact(params);

      expect(result).toHaveProperty('infrastructure_investment_usd');
      expect(result).toHaveProperty('annual_savings_usd');
      expect(result).toHaveProperty('annual_costs_prevented_usd');
      expect(result).toHaveProperty('roi_5_year');
      expect(result).toHaveProperty('payback_period_months');
      expect(result).toHaveProperty('net_present_value_usd');
      expect(result).toHaveProperty('opportunity_cost_6mo_delay_usd');
      expect(result).toHaveProperty('total_economic_exposure_usd');
      expect(result).toHaveProperty('cost_of_inaction_5_year_usd');
    });

    it('should return rounded integer values', () => {
      const params = {
        simulation_type: 'energy' as const,
        stressed_regions: [
          { region: 'San Salvador', population: 1_800_000, stress_level: 0.7 },
        ],
        scenario_params: {},
      };

      const result = calculateEconomicImpact(params);

      expect(Number.isInteger(result.infrastructure_investment_usd)).toBe(true);
      expect(Number.isInteger(result.annual_savings_usd)).toBe(true);
      expect(Number.isInteger(result.payback_period_months)).toBe(true);
    });

    it('should return ROI rounded to 1 decimal place', () => {
      const params = {
        simulation_type: 'energy' as const,
        stressed_regions: [
          { region: 'San Salvador', population: 1_800_000, stress_level: 0.7 },
        ],
        scenario_params: {},
      };

      const result = calculateEconomicImpact(params);

      const roiDecimals = (result.roi_5_year.toString().split('.')[1] || '').length;
      expect(roiDecimals).toBeLessThanOrEqual(1);
    });
  });
});
