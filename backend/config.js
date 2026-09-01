const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const isProduction = process.env.NODE_ENV === 'production';

// Secrets must be supplied explicitly in production. A dev fallback that silently
// applies in production would let anyone forge tokens, so we refuse to boot instead.
function requiredSecret(name, developmentFallback) {
  const value = process.env[name];
  if (value) return value;

  if (isProduction) {
    console.error(`❌ ${name} must be set when NODE_ENV=production. Refusing to start.`);
    process.exit(1);
  }

  console.warn(`⚠️  ${name} is not set — using an insecure development default.`);
  return developmentFallback;
}

module.exports = {
  isProduction,
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/biteBarometer',
  jwtSecret: requiredSecret('JWT_SECRET', 'bite-barometer-dev-key'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Absent key is handled per-request so the app still boots for auth-only work
  weatherApiKey: process.env.WEATHER_API_KEY || '',
};
