# Passkey Troubleshooting Guide

## Common "Not Allowed" Error Solutions

### 1. **Browser Support**
- **Chrome/Edge**: Works best, fully supported
- **Safari**: Supported on iOS 16+ and macOS Ventura+
- **Firefox**: Supported on version 122+
- **Avoid**: Internet Explorer, older browsers

### 2. **Device Requirements**
- **Windows**: Requires Windows Hello setup (PIN, fingerprint, face)
- **macOS**: Requires Touch ID or password
- **iOS/iPadOS**: Requires Face ID, Touch ID, or passcode
- **Android**: Requires screen lock (PIN, pattern, fingerprint, face)

### 3. **Common Fixes**

#### For Windows Users:
1. Open Windows Settings → Sign-in options
2. Set up Windows Hello PIN if not already done
3. Enable fingerprint or face recognition if available
4. Try using Edge browser instead of Chrome

#### For Mac Users:
1. Ensure Touch ID is set up and working
2. Try Safari browser first, then Chrome
3. Make sure macOS is up to date

#### For Mobile Users:
1. Ensure biometric authentication is enabled
2. Use Safari on iOS or Chrome on Android
3. Make sure the device has a screen lock

### 4. **Step-by-Step Process**
1. Click "Add Passkey" button
2. **Immediately** look for authentication prompt
3. **Quickly** authenticate when prompted (don't wait)
4. If nothing appears, check for popup blockers
5. If it fails, wait 10 seconds and try again

### 5. **Browser-Specific Issues**

#### Chrome/Edge:
- Check if site permissions are blocked
- Clear browser cache and cookies
- Disable popup blockers for this site
- Try incognito/private mode

#### Safari:
- Enable "Allow websites to use Face ID/Touch ID"
- Check Safari Settings → Privacy & Security

#### Firefox:
- Ensure Firefox is version 122 or newer
- Check about:config → security.webauth.webauthn

### 6. **Network/Security Issues**
- Ensure you're on HTTPS (not HTTP)
- Check if corporate firewall is blocking
- Try from a different network
- Disable VPN temporarily

### 7. **If Still Not Working**
1. Restart your browser completely
2. Restart your device
3. Try a different browser
4. Try from a different device
5. Contact IT support if on corporate network

### 8. **Debug Commands**
Open browser console (F12) and run:
```javascript
// Check WebAuthn support
console.log('WebAuthn supported:', !!navigator.credentials);
console.log('Create supported:', !!navigator.credentials?.create);
console.log('Secure context:', window.isSecureContext);

// Check platform authenticator
if (window.PublicKeyCredential) {
  window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    .then(available => console.log('Platform authenticator available:', available));
}

// Run full debug if utility is loaded
if (window.passkeyDebug) {
  window.passkeyDebug.debugPasskeyIssue('YOUR_USER_ID');
}
```

### 9. **Error Messages and Solutions**

| Error | Solution |
|-------|----------|
| "Not allowed" | User cancelled or device doesn't support method |
| "Invalid state" | Passkey already exists, try different device |
| "Not supported" | Browser/device doesn't support passkeys |
| "Security error" | Not HTTPS or device security issues |
| "Timeout" | User took too long to respond |
| "Constraint error" | Device doesn't meet requirements |

### 10. **Best Practices**
- **Be quick**: Respond to prompts within 30 seconds
- **Be ready**: Have authentication method ready before clicking
- **Stay focused**: Don't switch tabs or apps during process
- **One at a time**: Don't try multiple passkey operations simultaneously
