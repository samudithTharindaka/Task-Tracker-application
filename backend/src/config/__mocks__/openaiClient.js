// Manual mock for src/config/openaiClient.js. Activated in a test file via
// `jest.mock('<path-to>/config/openaiClient')` (no factory needed — Jest
// finds this file automatically because it sits in an adjacent __mocks__
// dir). Deliberately NOT named openai.js — that basename collides with the
// real npm package name and Jest then applies it as an implicit global mock
// for every `require('openai')` in the whole suite, not just this file.

const { mockDeep, mockReset } = require('jest-mock-extended');

const openaiMock = mockDeep();

beforeEach(() => {
  mockReset(openaiMock);
});

module.exports = openaiMock;
