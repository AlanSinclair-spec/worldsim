/**
 * Zod Validation Schemas for WorldSim API Routes
 *
 * Provides comprehensive input validation and sanitization to prevent:
 * - SQL injection
 * - Data corruption
 * - DoS attacks via oversized payloads
 * - Type coercion vulnerabilities
 *
 * All API routes MUST use these schemas to validate user input.
 */

import { z } from 'zod';

/**
 * Body size limit for all API requests (10MB)
 * Prevents DoS attacks via large payloads
 */
export const MAX_BODY_SIZE = 10 * 1024 * 1024;

/**
 * Date string format validator
 * Ensures dates are in YYYY-MM-DD format and are valid dates
 */
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (expected YYYY-MM-DD)')
  .refine((dateStr) => {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  }, 'Invalid date value');

/**
 * Energy Simulation Request Validation
 *
 * Validates parameters for /api/simulate endpoint
 *
 * @example
 * const result = EnergySimulationSchema.safeParse(requestBody);
 * if (!result.success) {
 *   return NextResponse.json({ error: result.error.errors }, { status: 400 });
 * }
 */
export const EnergySimulationSchema = z
  .object({
    solar_growth_pct: z
      .number()
      .min(-100, 'Solar growth cannot be less than -100%')
      .max(200, 'Solar growth cannot exceed 200%')
      .finite('Solar growth must be a finite number'),
    rainfall_change_pct: z
      .number()
      .min(-100, 'Rainfall change cannot be less than -100%')
      .max(200, 'Rainfall change cannot exceed 200%')
      .finite('Rainfall change must be a finite number'),
    start_date: dateString,
    end_date: dateString,
  })
  .strict() // Reject additional properties
  .refine(
    (data) => new Date(data.end_date) > new Date(data.start_date),
    'End date must be after start date'
  )
  .refine(
    (data) => {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 365 * 5; // Max 5 years
    },
    'Date range cannot exceed 5 years'
  );

/**
 * Water Simulation Request Validation
 *
 * Validates parameters for /api/simulate-water endpoint
 */
export const WaterSimulationSchema = z
  .object({
    water_demand_growth_pct: z
      .number()
      .min(-50, 'Water demand growth cannot be less than -50%')
      .max(200, 'Water demand growth cannot exceed 200%')
      .finite('Water demand growth must be a finite number'),
    rainfall_change_pct: z
      .number()
      .min(-100, 'Rainfall change cannot be less than -100%')
      .max(200, 'Rainfall change cannot exceed 200%')
      .finite('Rainfall change must be a finite number'),
    conservation_rate_pct: z
      .number()
      .min(0, 'Conservation rate cannot be negative')
      .max(100, 'Conservation rate cannot exceed 100%')
      .finite('Conservation rate must be a finite number'),
    start_date: dateString,
    end_date: dateString,
  })
  .strict()
  .refine(
    (data) => new Date(data.end_date) > new Date(data.start_date),
    'End date must be after start date'
  )
  .refine(
    (data) => {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 365 * 5;
    },
    'Date range cannot exceed 5 years'
  );

/**
 * Agriculture Simulation Request Validation
 *
 * Validates parameters for /api/simulate-agriculture endpoint
 */
export const AgricultureSimulationSchema = z
  .object({
    rainfall_change_pct: z
      .number()
      .min(-100, 'Rainfall change cannot be less than -100%')
      .max(200, 'Rainfall change cannot exceed 200%')
      .finite('Rainfall change must be a finite number'),
    temperature_change_c: z
      .number()
      .min(-5, 'Temperature change cannot be less than -5°C')
      .max(10, 'Temperature change cannot exceed +10°C')
      .finite('Temperature change must be a finite number'),
    irrigation_improvement_pct: z
      .number()
      .min(0, 'Irrigation improvement cannot be negative')
      .max(100, 'Irrigation improvement cannot exceed 100%')
      .finite('Irrigation improvement must be a finite number'),
    crop_type: z.enum(['all', 'coffee', 'sugar_cane', 'corn', 'beans'], {
      errorMap: () => ({ message: 'crop_type must be "all", "coffee", "sugar_cane", "corn", or "beans"' }),
    }),
    start_date: dateString,
    end_date: dateString,
  })
  .strict()
  .refine(
    (data) => new Date(data.end_date) > new Date(data.start_date),
    'End date must be after start date'
  )
  .refine(
    (data) => {
      const start = new Date(data.start_date);
      const end = new Date(data.end_date);
      const daysDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      return daysDiff <= 365 * 5;
    },
    'Date range cannot exceed 5 years'
  );

/**
 * CSV Ingest Request Validation
 *
 * Validates parameters for /api/ingest endpoint
 * Includes size limits to prevent DoS attacks
 */
export const IngestSchema = z
  .object({
    csv_text: z
      .string()
      .min(10, 'CSV content too short (minimum 10 characters)')
      .max(MAX_BODY_SIZE, `CSV content too large (maximum ${MAX_BODY_SIZE / 1024 / 1024}MB)`)
      .refine(
        (text) => text.includes('\n') || text.includes(','),
        'Invalid CSV format (must contain newlines or commas)'
      ),
    data_type: z.enum(['energy', 'rainfall', 'water'], {
      errorMap: () => ({ message: 'data_type must be "energy", "rainfall", or "water"' }),
    }),
  })
  .strict();

/**
 * Helper function to check request body size before parsing
 *
 * @param req - Next.js request object
 * @returns true if body size is acceptable, false otherwise
 *
 * @example
 * if (!checkBodySize(req)) {
 *   return NextResponse.json(
 *     { success: false, error: 'Request too large' },
 *     { status: 413 }
 *   );
 * }
 */
export function checkBodySize(req: Request): boolean {
  const contentLength = req.headers.get('content-length');
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (isNaN(size) || size > MAX_BODY_SIZE) {
      return false;
    }
  }
  return true;
}

/**
 * Helper function to format Zod validation errors for API responses
 *
 * @param error - Zod error object
 * @returns Formatted error object for API response
 *
 * @example
 * try {
 *   const data = EnergySimulationSchema.parse(body);
 * } catch (error) {
 *   if (error instanceof z.ZodError) {
 *     return NextResponse.json(formatZodError(error), { status: 400 });
 *   }
 * }
 */
export function formatZodError(error: z.ZodError) {
  return {
    success: false,
    error: 'Invalid input parameters',
    details: error.errors.map((e) => {
      const path = e.path.join('.');
      return path ? `${path}: ${e.message}` : e.message;
    }),
  };
}
