import {
  appendCookie,
  authEnv,
  clearCookie,
  createSessionToken,
  OAUTH_RETURN_COOKIE,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  readCookie,
  safeDecode,
  safeReturnTo,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "../../../../google-auth";

type TokenResponse = { access_token?: string };
type GoogleProfile = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
};

function finishHeaders(location: string) {
  const headers = new Headers({ location, "cache-control": "no-store" });
  clearCookie(headers, OAUTH_STATE_COOKIE, "/api/auth/google");
  clearCookie(headers, OAUTH_VERIFIER_COOKIE, "/api/auth/google");
  clearCookie(headers, OAUTH_RETURN_COOKIE, "/api/auth/google");
  return headers;
}

function errorLocation(returnTo: string) {
  const url = new URL(returnTo, "https://gasoliguapis.es");
  url.searchParams.set("auth_error", "google");
  return `${url.pathname}${url.search}${url.hash}`;
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const storedReturnTo = readCookie(request, OAUTH_RETURN_COOKIE);
  const returnTo = safeReturnTo(storedReturnTo ? safeDecode(storedReturnTo) : "/");
  const storedState = readCookie(request, OAUTH_STATE_COOKIE);
  const verifier = readCookie(request, OAUTH_VERIFIER_COOKIE);
  const state = requestUrl.searchParams.get("state");
  const code = requestUrl.searchParams.get("code");
  if (!storedState || !state || !verifier || !code || storedState !== state || requestUrl.searchParams.has("error")) {
    return new Response(null, { status: 303, headers: finishHeaders(errorLocation(returnTo)) });
  }

  try {
    const configuration = authEnv();
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: configuration.GOOGLE_CLIENT_ID,
        client_secret: configuration.GOOGLE_CLIENT_SECRET,
        redirect_uri: configuration.GOOGLE_REDIRECT_URI,
        code_verifier: verifier,
      }),
    });
    if (!tokenResponse.ok) throw new Error("Google token exchange failed");
    const token = await tokenResponse.json() as TokenResponse;
    if (!token.access_token) throw new Error("Google access token missing");

    const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { authorization: `Bearer ${token.access_token}`, accept: "application/json" },
    });
    if (!profileResponse.ok) throw new Error("Google profile request failed");
    const profile = await profileResponse.json() as GoogleProfile;
    if (!profile.sub || !profile.email || profile.email_verified !== true) {
      throw new Error("Google profile is not verified");
    }

    const sessionToken = await createSessionToken({
      provider: "google",
      userId: profile.sub,
      email: profile.email,
      displayName: profile.given_name || profile.name || profile.email,
    });
    const headers = finishHeaders(returnTo);
    appendCookie(headers, SESSION_COOKIE, sessionToken, { maxAge: SESSION_MAX_AGE });
    return new Response(null, { status: 303, headers });
  } catch {
    return new Response(null, { status: 303, headers: finishHeaders(errorLocation(returnTo)) });
  }
}
