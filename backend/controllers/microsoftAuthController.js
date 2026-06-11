const jwt = require('jsonwebtoken');
const { CryptoProvider } = require('@azure/msal-node');
const User = require('../models/User');
const { msalClient, REDIRECT_URI, MICROSOFT_SCOPES } = require('../config/msalClient');

const cryptoProvider = new CryptoProvider();

const FRONTEND_LOGIN = `${(process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '')}/login`;
const TOKEN_URL = `https://login.microsoftonline.com/${process.env.MICROSOFT_TENANT_ID}/oauth2/v2.0/token`;
const SCOPES = MICROSOFT_SCOPES.join(' ');

const createJwt = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });

const redirectWithError = (res, message) =>
  res.redirect(`${FRONTEND_LOGIN}?error=${encodeURIComponent(message)}`);

const buildAuthRedirect = (user) => {
  const payload = {
    token: createJwt(user),
    user: { id: user._id, name: user.name, email: user.email, role: user.role, joinedDate: user.createdAt },
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${FRONTEND_LOGIN}?auth=${encoded}`;
};

const upsertMicrosoftUser = exports.upsertMicrosoftUser = async ({ microsoftId, email, name }) => {
  let isNew = false;
  let user = microsoftId ? await User.findOne({ microsoftId }) : null;
  if (!user && email) user = await User.findOne({ email });

  if (!user) {
    isNew = true;
    user = await User.create({
      name,
      email,
      password: '',
      microsoftId,
      authProvider: 'microsoft',
      role: 'user',
      status: 'pending',
      isApproved: false,
    });
  } else {
    const patch = {};
    if (microsoftId && !user.microsoftId) patch.microsoftId = microsoftId;
    if (user.authProvider !== 'microsoft') patch.authProvider = 'microsoft';
    if (!user.name || user.name === user.email) patch.name = name;

    if (Object.keys(patch).length) {
      await User.updateOne({ _id: user._id }, { $set: patch });
      user = await User.findById(user._id);
    }
  }

  return { user, isNew };
};

exports.microsoftLogin = async (req, res) => {
  try {
    if (!process.env.MICROSOFT_CLIENT_ID || !process.env.MICROSOFT_TENANT_ID) {
      return redirectWithError(res, 'Microsoft login is not configured on the server.');
    }

    const { verifier, challenge } = await cryptoProvider.generatePkceCodes();
    req.session.msPkceVerifier = verifier;

    const authUrl = await msalClient.getAuthCodeUrl({
      scopes: MICROSOFT_SCOPES,
      redirectUri: REDIRECT_URI,
      responseMode: 'query',
      codeChallenge: challenge,
      codeChallengeMethod: 'S256',
    });

    return req.session.save((err) => {
      if (err) {
        console.error('[Microsoft Login] Session error:', err);
        return redirectWithError(res, 'Failed to start Microsoft login.');
      }
      return res.redirect(authUrl);
    });
  } catch (err) {
    console.error('[Microsoft Login]', err);
    return redirectWithError(res, err.message || 'Failed to start Microsoft login.');
  }
};

// SPA apps must redeem the auth code in the browser (cross-origin). This page does that.
exports.microsoftCallback = async (req, res) => {
  const { code, error, error_description: errorDescription } = req.query;

  if (error) {
    console.error('[Microsoft Callback]', error, errorDescription);
    return redirectWithError(res, errorDescription || error);
  }

  if (!code) {
    return redirectWithError(res, 'Microsoft login was not completed.');
  }

  const codeVerifier = req.session?.msPkceVerifier;
  delete req.session.msPkceVerifier;

  if (!codeVerifier) {
    return redirectWithError(res, 'Microsoft login session expired. Please try again.');
  }

  const authData = JSON.stringify({
    code,
    codeVerifier,
    clientId: process.env.MICROSOFT_CLIENT_ID,
    redirectUri: REDIRECT_URI,
    tokenUrl: TOKEN_URL,
    scopes: SCOPES,
    frontendLogin: FRONTEND_LOGIN,
  });

  return res.type('html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Signing in...</title>
  <style>
    body { font-family: system-ui, sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #334155; }
  </style>
</head>
<body>
  <p>Completing Microsoft sign-in...</p>
  <script>
    (async () => {
      const config = ${authData};
      try {
        const body = new URLSearchParams({
          client_id: config.clientId,
          grant_type: 'authorization_code',
          code: config.code,
          redirect_uri: config.redirectUri,
          code_verifier: config.codeVerifier,
          scope: config.scopes,
        });

        const tokenRes = await fetch(config.tokenUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body,
        });

        const tokens = await tokenRes.json();
        if (!tokenRes.ok) {
          throw new Error(tokens.error_description || tokens.error || 'Token exchange failed.');
        }

        const finishRes = await fetch('/api/auth/microsoft/finish', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accessToken: tokens.access_token }),
        });

        const result = await finishRes.json();
        if (!finishRes.ok) {
          throw new Error(result.message || 'Sign-in could not be completed.');
        }

        window.location.replace(result.redirect);
      } catch (err) {
        window.location.replace(config.frontendLogin + '?error=' + encodeURIComponent(err.message));
      }
    })();
  </script>
</body>
</html>`);
};

exports.microsoftFinish = async (req, res) => {
  try {
    const { accessToken } = req.body;
    if (!accessToken) {
      return res.status(400).json({ message: 'Microsoft access token is required.' });
    }

    const graphRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!graphRes.ok) {
      console.error('[Microsoft Finish] Graph error:', graphRes.status, await graphRes.text());
      return res.status(401).json({ message: 'Microsoft sign-in could not be verified.' });
    }

    const profile = await graphRes.json();
    const microsoftId = profile.id || '';
    const email = (profile.mail || profile.userPrincipalName || '').trim().toLowerCase();
    const name = profile.displayName || email || 'Microsoft User';

    if (!email && !microsoftId) {
      return res.status(400).json({ message: 'Unable to read Microsoft account details.' });
    }

    const { user, isNew } = await upsertMicrosoftUser({ microsoftId, email, name });

    if (isNew) {
      return res.json({
        redirect: `${FRONTEND_LOGIN}?success=${encodeURIComponent(
          'Your account request has been sent to the administrator for approval. Please wait until your account is approved.'
        )}`
      });
    }

    if (user.status === 'pending' || !user.isApproved) {
      return res.json({
        redirect: `${FRONTEND_LOGIN}?error=${encodeURIComponent(
          'Your account is pending administrator approval.'
        )}`
      });
    }

    if (user.status === 'rejected') {
      return res.json({
        redirect: `${FRONTEND_LOGIN}?error=${encodeURIComponent(
          'Your account access has been denied.'
        )}`
      });
    }

    return res.json({ redirect: buildAuthRedirect(user) });
  } catch (err) {
    console.error('[Microsoft Finish]', err);
    return res.status(500).json({ message: err.message || 'Microsoft login failed.' });
  }
};
