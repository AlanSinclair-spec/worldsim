/**
 * Jest Configuration for WorldSim
 *
 * Configured for:
 * - Next.js 14 (App Router)
 * - TypeScript
 * - React Testing Library
 * - ES Modules
 */

const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Setup files to run before each test
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Test environment
  testEnvironment: 'jest-environment-jsdom',

  // Module name mapper for path aliases
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you soon)
    '^@/(.*)$': '<rootDir>/src/$1',

    // Handle CSS imports (with CSS modules)
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',

    // Handle CSS imports (without CSS modules)
    '^.+\\.(css|sass|scss)$': '<rootDir>/__mocks__/styleMock.js',

    // Handle image imports
    '^.+\\.(png|jpg|jpeg|gif|webp|avif|ico|bmp|svg)$/i': '<rootDir>/__mocks__/fileMock.js',
  },

  // Coverage configuration
  coverageProvider: 'v8',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/node_modules/**',
    '!src/app/layout.tsx', // Exclude layout (minimal logic)
    '!src/app/**/loading.tsx', // Exclude loading components
    '!src/app/**/error.tsx', // Exclude error components
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 75,
      statements: 75,
    },
    // Higher thresholds for critical business logic
    './src/lib/model.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/lib/validation.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
    './src/lib/economics.ts': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },

  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],

  // Transform files with ts-jest
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.next/',
    '<rootDir>/out/',
    '<rootDir>/coverage/',
    '<rootDir>/tests/e2e/', // Playwright tests run separately
  ],

  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Timeout for tests (important for API tests)
  testTimeout: 10000,

  // Verbose output
  verbose: true,

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Reset mocks between tests
  resetMocks: true,

  // Restore mocks between tests
  restoreMocks: true,
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
