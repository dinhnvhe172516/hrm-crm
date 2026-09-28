const UserCredential    = require('./UserCredential.model');
const UserSession       = require('./UserSession.model');
const RefreshToken      = require('./RefreshToken.model');
const PasswordResetToken= require('./PasswordResetToken.model');
const EmailVerification = require('./EmailVerification.model');
const TwoFactorAuth     = require('./TwoFactorAuth.model');
const LoginHistory      = require('./LoginHistory.model');
const OAuthAccount      = require('./OAuthAccount.model');

module.exports = { UserCredential, UserSession, RefreshToken, PasswordResetToken, EmailVerification, TwoFactorAuth, LoginHistory, OAuthAccount };
