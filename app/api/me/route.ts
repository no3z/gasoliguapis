import { getChatGPTUser } from "../../chatgpt-auth";

export async function GET() {
  const user = await getChatGPTUser();
  return Response.json(
    user ? { signedIn: true, displayName: user.displayName } : { signedIn: false, displayName: null },
    { headers: { "cache-control": "private, no-store" } },
  );
}
