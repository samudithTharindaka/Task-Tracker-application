// Runs before the test framework loads, so config/env.js sees these values
// instead of trying to read a real .env file. dotenv.config() (called inside
// config/env.js) never overrides variables that are already set, so these
// win regardless of load order.
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/test?schema=public';
process.env.JWT_ACCESS_SECRET ??= 'test-access-secret';
process.env.JWT_REFRESH_SECRET ??= 'test-refresh-secret';
process.env.JWT_ACCESS_EXPIRY ??= '15m';
process.env.JWT_REFRESH_EXPIRY ??= '7d';
process.env.PORT ??= '4000';
