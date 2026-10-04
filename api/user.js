/**
 * Charity Coin API: DDME integration
 * GET /api/user?email=... → { registered, walletAddress }
 *
 * Used by DDME to check if a user is registered and fetch their Solana wallet address.
 * Requires FIREBASE_SERVICE_ACCOUNT env var (JSON string of Firebase service account key).
 */

import admin from 'firebase-admin';

function getAdmin() {
  if (admin.apps.length) return admin;
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount || typeof serviceAccount !== 'string') {
    throw new Error('FIREBASE_SERVICE_ACCOUNT env var required for DDME API');
  }
  const trimmed = serviceAccount.trim();
  if (!trimmed.startsWith('{')) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT must be valid JSON starting with {. ' +
      'Paste the full service account key from Firebase Console (no YAML, no extra formatting).'
    );
  }
  let parsed;
  try {
    parsed = JSON.parse(trimmed);
  } catch (parseErr) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT JSON is invalid: ' + parseErr.message + '. ' +
      'Ensure you pasted the complete JSON from Firebase Console → Project Settings → Service Accounts → Generate new private key.'
    );
  }
  if (!parsed.project_id || !parsed.private_key) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT must include project_id and private_key');
  }
  admin.initializeApp({ credential: admin.credential.cert(parsed) });
  return admin;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const email = req.query.email?.trim?.();
  if (!email) {
    return res.status(400).json({ error: 'email query parameter required' });
  }

  try {
    const db = getAdmin().firestore();
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).limit(1).get();

    if (snapshot.empty) {
      return res.status(200).json({ registered: false });
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    const walletAddress =
      data.solanaWallet ||
      data.custodialWallet?.address ||
      null;

    return res.status(200).json({
      registered: true,
      walletAddress: walletAddress || undefined,
    });
  } catch (err) {
    console.error('Charity Coin API error:', err);
    return res.status(500).json({
      error: err.message || 'Internal server error',
      registered: false,
    });
  }
}
