import { jwtDecrypt } from 'jose';

// Generate a secure encryption key (32-byte secret)
const secret = new TextEncoder().encode(process.env.ENCRYPTION_SECRET);

export async function decryptToken(encryptedToken: string): Promise<string | null> {
  try {
    const { payload } = await jwtDecrypt(encryptedToken, secret);
    return payload.token as string;
  } catch (error) {
    console.error('Token decryption failed:', error);
    return null;
  }
}


