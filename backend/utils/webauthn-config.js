const { hostname } = require('os');

const rpName = 'Purehealth Revenue Management System';

const productionDomain = process.env.RP_ID || process.env.DOMAIN || 'purehealth-diagnostic-center.vercel.app';

const isProduction = process.env.NODE_ENV === 'production' || 
                     process.env.VERCEL || 
                     process.env.VERCEL_URL ||
                     process.env.RENDER ||
                     process.env.RENDER_SERVICE_ID;

console.log('WebAuthn Environment Check:', {
  NODE_ENV: process.env.NODE_ENV,
  VERCEL: process.env.VERCEL,
  VERCEL_URL: process.env.VERCEL_URL,
  RENDER: process.env.RENDER,
  RENDER_SERVICE_ID: process.env.RENDER_SERVICE_ID,
  RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL,
  isProduction
});

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
    const origins = [];
    
    // Add primary origin
    if (origin) {
      origins.push(origin);
    }
    
    // Add Vercel URL if available
    if (process.env.VERCEL_URL && !origins.includes(`https://${process.env.VERCEL_URL}`)) {
      origins.push(`https://${process.env.VERCEL_URL}`);
    }
    
    // Add Render URL if available  
    if (process.env.RENDER_EXTERNAL_URL && !origins.includes(process.env.RENDER_EXTERNAL_URL)) {
      origins.push(process.env.RENDER_EXTERNAL_URL);
    }
    
    // Add the main production domain
    if (!origins.includes('https://purehealth-diagnostic-center.vercel.app')) {
      origins.push('https://purehealth-diagnostic-center.vercel.app');
    }
    
    // Add any additional custom domains
    if (process.env.CUSTOM_DOMAIN && !origins.includes(`https://${process.env.CUSTOM_DOMAIN}`)) {
      origins.push(`https://${process.env.CUSTOM_DOMAIN}`);
    }
    
    // Allow additional origins from environment variable
    if (process.env.ADDITIONAL_ORIGINS) {
      const additionalOrigins = process.env.ADDITIONAL_ORIGINS.split(',').map(o => o.trim());
      origins.push(...additionalOrigins);
    }
    
    console.log('Production origins configured:', origins);
    return origins.length > 0 ? origins : ['https://purehealth-diagnostic-center.vercel.app'];
  }
  
  return ['http://localhost:3000'];
};

const expectedOrigin = getAllowedOrigins(); 

console.log('WebAuthn Configuration:', {
  rpName,
  rpID,
  origin,
  expectedOrigin,
  isProduction,
  productionDomain
});

module.exports = {
  rpName,
  rpID,
  origin,
  expectedOrigin
}; 