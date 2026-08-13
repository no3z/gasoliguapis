import { getAuthenticatedUser } from "../../google-auth";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);
  return Response.json(
    user ? { signedIn: true, displayName: user.displayName } : { signedIn: false, displayName: null },
    { headers: { "cache-control": "private, no-store" } },
  );
}
