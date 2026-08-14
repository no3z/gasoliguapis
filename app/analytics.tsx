"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type ConsentChoice = "accepted" | "rejected";
type AnalyticsParameters = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    gasoliguapisAnalyticsConsent?: boolean;
  }
}

const CONSENT_STORAGE_KEY = "gasoliguapis:analytics-consent:v1";
const OPEN_CONSENT_EVENT = "gasoliguapis:open-consent";
const SCRIPT_ID = "gasoliguapis-google-analytics";

function ensureGtag() {
  window.dataLayer ||= [];
  window.gtag ||= (...args: unknown[]) => { window.dataLayer?.push(args); };
  return window.gtag;
}

function setConsent(analytics: "granted" | "denied") {
  window.gasoliguapisAnalyticsConsent = analytics === "granted";
  const gtag = ensureGtag();
  gtag("consent", "update", {
    analytics_storage: analytics,
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
}

function setDefaultConsent() {
  window.gasoliguapisAnalyticsConsent = false;
  const gtag = ensureGtag();
  gtag("consent", "default", {
    analytics_storage: "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
  });
  gtag("set", "ads_data_redaction", true);
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

function loadAnalytics(measurementId: string, onReady: () => void) {
  const gtag = ensureGtag();
  setConsent("granted");
  gtag("js", new Date());
  gtag("config", measurementId, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
  });

  const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    onReady();
    return;
  }
  const script = document.createElement("script");
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
  script.addEventListener("load", onReady, { once: true });
  document.head.appendChild(script);
}

export function trackAnalyticsEvent(name: string, parameters: AnalyticsParameters = {}) {
  if (typeof window === "undefined" || !window.gtag || window.gasoliguapisAnalyticsConsent !== true) return;
  window.gtag("event", name, parameters);
}

export default function AnalyticsConsent() {
  const pathname = usePathname();
  const [measurementId, setMeasurementId] = useState<string | null>(null);
  const [choice, setChoice] = useState<ConsentChoice | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    setDefaultConsent();
    fetch("/api/config/analytics", { cache: "no-store" })
      .then(async (response) => response.ok ? await response.json() as { measurementId?: string | null } : null)
      .then((payload) => {
        if (!active || !payload?.measurementId) return;
        const id = payload.measurementId;
        setMeasurementId(id);
        let saved: ConsentChoice | null = null;
        try {
          const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
          if (stored === "accepted" || stored === "rejected") saved = stored;
        } catch {
          // The choice can still be used during this visit.
        }
        setChoice(saved);
        setShowBanner(saved === null);
        if (saved === "accepted") loadAnalytics(id, () => setReady(true));
      })
      .catch(() => {});
    const openSettings = () => setShowBanner(true);
    window.addEventListener(OPEN_CONSENT_EVENT, openSettings);
    return () => {
      active = false;
      window.removeEventListener(OPEN_CONSENT_EVENT, openSettings);
    };
  }, []);

  useEffect(() => {
    if (!ready || !measurementId) return;
    window.gtag?.("event", "page_view", {
      page_title: document.title,
      page_location: window.location.href,
      page_path: pathname,
    });
  }, [measurementId, pathname, ready]);

  const remember = (nextChoice: ConsentChoice) => {
    setChoice(nextChoice);
    setShowBanner(false);
    try { window.localStorage.setItem(CONSENT_STORAGE_KEY, nextChoice); } catch {
      // The choice still applies until this tab is closed.
    }
    if (nextChoice === "accepted" && measurementId) {
      loadAnalytics(measurementId, () => setReady(true));
      return;
    }
    setConsent("denied");
    setReady(false);
    removeAnalyticsCookies();
  };

  if (!measurementId) return null;

  return <>
    {showBanner ? (
      <section className="analytics-consent" role="region" aria-label="Preferencias de analítica">
        <div><strong>¿Nos ayudas a mejorar Gasoliguapis?</strong><p>Google Analytics nos permite saber qué búsquedas y funciones resultan útiles. Solo se activa si aceptas; no enviamos tu ubicación ni el texto que escribes.</p><Link href="/cookies">Ver política de cookies</Link></div>
        <div className="analytics-consent-actions">
          <button className="secondary" onClick={() => remember("rejected")}>Seguir sin analítica</button>
          <button className="primary" onClick={() => remember("accepted")}>Aceptar analítica</button>
        </div>
      </section>
    ) : (
      <button className="analytics-settings" onClick={() => setShowBanner(true)} aria-label="Cambiar preferencias de analítica">Privacidad{choice === "accepted" ? " · Analítica activa" : ""}</button>
    )}
  </>;
}
