# WorldSim Testing - Quick Start Guide

**Last Updated:** 2025-10-30

---

## 🚀 Quick Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (automatically re-run on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run a specific test file
npm test src/lib/model.test.ts

# Run tests matching a pattern
npm test -- --testNamePattern="calculateStress"

# Run tests in a specific directory
npm test src/lib/

# Update snapshots (if you add snapshot tests later)
npm test -- -u
```

---

## 📁 Test File Locations

```
worldsim/
├── jest.config.js          # Jest configuration
├── jest.setup.js           # Test environment setup
├── __mocks__/              # Mock files for CSS/images
│   ├── styleMock.js
│   └── fileMock.js
├── tests/
│   └── utils/
│       └── mocks.ts        # Shared test utilities
└── src/
    ├── lib/
    │   ├── model.ts        # Business logic
    │   └── model.test.ts   # ✅ Tests for model.ts
    └── app/
        └── api/
            └── simulate/
                ├── route.ts      # API endpoint
                └── route.test.ts # ✅ Tests for API

```

---

## ✍️ How to Add a New Test File

### For Unit Tests (Testing a function/module)

1. **Create test file next to source file**
   ```bash
   # If testing: src/lib/economics.ts
   # Create: src/lib/economics.test.ts
   ```

2. **Copy template from model.test.ts**
   ```typescript
   /**
    * Unit Tests for Economics Module
    */
   import { calculateROI, calculateNPV } from './economics';
   import { mockSupabaseClient } from '../../tests/utils/mocks';

   // Mock dependencies if needed
   jest.mock('./supabase', () => ({
     supabase: mockSupabaseClient,
   }));

   describe('calculateROI', () => {
     describe('Happy Path', () => {
       it('should calculate 5-year ROI correctly', () => {
         const roi = calculateROI(1000000, 200000, 5);
         expect(roi).toBeCloseTo(2.5, 2);
       });
     });

     describe('Edge Cases', () => {
       it('should handle zero investment', () => {
         const roi = calculateROI(0, 200000, 5);
         expect(roi).toBe(0);
       });
     });
   });
   ```

3. **Run the test**
   ```bash
   npm test src/lib/economics.test.ts
   ```

### For API Tests (Testing an API endpoint)

1. **Create test file in same directory as route.ts**
   ```bash
   # If testing: src/app/api/simulate-water/route.ts
   # Create: src/app/api/simulate-water/route.test.ts
   ```

2. **Copy template from simulate/route.test.ts**
   ```typescript
   import { POST } from './route';
   import { NextRequest } from 'next/server';
   import { mockSupabaseClient } from '../../../../tests/utils/mocks';

   jest.mock('@/lib/supabase', () => ({
     supabase: mockSupabaseClient,
   }));

   describe('POST /api/simulate-water', () => {
     it('should return 200 with valid results', async () => {
       const request = new NextRequest('http://localhost:3000/api/simulate-water', {
         method: 'POST',
         body: JSON.stringify({
           rainfall_reduction_pct: 0.3,
           start_date: '2024-01-01',
           end_date: '2024-01-30',
         }),
       });

       const response = await POST(request);
       const data = await response.json();

       expect(response.status).toBe(200);
       expect(data.success).toBe(true);
     });
   });
   ```

3. **Run the test**
   ```bash
   npm test src/app/api/simulate-water/route.test.ts
   ```

---

## 🎯 Test Writing Tips

### 1. Follow the AAA Pattern

```typescript
it('should calculate stress correctly', () => {
  // ARRANGE - Set up test data
  const demand = 100;
  const supply = 90;

  // ACT - Call the function being tested
  const stress = calculateStress(demand, supply);

  // ASSERT - Verify the result
  expect(stress).toBe(0.1);
});
```

### 2. Use Descriptive Test Names

✅ **Good:**
```typescript
it('should return 400 when solar_growth_pct exceeds 1.0', () => {
  // Test code
});
```

❌ **Bad:**
```typescript
it('should work', () => {
  // Test code
});
```

### 3. Test Happy Path AND Edge Cases

```typescript
describe('calculateStress', () => {
  // Happy path - normal inputs
  it('should calculate 10% stress when supply is 90% of demand', () => {
    expect(calculateStress(100, 90)).toBe(0.1);
  });

  // Edge case - zero values
  it('should return 0 when demand is zero', () => {
    expect(calculateStress(0, 100)).toBe(0);
  });

  // Edge case - negative values
  it('should handle negative supply as zero', () => {
    expect(calculateStress(100, -10)).toBe(1);
  });
});
```

### 4. Group Related Tests

```typescript
describe('Energy Simulation API', () => {
  describe('Input Validation', () => {
    it('should reject missing fields', () => { /* ... */ });
    it('should reject invalid types', () => { /* ... */ });
    it('should reject out-of-range values', () => { /* ... */ });
  });

  describe('Security', () => {
    it('should sanitize SQL injection', () => { /* ... */ });
    it('should reject XSS attempts', () => { /* ... */ });
  });
});
```

### 5. Use Matchers Appropriately

```typescript
// Exact equality
expect(result).toBe(5);

// Deep equality (for objects/arrays)
expect(result).toEqual({ id: 1, name: 'Test' });

// Floating point comparisons
expect(result).toBeCloseTo(0.333, 2); // 2 decimal places

// Truthiness
expect(result).toBeDefined();
expect(result).not.toBeNull();
expect(result).toBeTruthy();

// Arrays
expect(array).toHaveLength(5);
expect(array).toContain('value');

// Strings
expect(text).toContain('substring');
expect(text).toMatch(/regex/);

// Errors
expect(() => dangerousFunction()).toThrow();
expect(() => dangerousFunction()).toThrow('Specific error message');
```

### 6. Mock External Dependencies

```typescript
import { createMockOpenAI, mockSupabaseClient } from '../../tests/utils/mocks';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: mockSupabaseClient,
}));

// Configure mock behavior
mockSupabaseClient.from.mockReturnValue({
  select: jest.fn().mockResolvedValue({
    data: [{ id: 1, name: 'Test' }],
    error: null,
  }),
});
```

### 7. Clean Up Between Tests

```typescript
describe('My Tests', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Reset any global state
    globalState = initialState;
  });

  afterEach(() => {
    // Clean up after each test
    jest.restoreAllMocks();
  });
});
```

---

## 🧪 Common Test Patterns

### Testing API Endpoints

```typescript
import { POST } from './route';
import { NextRequest } from 'next/server';

it('should handle POST request', async () => {
  const request = new NextRequest('http://localhost:3000/api/test', {
    method: 'POST',
    body: JSON.stringify({ key: 'value' }),
    headers: { 'Content-Type': 'application/json' },
  });

  const response = await POST(request);
  const data = await response.json();

  expect(response.status).toBe(200);
  expect(data.success).toBe(true);
});
```

### Testing Async Functions

```typescript
it('should complete async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});

// With error handling
it('should throw on error', async () => {
  await expect(asyncFunctionThatFails()).rejects.toThrow('Error message');
});
```

### Testing with Timeouts

```typescript
it('should complete in under 3 seconds', async () => {
  const startTime = Date.now();
  await longRunningFunction();
  const duration = Date.now() - startTime;

  expect(duration).toBeLessThan(3000);
}, 10000); // 10 second timeout for this test
```

### Mocking Fetch

```typescript
it('should fetch data from API', async () => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: 'test' }),
  });

  const result = await fetchData();

  expect(result.data).toBe('test');
  expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/data');
});
```

---

## 🐛 Debugging Failed Tests

### 1. Run Single Test

```bash
# Run only the failing test
npm test -- --testNamePattern="should calculate stress"
```

### 2. Add Console Logs

```typescript
it('should work', () => {
  console.log('Input:', input);
  const result = calculate(input);
  console.log('Result:', result);
  expect(result).toBe(expected);
});
```

### 3. Use debugger

```typescript
it('should work', () => {
  debugger; // Breakpoint here
  const result = calculate(input);
  expect(result).toBe(expected);
});
```

Then run:
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### 4. Check Mock Configuration

```typescript
it('should call Supabase', () => {
  // Log what the mock is returning
  console.log('Mock config:', mockSupabaseClient.from.mock);

  // Your test code
  expect(mockSupabaseClient.from).toHaveBeenCalledWith('table_name');
});
```

### 5. Verify Test Isolation

```bash
# Run tests in sequence (not parallel)
npm test -- --runInBand
```

---

## 📊 Coverage Reports

### View Coverage Report

```bash
npm run test:coverage
```

This will generate:
- Terminal output with coverage percentages
- HTML report in `coverage/lcov-report/index.html`

### Open HTML Report

```bash
# On Windows
start coverage/lcov-report/index.html

# On Mac
open coverage/lcov-report/index.html

# On Linux
xdg-open coverage/lcov-report/index.html
```

### Interpret Coverage

- **Green (100%):** All code paths tested ✅
- **Yellow (75-99%):** Most code tested, some gaps ⚠️
- **Red (<75%):** Insufficient coverage ❌

**Focus on:**
- **Statements:** % of lines executed
- **Branches:** % of if/else paths tested
- **Functions:** % of functions called
- **Lines:** % of code lines executed

---

## 🚨 CI/CD Integration (Coming Soon)

Once the CI/CD pipeline is set up, tests will run automatically on:

- **Every push** to any branch
- **Every pull request**
- **Before deployment** to production

**Workflow:**
```yaml
1. Push code to GitHub
2. GitHub Actions runs:
   - TypeScript check
   - ESLint
   - Jest tests
   - E2E tests (Playwright)
3. If all pass ✅ → Deploy to Vercel
4. If any fail ❌ → Block deployment
```

---

## 📚 Additional Resources

### Jest Documentation
- **Getting Started:** https://jestjs.io/docs/getting-started
- **Matchers:** https://jestjs.io/docs/expect
- **Mock Functions:** https://jestjs.io/docs/mock-functions

### React Testing Library
- **Queries:** https://testing-library.com/docs/queries/about
- **User Events:** https://testing-library.com/docs/user-event/intro

### Next.js Testing
- **Official Guide:** https://nextjs.org/docs/app/building-your-application/testing/jest

---

## 💡 Pro Tips

1. **Run tests before committing:**
   ```bash
   git commit -m "Add feature"  # First run: npm test
   ```

2. **Use watch mode during development:**
   ```bash
   npm run test:watch  # Auto-runs tests on file changes
   ```

3. **Focus on critical paths first:**
   - Simulation calculations (model.ts)
   - API endpoints (route.ts files)
   - Security (validation, sanitization)

4. **Aim for meaningful tests, not 100% coverage:**
   - 80% coverage with good tests > 100% coverage with bad tests

5. **Keep tests fast:**
   - Mock external API calls
   - Use minimal test data
   - Avoid unnecessary delays

6. **Write tests as documentation:**
   - Good tests show how to use the code
   - Test names explain expected behavior

---

## 🎯 Current Status

**Tests Created:** 2 files (model.test.ts, simulate/route.test.ts)
**Tests Passing:** 65 tests
**Coverage:** ~25% overall

**Next Steps:**
1. Run existing tests: `npm test`
2. Create validation.test.ts
3. Create economics.test.ts
4. Create trends.test.ts
5. Create remaining API tests

Happy testing! 🚀
