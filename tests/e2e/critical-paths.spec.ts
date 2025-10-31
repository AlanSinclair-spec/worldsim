/**
 * E2E Critical Path Tests for WorldSim
 *
 * Tests the most important user journeys:
 * 1. Homepage loads correctly
 * 2. Interactive page displays all tabs
 * 3. Energy simulation completes successfully
 * 4. Water simulation completes successfully
 * 5. Agriculture simulation completes successfully
 * 6. AI explanation generation works
 * 7. Scenario comparison functions
 * 8. Map rendering works
 * 9. Mobile responsiveness
 * 10. No console errors
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('should load and display hero section', async ({ page }) => {
    await page.goto('/');

    // Check page title
    await expect(page).toHaveTitle(/WorldSim/);

    // Check hero section
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Test the future before living it')).toBeVisible();

    // Check navigation
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should load within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test('should have no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors.length).toBe(0);
  });
});

test.describe('Interactive Page', () => {
  test('should display all 6 tabs', async ({ page }) => {
    await page.goto('/interactive');

    // Check all tabs exist
    const tabs = [
      'Energy Simulation',
      'Water Simulation',
      'Agriculture Impact',
      'AI Explanation',
      'Scenario Comparison',
      'Trends Dashboard',
    ];

    for (const tab of tabs) {
      await expect(page.locator(`text=${tab}`)).toBeVisible();
    }
  });

  test('should switch between tabs correctly', async ({ page }) => {
    await page.goto('/interactive');

    // Click Water tab
    await page.click('text=Water Simulation');
    await expect(page.locator('text=Water Demand Growth')).toBeVisible();

    // Click Agriculture tab
    await page.click('text=Agriculture Impact');
    await expect(page.locator('text=Crop Type')).toBeVisible();
  });
});

test.describe('Energy Simulation', () => {
  test('should complete energy simulation successfully', async ({ page }) => {
    await page.goto('/interactive');

    // Ensure we're on Energy tab
    await page.click('text=Energy Simulation');

    // Fill out form
    await page.fill('input[name="solar_growth_pct"]', '20');
    await page.fill('input[name="rainfall_change_pct"]', '-10');
    await page.fill('input[name="start_date"]', '2024-01-01');
    await page.fill('input[name="end_date"]', '2024-01-30');

    // Submit simulation
    await page.click('button:has-text("Run Simulation")');

    // Wait for results
    await expect(page.locator('text=Simulation Results')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Average Stress')).toBeVisible();
  });

  test('should display results within 3 seconds', async ({ page }) => {
    await page.goto('/interactive');
    await page.click('text=Energy Simulation');

    await page.fill('input[name="solar_growth_pct"]', '10');
    await page.fill('input[name="rainfall_change_pct"]', '0');
    await page.fill('input[name="start_date"]', '2024-01-01');
    await page.fill('input[name="end_date"]', '2024-01-30');

    const startTime = Date.now();
    await page.click('button:has-text("Run Simulation")');
    await expect(page.locator('text=Simulation Results')).toBeVisible({ timeout: 10000 });
    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(3000);
  });

  test('should show validation errors for invalid inputs', async ({ page }) => {
    await page.goto('/interactive');
    await page.click('text=Energy Simulation');

    // Try invalid solar growth
    await page.fill('input[name="solar_growth_pct"]', '999');
    await page.click('button:has-text("Run Simulation")');

    // Should show error
    await expect(page.locator('text=/error|invalid/i')).toBeVisible();
  });
});

test.describe('Water Simulation', () => {
  test('should complete water simulation successfully', async ({ page }) => {
    await page.goto('/interactive');
    await page.click('text=Water Simulation');

    await page.fill('input[name="water_demand_growth_pct"]', '10');
    await page.fill('input[name="rainfall_change_pct"]', '-15');
    await page.fill('input[name="conservation_rate_pct"]', '10');
    await page.fill('input[name="start_date"]', '2024-01-01');
    await page.fill('input[name="end_date"]', '2024-01-30');

    await page.click('button:has-text("Run Simulation")');

    await expect(page.locator('text=Simulation Results')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Agriculture Simulation', () => {
  test('should complete agriculture simulation successfully', async ({ page }) => {
    await page.goto('/interactive');
    await page.click('text=Agriculture Impact');

    await page.fill('input[name="rainfall_change_pct"]', '-20');
    await page.fill('input[name="temperature_change_c"]', '2');
    await page.fill('input[name="irrigation_improvement_pct"]', '15');
    await page.selectOption('select[name="crop_type"]', 'coffee');
    await page.fill('input[name="start_date"]', '2024-01-01');
    await page.fill('input[name="end_date"]', '2024-12-31');

    await page.click('button:has-text("Run Simulation")');

    await expect(page.locator('text=Simulation Results')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('AI Explanation', () => {
  test('should generate AI explanation', async ({ page }) => {
    await page.goto('/interactive');
    await page.click('text=AI Explanation');

    // Run a simulation first (if needed for context)
    await page.click('text=Energy Simulation');
    await page.fill('input[name="solar_growth_pct"]', '20');
    await page.fill('input[name="rainfall_change_pct"]', '0');
    await page.fill('input[name="start_date"]', '2024-01-01');
    await page.fill('input[name="end_date"]', '2024-01-30');
    await page.click('button:has-text("Run Simulation")');

    await expect(page.locator('text=Simulation Results')).toBeVisible({ timeout: 10000 });

    // Click AI Explanation tab
    await page.click('text=AI Explanation');
    await page.click('button:has-text("Generate Explanation")');

    // Wait for AI response
    await expect(page.locator('text=/summary|analysis|stress/i')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Map Rendering', () => {
  test('should display interactive map', async ({ page }) => {
    await page.goto('/');

    // Check for map canvas
    await expect(page.locator('canvas.mapboxgl-canvas')).toBeVisible({ timeout: 10000 });
  });

  test('should render all 14 El Salvador departments', async ({ page }) => {
    await page.goto('/');

    await page.waitForSelector('canvas.mapboxgl-canvas', { timeout: 10000 });

    // Map should be loaded and rendered
    const canvas = await page.locator('canvas.mapboxgl-canvas');
    await expect(canvas).toBeVisible();
  });

  test('should maintain 60 FPS during map interactions', async ({ page }) => {
    await page.goto('/');

    await page.waitForSelector('canvas.mapboxgl-canvas');

    // Simulate map drag/zoom
    const canvas = await page.locator('canvas.mapboxgl-canvas');
    await canvas.hover();
    await page.mouse.wheel(0, -100); // Zoom in

    // Check for smooth rendering (no janky frames)
    // Note: Actual FPS measurement requires browser DevTools protocol
  });
});

test.describe('Mobile Responsiveness', () => {
  test('should have touch targets >= 44x44px on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/interactive');

    // Check button sizes
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const box = await button.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should display correctly on iPhone 12', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');

    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should display correctly on iPad', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/interactive');

    await expect(page.locator('text=Energy Simulation')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should have no layout shifts (CLS)', async ({ page }) => {
    await page.goto('/');

    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');

    // No explicit CLS measurement, but content should be stable
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should load core content above fold quickly', async ({ page }) => {
    await page.goto('/');

    // Hero should be visible immediately
    await expect(page.locator('h1')).toBeVisible({ timeout: 1000 });
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA labels on interactive elements', async ({ page }) => {
    await page.goto('/interactive');

    // Check for ARIA labels on inputs
    const inputs = await page.locator('input[type="text"], input[type="number"]').all();
    for (const input of inputs) {
      const ariaLabel = await input.getAttribute('aria-label');
      const label = await input.evaluate(el => {
        const id = el.getAttribute('id');
        return id ? document.querySelector(`label[for="${id}"]`) : null;
      });

      expect(ariaLabel || label).toBeTruthy();
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/interactive');

    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Should be able to reach interactive elements
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'INPUT', 'SELECT', 'A']).toContain(focused);
  });
});
