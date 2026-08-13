import { clearCookie, safeReturnTo, SESSION_COOKIE } from "../../../google-auth";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const headers = new Headers({
    location: safeReturnTo(requestUrl.searchParams.get("return_to")),
    "cache-control": "no-store",
  });
  clearCookie(headers, SESSION_COOKIE);
  return new Response(null, { status: 303, headers });
}
