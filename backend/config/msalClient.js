const msal = require('@azure/msal-node');

const REDIRECT_URI = 'http://localhost:5001/api/auth/microsoft/callback';

const msalConfig = {
  auth: {
    clientId:  process.env.MICROSOFT_CLIENT_ID,
    authority: `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}`,
  },
};

// Public client + PKCE. Token redemption runs in the browser on the callback page (SPA requirement).
const msalClient = new msal.PublicClientApplication(msalConfig);

const MICROSOFT_SCOPES = ['openid', 'profile', 'email', 'User.Read'];

module.exports = { msalClient, REDIRECT_URI, MICROSOFT_SCOPES };
