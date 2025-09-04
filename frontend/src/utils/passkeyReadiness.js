// Browser compatibility and readiness checker for passkeys
export const checkPasskeyReadiness = async () => {
  const results = {
    compatible: false,
    ready: false,
    issues: [],
    recommendations: [],
    browserInfo: {},
    deviceInfo: {}
  };

  try {
    // Get browser info
    const userAgent = navigator.userAgent;
    results.browserInfo = {
      userAgent,
      isChrome: /Chrome/i.test(userAgent) && !/Edge/i.test(userAgent),
      isEdge: /Edge/i.test(userAgent),
      isSafari: /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent),
      isFirefox: /Firefox/i.test(userAgent),
      platform: navigator.platform,
      language: navigator.language
    };

    // Check basic WebAuthn support
    if (!window.PublicKeyCredential) {
      results.issues.push('WebAuthn not supported by browser');
      results.recommendations.push('Update to latest Chrome, Edge, Safari, or Firefox');
      return results;
    }

    if (!navigator.credentials || !navigator.credentials.create) {
      results.issues.push('Credentials API not available');
      results.recommendations.push('Update your browser or try a different one');
      return results;
    }

    results.compatible = true;

    // Check secure context
    if (!window.isSecureContext) {
      results.issues.push('Not in secure context (HTTPS required)');
      results.recommendations.push('Ensure you are accessing the site via HTTPS');
    }

    // Check platform authenticator availability
    try {
      const platformAvailable = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      results.deviceInfo.platformAuthenticator = platformAvailable;
      
      if (!platformAvailable) {
        results.issues.push('Platform authenticator not available');
        if (results.browserInfo.platform.includes('Win')) {
          results.recommendations.push('Set up Windows Hello (PIN, fingerprint, or face recognition)');
        } else if (results.browserInfo.platform.includes('Mac')) {
          results.recommendations.push('Ensure Touch ID is set up and working');
        } else {
          results.recommendations.push('Ensure device has biometric authentication or screen lock enabled');
        }
      }
    } catch (err) {
      results.issues.push('Could not check platform authenticator availability');
    }

    // Check conditional mediation (if available)
    try {
      if (window.PublicKeyCredential.isConditionalMediationAvailable) {
        const conditionalAvailable = await window.PublicKeyCredential.isConditionalMediationAvailable();
        results.deviceInfo.conditionalMediation = conditionalAvailable;
      }
    } catch (err) {
      // Not critical, continue
    }

    // Browser-specific checks
    if (results.browserInfo.isChrome || results.browserInfo.isEdge) {
      // Chrome/Edge specific checks
      results.deviceInfo.browserType = 'chromium';
    } else if (results.browserInfo.isSafari) {
      // Safari specific checks
      results.deviceInfo.browserType = 'safari';
      if (results.browserInfo.platform.includes('iPhone') || results.browserInfo.platform.includes('iPad')) {
        results.recommendations.push('Ensure iOS 16+ for best passkey support');
      }
    } else if (results.browserInfo.isFirefox) {
      // Firefox specific checks
      results.deviceInfo.browserType = 'firefox';
      results.recommendations.push('Ensure Firefox 122+ for passkey support');
    } else {
      results.issues.push('Browser may have limited passkey support');
      results.recommendations.push('Try Chrome, Edge, Safari, or Firefox for best results');
    }

    // Determine if ready
    results.ready = results.compatible && results.issues.length === 0;

    // Add general recommendations
    if (!results.ready) {
      results.recommendations.push('Close other authentication dialogs before trying');
      results.recommendations.push('Ensure stable internet connection');
      results.recommendations.push('Try refreshing the page if issues persist');
    }

  } catch (error) {
    results.issues.push(`Error checking readiness: ${error.message}`);
  }

  return results;
};

// Quick readiness check with user-friendly display
export const showPasskeyReadinessStatus = async () => {
  const status = await checkPasskeyReadiness();
  
  console.group('🔐 Passkey Readiness Check');
  console.log('Compatible:', status.compatible ? '✅' : '❌');
  console.log('Ready:', status.ready ? '✅' : '❌');
  
  if (status.issues.length > 0) {
    console.group('❌ Issues Found:');
    status.issues.forEach(issue => console.log('•', issue));
    console.groupEnd();
  }
  
  if (status.recommendations.length > 0) {
    console.group('💡 Recommendations:');
    status.recommendations.forEach(rec => console.log('•', rec));
    console.groupEnd();
  }
  
  console.log('Browser Info:', status.browserInfo);
  console.log('Device Info:', status.deviceInfo);
  console.groupEnd();
  
  return status;
};

// Auto-run check in development
if (import.meta.env.DEV) {
  // Wait a bit for page to load
  setTimeout(showPasskeyReadinessStatus, 2000);
}
