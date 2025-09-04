// WebAuthn/Passkey debugging utility

export const checkWebAuthnSupport = () => {
  const results = {
    supported: false,
    publicKeyCredentialSupported: false,
    createSupported: false,
    getSupported: false,
    conditionalMediationSupported: false,
    userVerifyingPlatformAuthenticatorSupported: false,
    errors: []
  };

  try {
    // Check if PublicKeyCredential is supported
    if (typeof window.PublicKeyCredential !== 'undefined') {
      results.publicKeyCredentialSupported = true;
    } else {
      results.errors.push('PublicKeyCredential is not supported');
    }

    // Check if navigator.credentials is supported
    if (navigator.credentials) {
      if (navigator.credentials.create) {
        results.createSupported = true;
      } else {
        results.errors.push('navigator.credentials.create is not supported');
      }

      if (navigator.credentials.get) {
        results.getSupported = true;
      } else {
        results.errors.push('navigator.credentials.get is not supported');
      }
    } else {
      results.errors.push('navigator.credentials is not supported');
    }

    // Check if we're in a secure context
    if (!window.isSecureContext) {
      results.errors.push('Not in a secure context (HTTPS required for production)');
    }

    // Check conditional mediation support
    if (window.PublicKeyCredential && window.PublicKeyCredential.isConditionalMediationAvailable) {
      window.PublicKeyCredential.isConditionalMediationAvailable()
        .then(available => {
          results.conditionalMediationSupported = available;
        })
        .catch(err => {
          results.errors.push(`Conditional mediation check failed: ${err.message}`);
        });
    }

    // Check platform authenticator support
    if (window.PublicKeyCredential && window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => {
          results.userVerifyingPlatformAuthenticatorSupported = available;
        })
        .catch(err => {
          results.errors.push(`Platform authenticator check failed: ${err.message}`);
        });
    }

    results.supported = results.publicKeyCredentialSupported && results.createSupported && results.getSupported;

  } catch (error) {
    results.errors.push(`General error: ${error.message}`);
  }

  return results;
};

export const getEnvironmentInfo = () => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    port: window.location.port,
    isSecureContext: window.isSecureContext,
    localStorage: typeof localStorage !== 'undefined',
    sessionStorage: typeof sessionStorage !== 'undefined'
  };
};

export const testBasicWebAuthn = async () => {
  const results = {
    success: false,
    error: null,
    steps: []
  };

  try {
    results.steps.push('Checking WebAuthn support...');
    const support = checkWebAuthnSupport();
    
    if (!support.supported) {
      throw new Error(`WebAuthn not supported: ${support.errors.join(', ')}`);
    }
    results.steps.push('✓ WebAuthn is supported');

    results.steps.push('Creating test credential options...');
    const options = {
      challenge: new Uint8Array(32),
      rp: {
        name: 'Test Application',
        id: window.location.hostname
      },
      user: {
        id: new Uint8Array(16),
        name: 'test@example.com',
        displayName: 'Test User'
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' },
        { alg: -257, type: 'public-key' }
      ],
      authenticatorSelection: {
        authenticatorAttachment: undefined,
        requireResidentKey: false,
        residentKey: 'preferred',
        userVerification: 'preferred'
      },
      timeout: 60000,
      attestation: 'none'
    };
    results.steps.push('✓ Test options created');

    results.steps.push('Testing credential creation (will prompt user)...');
    // Note: This will actually prompt the user, so we don't run it automatically
    results.steps.push('⚠ Credential creation test skipped (would prompt user)');

    results.success = true;
    results.steps.push('✓ Basic WebAuthn test completed');

  } catch (error) {
    results.error = error.message;
    results.steps.push(`✗ Error: ${error.message}`);
  }

  return results;
};

export const debugPasskeyIssue = async (userId) => {
  console.log('=== PASSKEY DEBUG INFORMATION ===');
  
  // 1. Check WebAuthn support
  console.log('\n1. WebAuthn Support:');
  const support = checkWebAuthnSupport();
  console.table(support);

  // 2. Environment info
  console.log('\n2. Environment Information:');
  const env = getEnvironmentInfo();
  console.table(env);

  // 3. Test basic WebAuthn
  console.log('\n3. Basic WebAuthn Test:');
  const test = await testBasicWebAuthn();
  console.log(test);

  // 4. Test backend connection
  console.log('\n4. Backend Connection Test:');
  try {
    const response = await fetch('/api/webauthn/debug');
    const data = await response.json();
    console.log('Backend debug info:', data);
  } catch (error) {
    console.error('Backend connection failed:', error);
  }

  // 5. Test registration options
  if (userId) {
    console.log('\n5. Registration Options Test:');
    try {
      const response = await fetch('/api/webauthn/registration/options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, isPrimary: false })
      });
      const data = await response.json();
      console.log('Registration options response:', data);
    } catch (error) {
      console.error('Registration options failed:', error);
    }
  }

  console.log('\n=== END DEBUG INFORMATION ===');
};

// Export for console debugging
if (typeof window !== 'undefined') {
  window.passkeyDebug = {
    checkWebAuthnSupport,
    getEnvironmentInfo,
    testBasicWebAuthn,
    debugPasskeyIssue
  };
}
