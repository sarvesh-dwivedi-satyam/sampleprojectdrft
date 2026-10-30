function classifyGoogleAccount(existingUser, identity) {
    if (!existingUser) return 'create';
    if (!existingUser.is_active) return 'disabled';
    if (existingUser.google_id === identity.googleId) return 'sign-in';
    if (existingUser.google_id) return 'conflict';
    if (String(existingUser.email).toLowerCase() !== identity.email) return 'conflict';
    if (existingUser.password_hash) return 'verify-password';
    return 'conflict';
}

module.exports = { classifyGoogleAccount };
