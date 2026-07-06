// Manual mock for src/config/openai.js. Activated in a test file via
// `jest.mock('<path-to>/config/openai')` (no factory needed — Jest finds
// this file automatically because it sits in an adjacent __mocks__ dir).
const { mockDeep, mockReset } = require('jest-mock-extended');

const openaiMock = mockDeep();

beforeEach(() => {
  mockReset(openaiMock);
});

module.exports = openaiMock;
