const { hostname } = require('os');

const rpName = 'Purehealth Profit Management System';
// Always use 'localhost' for development environment
const rpID = process.env.NODE_ENV === 'production';
const origin = process.env.NODE_ENV === 'production';

// Server-side origin check adjustment
// In production, set RP_ID to your actual domain
const expectedOrigin = process.env.NODE_ENV === 'production' 
  ? [origin]
  : ['http://localhost:3000']; 

module.exports = {
  rpName,
  rpID,
  origin,
  expectedOrigin
}; 