"use client";

import {
  Bell,
  Bookmark,
  Check,
  ChevronDown,
  Droplets,
  Fuel,
  Heart,
  ListFilter,
  LocateFixed,
  MapPin,
  Navigation,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type FuelCode = "diesel_a" | "gasoline_95_e5" | "lpg" | "adblue";
type ProductCode = "lpg" | "adblue";

type OfficialStation = {
  id: string;
  name: string;
  brand: string | null;
  address: string | null;
  municipality: string | null;
  province: string | null;
  latE6: number;
  lngE6: number;
  priceMicros: number;
  currency: string;
  priceObservedAt: number;
  lpgPriceMicros: number | null;
  lpgObservedAt: number | null;
  adbluePriceMicros: number | null;
  adblueObservedAt: number | null;
};

const routes = ["A-2 · Zaragoza", "A-6 · A Coruña", "A-1 · Burgos", "A-4 · Sevilla"];
const routeProvince: Record<string, string> = {
  "A-2": "Guadalajara",
  "A-6": "Valladolid",
  "A-1": "Burgos",
  "A-4": "Toledo",
};
const fuelOptions: { code: FuelCode; label: string; short: string }[] = [
  { code: "diesel_a", label: "Gasóleo A", short: "Diésel" },
  { code: "gasoline_95_e5", label: "Gasolina 95", short: "95" },
  { code: "lpg", label: "GLP", short: "GLP" },
  { code: "adblue", label: "AdBlue", short: "AdBlue" },
];

export default function StationExplorer({
  signInPath,
}: {
  signInPath: string;
}) {
  const [query, setQuery] = useState("");
  const [route, setRoute] = useState(routes[0]);
  const [fuel, setFuel] = useState<FuelCode>("diesel_a");
  const [requiredProducts, setRequiredProducts] = useState<ProductCode[]>([]);
  const [favorites, setFavorites] = useState<Array<number | string>>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<{ signedIn: boolean; displayName: string | null }>({ signedIn: false, displayName: null });
  const [toast, setToast] = useState("");
  const [officialState, setOfficialState] = useState<{
    key: string;
    stations: OfficialStation[];
    error: string;
  }>({ key: "", stations: [], error: "" });
  const [ratingStation, setRatingStation] = useState<string | null>(null);

  const routeCode = route.split(" · ")[0];
  const province = routeProvince[routeCode];
  const selectedFuel = fuelOptions.find((item) => item.code === fuel) ?? fuelOptions[0];
  const requiredProductsKey = [...requiredProducts].sort().join(",");
  const officialRequestKey = `${fuel}|${province}|${requiredProductsKey}`;
  const officialLoading = officialState.key !== officialRequestKey;
  const officialStations = useMemo(
    () => officialLoading ? [] : officialState.stations,
    [officialLoading, officialState.stations],
  );
  const officialError = officialLoading ? "" : officialState.error;

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ fuel, province, limit: "24" });
    requiredProductsKey.split(",").filter(Boolean).forEach((product) => params.append("requires", product));
    fetch(`/api/stations?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("official-data");
        return response.json() as Promise<{ data: OfficialStation[] }>;
      })
      .then((payload) => setOfficialState({ key: officialRequestKey, stations: payload.data, error: "" }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setOfficialState({
          key: officialRequestKey,
          stations: [],
          error: "No hemos podido cargar ahora los datos oficiales.",
        });
      });
    return () => controller.abort();
  }, [fuel, officialRequestKey, province, requiredProductsKey]);

  const visibleOfficialStations = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return officialStations;
    return officialStations.filter((station) => [station.name, station.brand, station.address, station.municipality, station.province]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("es")
      .includes(needle));
  }, [officialStations, query]);

  const toggleFavorite = (id: number | string) => {
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const toggleRequiredProduct = (product: ProductCode) => {
    setRequiredProducts((current) => current.includes(product)
      ? current.filter((item) => item !== product)
      : [...current, product]);
  };

  const clearFilters = () => {
    setQuery("");
    setRequiredProducts([]);
    setFuel("diesel_a");
  };

  const openLogin = async () => {
    setLoginOpen(true);
    if (sessionUser.signedIn) return;
    try {
      const response = await fetch("/api/me", { cache: "no-store" });
      if (!response.ok) return;
      const user = await response.json() as { signedIn: boolean; displayName: string | null };
      setSessionUser(user);
    } catch {
      // The sign-in action remains available when the session check is offline.
    }
  };

  const rateStation = async (stationId: string, value: number) => {
    setRatingStation(null);
    const response = await fetch(`/api/stations/${encodeURIComponent(stationId)}/ratings/overall`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value }),
    });
    if (response.status === 401) {
      await openLogin();
      return;
    }
    if (!response.ok) {
      showToast("No se pudo guardar tu valoración");
      return;
    }
    setSessionUser((current) => ({ signedIn: true, displayName: current.displayName }));
    showToast(`Tu valoración de ${value} estrellas se ha guardado`);
  };

  const formatPrice = (micros: number | null) => micros === null
    ? "—"
    : `${(micros / 1_000_000).toLocaleString("es-ES", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} €`;

  const formatOfficialTime = (timestamp: number | null) => timestamp
    ? new Date(timestamp).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "sin hora";

  return (
    <main className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="Gasoliguapis, ir al inicio">
          <span className="brand-mark"><Fuel size={19} strokeWidth={2.8} /></span>
          <span>gasoli<span>guapis</span></span>
        </Link>
        <div className="top-actions">
          <button className="icon-button notification" aria-label="Notificaciones" onClick={() => showToast("No tienes avisos nuevos")}>
            <Bell size={20} />
            <i />
          </button>
          <button className="avatar-button" aria-label="Abrir acceso" onClick={openLogin}>
            <UserRound size={18} />
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="eyebrow"><span /> Paradas que sí merecen la pena</div>
        <h1>Gasolineras en ruta:<br /><em>¿dónde paramos?</em></h1>
        <p>Café rico, baños limpios y combustible al mejor precio. Todo en una sola parada.</p>

        <div className="route-card">
          <div className="route-field">
            <div className="route-symbol origin"><span /></div>
            <div>
              <label htmlFor="route-select">Tu ruta</label>
              <select id="route-select" value={route} onChange={(event) => setRoute(event.target.value)} aria-label="Selecciona tu ruta">
                {routes.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <ChevronDown size={18} />
          </div>
          <div className="route-line" />
          <div className="route-field search-field">
            <div className="route-symbol"><Search size={17} /></div>
            <div>
              <label htmlFor="needs-search">Busca en estos resultados</label>
              <input id="needs-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, municipio o dirección…" />
            </div>
            {query ? <button aria-label="Limpiar búsqueda" onClick={() => setQuery("")}><X size={17} /></button> : null}
          </div>
          <button className="nearby-button" onClick={() => showToast("Buscando paradas cerca de ti…")}>
            <LocateFixed size={18} /> Cerca de mí
          </button>
        </div>

        <div className="fuel-picker" aria-label="Selecciona tu combustible">
          <span>Tu combustible</span>
          <div>
            {fuelOptions.map((option) => (
              <button
                key={option.code}
                className={fuel === option.code ? "active" : ""}
                aria-pressed={fuel === option.code}
                onClick={() => setFuel(option.code)}
              >
                {option.code === "adblue" ? <Droplets size={15} /> : <Fuel size={15} />}{option.short}
              </button>
            ))}
          </div>
        </div>

        <div className="quick-filters" aria-label="Filtros rápidos">
          <button
            className={requiredProducts.includes("lpg") ? "active" : ""}
            aria-pressed={requiredProducts.includes("lpg")}
            onClick={() => toggleRequiredProduct("lpg")}
          ><Fuel size={16} /> Tiene GLP</button>
          <button
            className={requiredProducts.includes("adblue") ? "active" : ""}
            aria-pressed={requiredProducts.includes("adblue")}
            onClick={() => toggleRequiredProduct("adblue")}
          ><Droplets size={16} /> Tiene AdBlue</button>
          <button><Zap size={16} /> Carga EV</button>
          <button onClick={() => setFilterOpen(true)}><ListFilter size={16} /> Más</button>
        </div>
      </section>

      <section className="results-section" id="explorar">
        <div className="results-head">
          <div>
            <span className="result-kicker">CATÁLOGO OFICIAL · MITECO</span>
            <h2>{officialLoading ? "Buscando paradas…" : `${visibleOfficialStations.length} con ${selectedFuel.label}`}</h2>
          </div>
          <span className="result-sort"><ListFilter size={14} /> Mejor precio</span>
        </div>

        <p className="official-context"><ShieldCheck size={14} /> Selección oficial en {province}, tramo inicial de {routeCode}. La asignación exacta a sentido y salida se añadirá con el cruce viario.</p>

        {officialError ? <div className="official-message error"><X size={18} /> {officialError}</div> : null}
        {!officialLoading && !officialError && visibleOfficialStations.length === 0 ? (
          <div className="official-message"><Fuel size={19} /><div><strong>Aún no aparecen estaciones con estos criterios</strong><span>Prueba otra búsqueda, quita GLP o AdBlue, o cambia de tramo.</span><button onClick={clearFilters}>Limpiar filtros</button></div></div>
        ) : null}
        {officialLoading ? <div className="official-loading"><span /><span /><span /></div> : null}

        <div className="official-list">
          {visibleOfficialStations.map((station) => (
            <article className="official-card" key={station.id}>
              <div className="official-card-head">
                <div className="station-logo official">{(station.brand || station.name).slice(0, 1)}</div>
                <div>
                  <span className="official-badge"><ShieldCheck size={13} /> PRECIO OFICIAL</span>
                  <h3>{station.name}</h3>
                  <p><MapPin size={13} /> {[station.address, station.municipality, station.province].filter(Boolean).join(" · ")}</p>
                </div>
                <button className={`heart ${favorites.includes(station.id) ? "saved" : ""}`} aria-label="Guardar parada" onClick={() => toggleFavorite(station.id)}>
                  <Heart size={20} fill={favorites.includes(station.id) ? "currentColor" : "none"} />
                </button>
              </div>
              <div className="official-price-panel">
                <div><span>{selectedFuel.label}</span><strong>{formatPrice(station.priceMicros)}</strong><small>por litro</small></div>
                <div className={station.lpgPriceMicros !== null ? "available" : "unknown"}><span>GLP</span><strong>{formatPrice(station.lpgPriceMicros)}</strong><small>{station.lpgPriceMicros !== null ? "declarado" : "sin dato"}</small></div>
                <div className={station.adbluePriceMicros !== null ? "available" : "unknown"}><span>AdBlue</span><strong>{formatPrice(station.adbluePriceMicros)}</strong><small>{station.adbluePriceMicros !== null ? "declarado" : "desconocido"}</small></div>
              </div>
              <div className="official-source"><Check size={13} /> MITECO · {formatOfficialTime(station.priceObservedAt)}</div>
              <div className="official-actions">
                <a href={`https://www.google.com/maps/search/?api=1&query=${station.latE6 / 1_000_000},${station.lngE6 / 1_000_000}`} target="_blank" rel="noreferrer"><Navigation size={16} /> Cómo llegar</a>
                <button onClick={() => setRatingStation(ratingStation === station.id ? null : station.id)}><Star size={16} /> Valorar</button>
              </div>
              {ratingStation === station.id ? (
                <div className="rating-picker"><span>¿Qué tal fue la parada?</span><div>{[1, 2, 3, 4, 5].map((value) => <button key={value} aria-label={`${value} estrellas`} onClick={() => rateStation(station.id, value)}><Star size={22} fill="currentColor" /></button>)}</div></div>
              ) : null}
            </article>
          ))}
        </div>

        <aside className="trust-strip">
          <ShieldCheck size={18} />
          <div><strong>Precio oficial, experiencia propia</strong><span>Mostramos la fuente y la fecha; baños y cafetería solo tendrán valoraciones reales verificables.</span></div>
          <Link href="/metodologia">Cómo funciona</Link>
        </aside>
      </section>

      <section className="seo-value" aria-labelledby="why-gasoliguapis">
        <p>PLANIFICA MEJOR LA PARADA</p>
        <h2 id="why-gasoliguapis">No basta con encontrar gasolina barata</h2>
        <div>
          <Link href="/calculadora-ahorro-combustible"><strong>Ahorro neto</strong><span>Comprueba si el precio compensa los kilómetros de desvío.</span></Link>
          <Link href="/gasolineras-con-glp"><strong>GLP confirmado</strong><span>Disponibilidad y precio oficial con fecha visible.</span></Link>
          <Link href="/gasolineras-con-adblue"><strong>AdBlue sin suposiciones</strong><span>Diferenciamos confirmado, comunidad y dato desconocido.</span></Link>
        </div>
      </section>

      <button className="contribute" onClick={openLogin}><Plus size={22} /> <span>Añadir una parada</span></button>

      <nav className="bottom-nav" aria-label="Navegación principal">
        <Link className="active" href="#explorar"><Search size={21} /><span>Explorar</span></Link>
        <Link href="/calculadora-ahorro-combustible"><Fuel size={21} /><span>Ahorro</span></Link>
        <button onClick={() => showToast(`${favorites.length} paradas guardadas`)}><Bookmark size={21} /><span>Guardadas</span></button>
        <button onClick={openLogin}><UserRound size={21} /><span>Perfil</span></button>
      </nav>

      {filterOpen ? (
        <div className="overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFilterOpen(false); }}>
          <section className="filter-sheet" role="dialog" aria-modal="true" aria-label="Filtros">
            <div className="sheet-grabber" /><div className="modal-title"><h2>Tu parada ideal</h2><button onClick={() => setFilterOpen(false)}><X /></button></div>
            <p>Elige lo que no puede faltar en esta parada.</p>
            <div className="filter-options">
              <button className={requiredProducts.includes("lpg") ? "selected" : ""} aria-pressed={requiredProducts.includes("lpg")} onClick={() => toggleRequiredProduct("lpg")}><span>Debe tener GLP</span><Check size={16} /></button>
              <button className={requiredProducts.includes("adblue") ? "selected" : ""} aria-pressed={requiredProducts.includes("adblue")} onClick={() => toggleRequiredProduct("adblue")}><span>Debe tener AdBlue</span><Check size={16} /></button>
              {["Cafetería", "Baños accesibles", "Zona infantil", "Duchas", "Carga rápida", "Abierto 24 h"].map((item) => <button key={item} disabled title="Disponible al completar la verificación comunitaria"><span>{item}</span><small>pronto</small></button>)}
            </div>
            <button className="primary-action" onClick={() => { setFilterOpen(false); showToast("Filtros aplicados"); }}>Ver paradas</button>
          </section>
        </div>
      ) : null}

      {loginOpen ? (
        <div className="overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLoginOpen(false); }}>
          <section className="login-card" role="dialog" aria-modal="true" aria-label="Acceder a Gasoliguapis">
            <button className="login-close" onClick={() => setLoginOpen(false)}><X size={20} /></button>
            <div className="login-logo"><Fuel size={27} /></div>
            {sessionUser.signedIn ? (
              <>
                <h2>{sessionUser.displayName ? `Hola, ${sessionUser.displayName}` : "Sesión iniciada"}</h2>
                <p>Tu sesión está lista. Ya puedes valorar estaciones oficiales; cada dimensión admite un voto por usuario.</p>
                <button className="primary-action" onClick={() => setLoginOpen(false)}>Seguir explorando</button>
                <small><ShieldCheck size={14} /> Tu correo nunca aparece públicamente.</small>
              </>
            ) : (
              <>
                <h2>Haz mejores las paradas</h2>
                <p>Inicia sesión para valorar y compartir cómo estaba esa parada.</p>
                <a className="social chatgpt" href={signInPath}><Sparkles size={18} /> Continuar con ChatGPT</a>
                <div className="auth-coming"><span><b>G</b> Google</span><span><b>f</b> Facebook</span><small>Preparados para cuando confirmemos callbacks y credenciales.</small></div>
                <small><ShieldCheck size={14} /> Nunca publicaremos nada sin tu permiso.</small>
              </>
            )}
          </section>
        </div>
      ) : null}

      {toast ? <div className="toast" role="status"><Check size={17} /> {toast}</div> : null}
    </main>
  );
}
