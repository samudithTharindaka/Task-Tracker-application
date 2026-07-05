// Manual mock for src/config/prisma.js. Activated in a test file via
// `jest.mock('<path-to>/config/prisma')` (no factory needed — Jest finds
// this file automatically because it sits in an adjacent __mocks__ dir).
const { mockDeep, mockReset } = require('jest-mock-extended');

const prismaMock = mockDeep();

beforeEach(() => {
  mockReset(prismaMock);
});

module.exports = prismaMock;
