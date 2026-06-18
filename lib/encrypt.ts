import { EncryptJWT } from 'jose'

// Generate a secure encryption key (32-byte secret)
const secret = new TextEncoder().encode(process.env.ENCRYPTION_SECRET)

export async function encryptToken(token: string): Promise<string> {
  return await new EncryptJWT({ token })
    .setProtectedHeader({ alg: 'dir', enc: 'A256GCM' }) 
    .setIssuedAt()
    .setExpirationTime('24h') // Token wrapper expires in 24 hours
    .encrypt(secret)
}


