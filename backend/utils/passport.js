const passport = require('passport');
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const User = require('../models/User');

passport.use(new MicrosoftStrategy({
  clientID: process.env.MICROSOFT_CLIENT_ID,
  clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
  callbackURL: `${process.env.BACKEND_URL}/api/auth/microsoft/callback`,
  tenant: process.env.MICROSOFT_TENANT_ID,
  scope: ['user.read'],
},
async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails && profile.emails[0] && profile.emails[0].value;
    const name = profile.displayName || profile.name?.givenName || 'Microsoft User';

    if (!email) {
      return done(new Error('No email found in Microsoft profile'), null);
    }

    // Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // Update microsoftId if not set
      if (!user.microsoftId) {
        user.microsoftId = profile.id;
        await user.save();
      }
      return done(null, user);
    }

    // New user - create with pending status (admin must approve)
    user = await User.create({
      name,
      email,
      microsoftId: profile.id,
      role: 'user',
      status: 'pending',
    });

    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
