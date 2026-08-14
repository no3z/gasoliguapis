"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ADSENSE_ACCOUNT } from "./site-config";

type AnalyticsParameters = Record<string, string | number | boolean | undefined>;
type TcfData = {
  eventStatus?: string;
  gdprApplies?: boolean;
  listenerId?: number;
  purpose?: { consents?: Record<string, boolean> };
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    gasoliguapisAnalyticsConsent?: boolean;
    gasoliguapisConsentDefaultsSet?: boolean;
    __tcfapi?: (
      command: string,
      version: number,
      callback: (data: TcfData, success: boolean) => void,
      parameter?: number,
    ) => void;
  }
}

const ANALYTICS_SCRIPT_ID = "gasoliguapis-google-analytics";
const ADSENSE_SCRIPT_ID = "gasoliguapis-google-adsense";
const POLICY_PATHS = new Set(["/privacidad", "/cookies"]);

function ensureGtag() {
  window.dataLayer ||= [];
  window.gtag ||= (...args: unknown[]) => { window.dataLayer?.push(args); };
  return window.gtag;
}

function setDefaultConsent() {
  if (window.gasoliguapisConsentDefaultsSet) return;
  window.gasoliguapisConsentDefaultsSet = true;
  window.gasoliguapisAnalyticsConsent = false;
  const gtag = ensureGtag();
  gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  });
  gtag("set", "ads_data_redaction", true);
}

function setAnalyticsConsent(granted: boolean) {
  window.gasoliguapisAnalyticsConsent = granted;
  ensureGtag()("consent", "update", { analytics_storage: granted ? "granted" : "denied" });
}

function removeAnalyticsCookies() {
  const names = document.cookie.split(";")
    .map((entry) => entry.split("=")[0]?.trim())
    .filter((name): name is string => Boolean(name?.startsWith("_ga")));
  for (const name of names) {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    document.cookie = `${name}=; Max-Age=0; Path=/; Domain=.gasoliguapis.es; SameSite=Lax`;
  }
}

function loadAdSense() {
  if (document.getElementById(ADSENSE_SCRIPT_ID)) return;
  const script = document.createElement("script");
  script.id = ADSENSE_SCRIPT_ID;
  script.async = true;
  script.crossOrigin = "anonymous";
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADSENSE_ACCOUNT)}`;
  document.head.appendChild(script);
}

function loadAnalytics(measurementId: string, onReady: () => void) {
  const gtag = ensureGtag();
  const existing = document.getElementById(ANALYTICS_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    onReady();
    return;
  }
  gtag("js", new Date());
  gtag("config", measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });
  const script = document.createElement("script");
  script.id = ANALYTICS_SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.addEventListener("load", onReady, { once: true });
  document.head.appendChild(script);
}

export function trackAnalyticsEvent(name: string, parameters: AnalyticsParameters = {}) {
  if (typeof window === "undefined" || !window.gtag || window.gasoliguapisAnalyticsConsent !== true) return;
  window.gtag("event", name, parameters);
}

export default function GooglePrivacyMeasurement() {
  const pathname = usePathname();
  const [measurementId, setMeasurementId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const isPolicyPage = POLICY_PATHS.has(pathname);

  useEffect(() => {
    if (isPolicyPage) return;
    setDefaultConsent();
    loadAdSense();
  }, [isPolicyPage]);

  useEffect(() => {
    let active = true;
    fetch("/api/config/analytics", { cache: "no-store" })
      .then(async (response) => response.ok ? await response.json() as { measurementId?: string | null } : null)
      .then((payload) => {
        if (active && payload?.measurementId) setMeasurementId(payload.measurementId);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!measurementId || isPolicyPage) return;
    let active = true;
    let listenerId: number | undefined;
    let attempts = 0;

    const connectToCmp = () => {
      if (!active) return;
      if (!window.__tcfapi) {
        attempts += 1;
        if (attempts < 60) window.setTimeout(connectToCmp, 150);
        return;
      }
      window.__tcfapi("addEventListener", 2, (tcData, success) => {
        if (!active || !success) return;
        listenerId = tcData.listenerId;
        if (tcData.eventStatus !== "tcloaded" && tcData.eventStatus !== "useractioncomplete") return;
        const granted = tcData.gdprApplies === false || tcData.purpose?.consents?.["1"] === true;
        setAnalyticsConsent(granted);
        if (granted) {
          loadAnalytics(measurementId, () => { if (active) setReady(true); });
        } else {
          setReady(false);
          removeAnalyticsCookies();
        }
      });
    };

    connectToCmp();
    return () => {
      active = false;
      if (listenerId !== undefined && window.__tcfapi) {
        window.__tcfapi("removeEventListener", 2, () => {}, listenerId);
      }
    };
  }, [isPolicyPage, measurementId]);

  useEffect(() => {
    if (!ready || !measurementId || isPolicyPage) return;
    window.gtag?.("event", "page_view", {
      page_title: document.title,
      page_location: window.location.href,
      page_path: pathname,
    });
  }, [isPolicyPage, measurementId, pathname, ready]);

  return null;
}
