/**
 * Jest Setup File
 *
 * Runs before each test file.
 * Used for:
 * - Importing jest-dom matchers
 * - Setting up global mocks
 * - Configuring test environment
 */

// Import jest-dom for additional matchers
import '@testing-library/jest-dom';

// Mock environment variables for tests
process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'pk.test.mock_mapbox_token';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test_anon_key';
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test_anon_key';
process.env.OPENAI_API_KEY = 'sk-test-mock-openai-key';
process.env.ANTHROPIC_API_KEY = 'test-mock-anthropic-key';
process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';

// Mock fetch globally for API tests
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests (but keep errors)
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn((...args) => {
    // Still log actual errors from tests
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning:') || args[0].includes('Error:'))
    ) {
      originalError(...args);
    }
  });

  console.warn = jest.fn((...args) => {
    // Filter out known warnings
    if (
      typeof args[0] === 'string' &&
      !args[0].includes('act()')
    ) {
      originalWarn(...args);
    }
  });
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Increase timeout for slower tests (API calls, etc.)
jest.setTimeout(10000);

// Mock IntersectionObserver (used by some components)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
};

// Mock ResizeObserver (used by Chart.js and other libraries)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock matchMedia (used for responsive design)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock scrollTo (used for smooth scrolling)
window.scrollTo = jest.fn();

// Mock Next.js Request and Response for API route tests
global.Request = class Request {
  constructor(url, init = {}) {
    // Use Object.defineProperty for readonly properties to avoid conflicts with NextRequest
    Object.defineProperty(this, 'url', {
      value: url,
      writable: false,
      enumerable: true,
      configurable: true,
    });

    Object.defineProperty(this, 'method', {
      value: init.method || 'GET',
      writable: false,
      enumerable: true,
      configurable: true,
    });

    this.headers = new Map();

    // Handle headers from init
    if (init.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value);
      });
    }

    // Handle body
    this._bodyInit = init.body;
  }

  get(name) {
    return this.headers.get(name.toLowerCase());
  }

  async json() {
    if (this._bodyInit) {
      return JSON.parse(this._bodyInit);
    }
    return {};
  }

  async text() {
    return this._bodyInit || '';
  }
};

global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Map();

    if (init.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        this.headers.set(key.toLowerCase(), value);
      });
    }
  }

  async json() {
    if (typeof this.body === 'string') {
      return JSON.parse(this.body);
    }
    return this.body;
  }

  async text() {
    if (typeof this.body === 'string') {
      return this.body;
    }
    return JSON.stringify(this.body);
  }
};
