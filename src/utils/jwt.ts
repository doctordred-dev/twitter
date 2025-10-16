import jwt, { type SignOptions, type Secret } from 'jsonwebtoken';

const accessExpiresIn: string = process.env.JWT_EXPIRES_IN || '1h';
const jwtSecret: Secret = (process.env.JWT_SECRET || 'dev_secret_change_me') as Secret;

export type JwtPayload = { userId: string; username: string };

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: accessExpiresIn as unknown as SignOptions['expiresIn'] };
  return jwt.sign(payload, jwtSecret, options);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, jwtSecret) as JwtPayload;
}


