/**
 * Jest setup file - runs before all tests
 */

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATA_DIR = './test-data';

// Mock console methods in test environment to reduce noise
const originalConsole = global.console;

global.console = {
  ...originalConsole,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: originalConsole.error, // Keep error for debugging
};

// Restore console after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global test timeout
jest.setTimeout(10000);