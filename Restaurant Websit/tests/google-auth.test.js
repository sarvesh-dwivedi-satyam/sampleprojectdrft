const test = require('node:test');
const assert = require('node:assert/strict');
const { constantTimeEqual, validateIdentity } = require('../server/services/google-auth');
const { classifyGoogleAccount } = require('../server/services/google-account');

const claims = {
    iss: 'https://accounts.google.com',
    sub: 'google-sub-123',
    email: 'diner@example.com',
    email_verified: true,
    nonce: 'one-time-nonce',
    name: 'Midnight Diner',
    picture: 'https://lh3.googleusercontent.com/profile-photo'
};
const identity = {
    googleId: 'google-sub-123',
    email: 'diner@example.com',
    fullName: 'Midnight Diner',
    profilePicture: 'https://lh3.googleusercontent.com/profile-photo'
};

test('validates verified Google identity claims and maps only required profile fields', () => {
    assert.deepEqual(validateIdentity(claims, 'one-time-nonce'), identity);
});

test('rejects unverified email, invalid issuer, and mismatched nonce', () => {
    assert.throws(() => validateIdentity({ ...claims, email_verified: false }, 'one-time-nonce'), /could not verify/);
    assert.throws(() => validateIdentity({ ...claims, iss: 'https://attacker.example' }, 'one-time-nonce'), /could not verify/);
    assert.throws(() => validateIdentity(claims, 'another-nonce'), /could not verify/);
});

test('constant-time state comparison rejects malformed and different values', () => {
    assert.equal(constantTimeEqual('same-state', 'same-state'), true);
    assert.equal(constantTimeEqual('same-state', 'other-state'), false);
    assert.equal(constantTimeEqual(['same-state'], 'same-state'), false);
    assert.equal(constantTimeEqual('short', 'longer'), false);
});

test('new verified identity can create an account', () => {
    assert.equal(classifyGoogleAccount(null, identity), 'create');
});

test('matching existing Google subject signs in, but same-email password account requires password verification', () => {
    assert.equal(classifyGoogleAccount({
        ...identity, google_id: identity.googleId, password_hash: null, is_active: true
    }, identity), 'sign-in');
    assert.equal(classifyGoogleAccount({
        email: identity.email, google_id: null, password_hash: 'bcrypt-hash', is_active: true
    }, identity), 'verify-password');
});

test('rejects inactive and conflicting identities instead of linking by email', () => {
    assert.equal(classifyGoogleAccount({
        email: identity.email, google_id: null, password_hash: null, is_active: false
    }, identity), 'disabled');
    assert.equal(classifyGoogleAccount({
        email: identity.email, google_id: 'different-google-sub', password_hash: 'bcrypt-hash', is_active: true
    }, identity), 'conflict');
    assert.equal(classifyGoogleAccount({
        email: 'different@example.com', google_id: null, password_hash: 'bcrypt-hash', is_active: true
    }, identity), 'conflict');
});
