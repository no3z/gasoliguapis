import type { Metadata } from "next";
import StationExplorer from "./station-explorer";
import { chatGPTSignInPath, getChatGPTUser } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gasoliguapis — Tu mejor parada en carretera",
  description:
    "Encuentra gasolineras con buen café, baños limpios y precios actualizados en las carreteras de España.",
};

export default async function Home() {
  const user = await getChatGPTUser();
  return (
    <StationExplorer
      currentUser={user ? { signedIn: true, displayName: user.displayName } : { signedIn: false, displayName: null }}
      signInPath={chatGPTSignInPath("/")}
    />
  );
}
