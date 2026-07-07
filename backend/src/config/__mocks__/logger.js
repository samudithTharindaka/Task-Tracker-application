// Manual mock for src/config/logger.js. Activated in a test file via
// `jest.mock('<path-to>/config/logger')`. Plain jest.fn()s (not
// jest-mock-extended's mockDeep like prisma/openaiClient) since pino's
// interface here is just flat log-level methods — resetMocks: true in
// jest.config.js already resets these between tests, no manual
// beforeEach/mockReset needed.
module.exports = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};
