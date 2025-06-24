const { hostname } = require('os');

const rpName = 'Purehealth Revenue Management System';

const productionDomain = process.env.DOMAIN || 'purehealth-diagnostic-center.vercel.app';

const rpID = process.env.NODE_ENV === 'production' 
  ? productionDomain 
  : 'localhost';

const origin = process.env.NODE_ENV === 'production'
  ? `https://${productionDomain}`
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