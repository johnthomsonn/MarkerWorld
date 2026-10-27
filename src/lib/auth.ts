import crypto from 'crypto';
import { cookies } from 'next/headers';
import prisma from './prisma';

const SESSION_COOKIE_NAME = 'markerworld_session';
const SECRET_KEY = process.env.JWT_SECRET || 'markerworld-default-secret-salt-2026';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [salt, key] = stored.split(':');
    if (!salt || !key) return false;
    const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(testHash, 'hex'), Buffer.from(key, 'hex'));
  } catch {
    return false;
  }
}

export function createSessionToken(userId: string): string {
  const payload = JSON.stringify({ userId, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 });
  const hmac = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
  return Buffer.from(`${payload}::${hmac}`).toString('base64url');
}

export function verifySessionToken(token: string): { userId: string } | null {
  try {
    const raw = Buffer.from(token, 'base64url').toString('utf8');
    const [payloadStr, signature] = raw.split('::');
    if (!payloadStr || !signature) return null;

    const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(payloadStr).digest('hex');
    if (signature !== expectedSig) return null;

    const data = JSON.parse(payloadStr);
    if (data.exp && Date.now() > data.exp) return null;
    return { userId: data.userId };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const session = verifySessionToken(token);
    if (!session?.userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return user;
  } catch (err) {
    console.error('Error fetching current user:', err);
    return null;
  }
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}
