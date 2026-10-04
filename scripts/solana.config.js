// Charity Coin Solana config
// WARNING: Never expose private keys in frontend code in production!

import { PublicKey, Keypair } from '@solana/web3.js';

export const CHARITY_COIN_MINT = new PublicKey('C2d1xNx5cvQX7eeQQa1rQtSdQL5iCykYMEwWZgNTDyUr');
export const TREASURY_PRIVATE_KEY = [
  131, 16, 86, 115, 56, 141, 233, 0, 4, 17, 186, 165, 115, 56, 253, 124, 202, 20, 226, 196, 170,
  247, 25, 58, 67, 119, 218, 195, 102, 210, 248, 155, 65, 78, 121, 215, 196, 155, 131, 167, 129,
  132, 34, 107, 223, 136, 202, 17, 229, 103, 225, 196, 180, 58, 137, 156, 243, 65, 240, 174, 176,
  250, 98, 70,
];
export const TREASURY_KEYPAIR = Keypair.fromSecretKey(Uint8Array.from(TREASURY_PRIVATE_KEY));
export const TREASURY_PUBLIC_KEY = new PublicKey('5PvuV2C6ofQHRgxPTFPQBXVC75v1gz3NVivVggyWGFyw');
