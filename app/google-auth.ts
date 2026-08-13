import { env } from "cloudflare:workers";

export type AuthenticatedUser = {
  provider: "google";
  userId: string;
  displayName: string;
  email: string;
};

type AuthEnv = {
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
  SESSION_SECRET?: string;
};

type SessionPayload = AuthenticatedUser & {
  issuedAt: number;
  expiresAt: number;
};

export const SESSION_COOKIE = "gasoliguapis_session";
export const OAUTH_STATE_COOKIE = "gasoliguapis_oauth_state";
export const OAUTH_VERIFIER_COOKIE = "gasoliguapis_oauth_verifier";
export const OAUTH_RETURN_COOKIE = "gasoliguapis_oauth_return";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
export const OAUTH_MAX_AGE = 60 * 10;

export function authEnv(): Required<AuthEnv> {
  const runtime = env as unknown as AuthEnv;
  const values = {
    GOOGLE_CLIENT_ID: runtime.GOOGLE_CLIENT_ID?.trim(),
    GOOGLE_CLIENT_SECRET: runtime.GOOGLE_CLIENT_SECRET?.trim(),
    GOOGLE_REDIRECT_URI: runtime.GOOGLE_REDIRECT_URI?.trim(),
    SESSION_SECRET: runtime.SESSION_SECRET?.trim(),
  };
  if (!values.GOOGLE_CLIENT_ID || !values.GOOGLE_CLIENT_SECRET || !values.GOOGLE_REDIRECT_URI
    || !values.SESSION_SECRET || values.SESSION_SECRET.length < 32) {
    throw new Error("Google authentication is not configured");
  }
  return values as Required<AuthEnv>;
}

export async function getAuthenticatedUser(request: Request): Promise<AuthenticatedUser | null> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) return null;

  const [encodedPayload, encodedSignature, ...extra] = token.split(".");
  if (!encodedPayload || !encodedSignature || extra.length) return null;

  let secret: string;
  try {
    secret = authEnv().SESSION_SECRET;
  } catch {
    return null;
  }

  const expectedSignature = await hmac(encodedPayload, secret);
  if (!constantTimeEqual(encodedSignature, expectedSignature)) return null;

  try {
    const payload = JSON.parse(decodeText(encodedPayload)) as Partial<SessionPayload>;
    if (payload.provider !== "google" || typeof payload.userId !== "string" || !payload.userId
      || typeof payload.email !== "string" || !payload.email
      || typeof payload.displayName !== "string" || !payload.displayName
      || typeof payload.expiresAt !== "number" || payload.expiresAt <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    return {
      provider: "google",
      userId: payload.userId,
      displayName: payload.displayName,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

export async function createSessionToken(user: AuthenticatedUser): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    ...user,
    issuedAt: now,
    expiresAt: now + SESSION_MAX_AGE,
  };
  const encodedPayload = encodeText(JSON.stringify(payload));
  const signature = await hmac(encodedPayload, authEnv().SESSION_SECRET);
  return `${encodedPayload}.${signature}`;
}

export function readCookie(request: Request, name: string): string | null {
  const cookies = request.headers.get("cookie") || "";
  for (const entry of cookies.split(";")) {
    const separator = entry.indexOf("=");
    if (separator < 0) continue;
    if (entry.slice(0, separator).trim() === name) return entry.slice(separator + 1).trim();
  }
  return null;
}

export function safeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  try {
    const url = new URL(value, "https://gasoliguapis.es");
    if (url.origin !== "https://gasoliguapis.es" || url.pathname.startsWith("/api/auth/")) return "/";
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

export function safeDecode(value: string, fallback = "/"): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return fallback;
  }
}

export function randomToken(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return encodeBytes(bytes);
}

export async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return encodeBytes(new Uint8Array(digest));
}

export function appendCookie(headers: Headers, name: string, value: string, options: {
  maxAge: number;
  path?: string;
}) {
  headers.append("set-cookie", `${name}=${value}; Path=${options.path || "/"}; HttpOnly; Secure; SameSite=Lax; Max-Age=${options.maxAge}`);
}

export function clearCookie(headers: Headers, name: string, path = "/") {
  headers.append("set-cookie", `${name}=; Path=${path}; HttpOnly; Secure; SameSite=Lax; Max-Age=0`);
}

function encodeText(value: string): string {
  return encodeBytes(new TextEncoder().encode(value));
}

function decodeText(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBytes(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return encodeBytes(new Uint8Array(signature));
}

function constantTimeEqual(left: string, right: string): boolean {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return difference === 0;
}
