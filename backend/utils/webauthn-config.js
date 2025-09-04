const { hostname } = require('os');

const rpName = 'Purehealth Profit Management System';
// Always use 'localhost' for development environment
const rpID = process.env.NODE_ENV === 'production' ? process.env.RP_ID : 'localhost';

// Handle different development scenarios
let origin;
let expectedOrigin;

if (process.env.NODE_ENV === 'production') {
  origin = process.env.ORIGIN;
  expectedOrigin = [origin];
} else {
  // Development - support multiple common development URLs
  const devOrigins = [
    'http://localhost:3000',
    'http://localhost:5173', // Vite default
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173'
  ];
  origin = 'http://localhost:3000';
  expectedOrigin = devOrigins;
}

console.log('WebAuthn Configuration:');
console.log('- Environment:', process.env.NODE_ENV || 'development');
console.log('- RP ID:', rpID);
console.log('- Origin:', origin);
console.log('- Expected Origins:', expectedOrigin);

module.exports = {
  rpName,
  rpID,
  origin,
  expectedOrigin
}; 