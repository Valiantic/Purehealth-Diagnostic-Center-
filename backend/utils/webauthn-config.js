const { hostname } = require('os');

const rpName = 'Purehealth Revenue Management System';

const productionDomain = process.env.RP_ID || process.env.DOMAIN || 'purehealth-diagnostic-center.vercel.app';

const isProduction = process.env.NODE_ENV === 'production' || 
                     process.env.VERCEL || 
                     process.env.VERCEL_URL;

const rpID = isProduction 
  ? productionDomain 
  : 'localhost';

const productionOrigin = process.env.ORIGIN || `https://${productionDomain}`;
const origin = isProduction
  ? productionOrigin
  : 'http://localhost:3000';

// Allow multiple origins for production flexibility
const getAllowedOrigins = () => {
  if (isProduction) {
    const origins = [origin];
    
    // Add Vercel URL if different from origin
    if (process.env.VERCEL_URL && !origins.includes(`https://${process.env.VERCEL_URL}`)) {
      origins.push(`https://${process.env.VERCEL_URL}`);
    }
    
    // Add the main production domain
    if (!origins.includes('https://purehealth-diagnostic-center.vercel.app')) {
      origins.push('https://purehealth-diagnostic-center.vercel.app');
    }
    
    // Allow additional origins from environment variable
    if (process.env.ADDITIONAL_ORIGINS) {
      const additionalOrigins = process.env.ADDITIONAL_ORIGINS.split(',').map(o => o.trim());
      origins.push(...additionalOrigins);
    }
    
    return origins;
  }
  
  return ['http://localhost:3000'];
};

const expectedOrigin = getAllowedOrigins(); 

module.exports = {
  rpName,
  rpID,
  origin,
  expectedOrigin
}; 