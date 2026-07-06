const OpenAI = require('openai');
const env = require('./env');

// The SDK throws synchronously if constructed with no API key (unlike
// PrismaClient's lazy connection), and app.js requires every route module
// (including modules/ai/ai.routes.js) at boot — so an unguarded `new
// OpenAI(...)` here would crash server startup, and every test file that
// requires app.js, whenever the key isn't set. A missing key should only
// disable the AI feature (ai.service.js checks for null and returns a 503),
// not take down the whole app.
module.exports = env.openaiApiKey
  ? new OpenAI({ apiKey: env.openaiApiKey, timeout: 30_000 })
  : null;
