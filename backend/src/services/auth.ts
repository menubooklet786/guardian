import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db } from '../models/db.js';
import { accounts, pairingCodes, children, devices } from '../models/schema.js';
import { eq, and, gt } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const BCRYPT_ROUNDS = 12;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  accountId: string;
  type: 'parent' | 'device';
  childId?: string;
}

export class AuthService {
  async register(email: string, password: string): Promise<{ account: typeof accounts.$inferSelect; tokens: TokenPair }> {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const [account] = await db.insert(accounts).values({
      email,
      passwordHash,
    }).returning();

    const tokens = this.generateTokens({ accountId: account.id, type: 'parent' });
    return { account, tokens };
  }

  async login(email: string, password: string): Promise<TokenPair | null> {
    const [account] = await db.select().from(accounts).where(eq(accounts.email, email)).limit(1);
    if (!account) return null;

    const valid = await bcrypt.compare(password, account.passwordHash);
    if (!valid) return null;

    return this.generateTokens({ accountId: account.id, type: 'parent' });
  }

  async refresh(refreshToken: string): Promise<TokenPair | null> {
    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as JwtPayload & { iat?: number; exp?: number; nbf?: number };
      const { iat, exp, nbf, ...payload } = decoded;
      return this.generateTokens(payload);
    } catch {
      return null;
    }
  }

  generatePairingCode(accountId: string, childId?: string): string {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    db.insert(pairingCodes).values({
      accountId,
      childId: childId || null,
      code,
      expiresAt,
    }).execute();

    return code;
  }

  async pairDevice(code: string, deviceInfo: {
    model?: string;
    manufacturer?: string;
    androidVersion?: string;
    sdkVersion?: number;
    appVersion?: string;
    oem?: string;
  }): Promise<{ deviceToken: string; deviceId: string; childId: string } | null> {
    const [pairing] = await db.select().from(pairingCodes)
      .where(and(
        eq(pairingCodes.code, code),
        eq(pairingCodes.used, false),
        gt(pairingCodes.expiresAt, new Date()),
      ))
      .limit(1);

    if (!pairing) return null;

    let childId = pairing.childId;
    if (!childId) {
      const [child] = await db.insert(children).values({
        accountId: pairing.accountId,
        name: 'New Device',
      }).returning();
      childId = child.id;
    }

    const deviceToken = uuidv4();
    const [device] = await db.insert(devices).values({
      childId,
      deviceToken,
      ...deviceInfo,
    }).returning();

    await db.update(pairingCodes).set({ used: true }).where(eq(pairingCodes.id, pairing.id));
    await db.update(children).set({ deviceId: deviceToken }).where(eq(children.id, childId));

    return { deviceToken, deviceId: device.id, childId };
  }

  generateTokens(payload: JwtPayload): TokenPair {
    const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
    return { accessToken, refreshToken };
  }

  verifyToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      return null;
    }
  }

  verifyDeviceToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch {
      return null;
    }
  }
}

export const authService = new AuthService();
