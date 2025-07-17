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

const expectedOrigin = process.env.NODE_ENV === 'production' 
  ? [origin]
  : ['http://localhost:3000']; 

module.exports = {
  rpName,
  rpID,
  origin,
  expectedOrigin
}; 