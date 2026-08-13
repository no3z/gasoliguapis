import {
  appendCookie,
  authEnv,
  OAUTH_MAX_AGE,
  OAUTH_RETURN_COOKIE,
  OAUTH_STATE_COOKIE,
  OAUTH_VERIFIER_COOKIE,
  randomToken,
  safeReturnTo,
  sha256,
} from "../../../../google-auth";

export async function GET(request: Request) {
  let configuration: ReturnType<typeof authEnv>;
  try {
    configuration = authEnv();
  } catch {
    return Response.json({ error: "El acceso con Google todavía no está configurado" }, { status: 503 });
  }

  const requestUrl = new URL(request.url);
  const returnTo = safeReturnTo(requestUrl.searchParams.get("return_to"));
  const state = randomToken();
  const verifier = randomToken(48);
  const challenge = await sha256(verifier);
  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.searchParams.set("client_id", configuration.GOOGLE_CLIENT_ID);
  authorizationUrl.searchParams.set("redirect_uri", configuration.GOOGLE_REDIRECT_URI);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", "openid email profile");
  authorizationUrl.searchParams.set("state", state);
  authorizationUrl.searchParams.set("code_challenge", challenge);
  authorizationUrl.searchParams.set("code_challenge_method", "S256");
  authorizationUrl.searchParams.set("prompt", "select_account");

  const headers = new Headers({ location: authorizationUrl.toString(), "cache-control": "no-store" });
  appendCookie(headers, OAUTH_STATE_COOKIE, state, { maxAge: OAUTH_MAX_AGE, path: "/api/auth/google" });
  appendCookie(headers, OAUTH_VERIFIER_COOKIE, verifier, { maxAge: OAUTH_MAX_AGE, path: "/api/auth/google" });
  appendCookie(headers, OAUTH_RETURN_COOKIE, encodeURIComponent(returnTo), { maxAge: OAUTH_MAX_AGE, path: "/api/auth/google" });
  return new Response(null, { status: 302, headers });
}
