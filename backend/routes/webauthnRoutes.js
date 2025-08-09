const express = require('express');
const router = express.Router();
const webauthnController = require('../controllers/webauthnController');

// Temporary registration routes (no user created yet)
router.post('/registration/temp/options', webauthnController.tempRegistrationOptions);
router.post('/registration/temp/verify', webauthnController.tempRegistrationVerify);

// Registration routes
router.post('/registration/options', webauthnController.registrationOptions);
router.post('/registration/verify', webauthnController.registrationVerify);

// Authentication routes
router.post('/authentication/options', webauthnController.authenticationOptions);
router.post('/authentication/verify', webauthnController.authenticationVerify);

// Passkey management routes
router.get('/passkeys/:userId', webauthnController.getUserPasskeys);
router.delete('/passkeys/:passkeyId', webauthnController.deletePasskey);
router.put('/passkeys/:passkeyId/primary', webauthnController.setPrimaryPasskey);

module.exports = router;