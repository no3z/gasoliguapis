import { SITE_URL } from "./site-config";

export const INDEXNOW_KEY = "40095b3e43c3dc799e202e1fd0201195";
export const INDEXNOW_KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;

export async function notifyIndexNow(urls: string[]) {
  const urlList = [...new Set(urls)].filter((url) => url.startsWith(`${SITE_URL}/`) || url === SITE_URL);

  try {
    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: new URL(SITE_URL).host,
        key: INDEXNOW_KEY,
        keyLocation: INDEXNOW_KEY_LOCATION,
        urlList,
      }),
    });

    return { accepted: response.ok, status: response.status, submitted: urlList.length };
  } catch {
    return { accepted: false, status: null, submitted: urlList.length };
  }
}
