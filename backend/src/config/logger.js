const pino = require('pino');

// Pretty-printed only for local dev — plain JSON in production (log
// aggregators want structured lines) and silent by default in tests (jest
// sets NODE_ENV=test) so business-event logs don't clutter test output.
const isProduction = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

const logger = pino({
  level: process.env.LOG_LEVEL || (isTest ? 'silent' : 'info'),
  transport:
    isProduction || isTest
      ? undefined
      : { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } },
});

module.exports = logger;
