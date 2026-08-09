import jwt from 'jsonwebtoken';

export interface AuthTokenPayload {
  userId: string;
  role: 'buyer' | 'seller' | 'admin';
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set - refusing to sign or verify tokens');
  }
  return secret;
}

export function signToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '30d' });
}

export function verifyToken(token: string): AuthTokenPayload {
  return jwt.verify(token, getSecret()) as AuthTokenPayload;
}
