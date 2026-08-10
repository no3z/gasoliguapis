"use client";

import {
  ArrowLeft,
  Bath,
  Bell,
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  Coffee,
  Droplets,
  Fuel,
  Heart,
  ListFilter,
  LocateFixed,
  Map,
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

type Station = {
  id: number | string;
  brand: string;
  name: string;
  road: string;
  exit: string;
  direction: string;
  distance: string;
  detour: string;
  place: string;
  rating: number;
  reviews: number;
  verified: boolean;
  open: string;
  updated: string;
  accent: string;
  cafe: string;
  badges: string[];
  prices: { label: string; value: string; best?: boolean }[];
  scores: { label: string; value: number; icon: "coffee" | "bath" | "sparkles" }[];
  amenities: string[];
  quote: string;
  author: string;
};

const stations: Station[] = [
  {
    id: 1,
    brand: "REPSOL",
    name: "Repsol · Área 103",
    road: "A-2",
    exit: "Salida 103",
    direction: "Zaragoza",
    distance: "18 km",
    detour: "0 min",
    place: "Almadrones, Guadalajara",
    rating: 4.7,
    reviews: 248,
    verified: true,
    open: "Abierto 24 h",
    updated: "hace 42 min",
    accent: "#ff5d47",
    cafe: "Café recién hecho y buenos bocadillos",
    badges: ["Favorita de la ruta", "Sin desvío"],
    prices: [
      { label: "Gasoil A", value: "1,489 €", best: true },
      { label: "Gasolina 95", value: "1,579 €" },
      { label: "AdBlue", value: "0,799 €" },
    ],
    scores: [
      { label: "Café", value: 4.8, icon: "coffee" },
      { label: "Baños", value: 4.7, icon: "bath" },
      { label: "Limpieza", value: 4.6, icon: "sparkles" },
    ],
    amenities: ["Cafetería", "Baño accesible", "Zona infantil", "Tienda 24 h", "Aire", "GLP"],
    quote: "Impecable a primera hora y el café sorprende. Parada fija con niños.",
    author: "Opinión de ejemplo",
  },
  {
    id: 2,
    brand: "CEPSA",
    name: "Cepsa · Área de Medinaceli",
    road: "A-2",
    exit: "Salida 151",
    direction: "Zaragoza",
    distance: "51 km",
    detour: "2 min",
    place: "Medinaceli, Soria",
    rating: 4.5,
    reviews: 186,
    verified: true,
    open: "Abierto 24 h",
    updated: "hace 1 h",
    accent: "#e73e55",
    cafe: "Terraza, menú del día y café ecológico",
    badges: ["Muy limpia"],
    prices: [
      { label: "Gasoil A", value: "1,495 €" },
      { label: "Gasolina 95", value: "1,589 €" },
      { label: "Gasolina 98", value: "1,739 €" },
    ],
    scores: [
      { label: "Café", value: 4.6, icon: "coffee" },
      { label: "Baños", value: 4.4, icon: "bath" },
      { label: "Limpieza", value: 4.7, icon: "sparkles" },
    ],
    amenities: ["Restaurante", "Terraza", "Duchas", "Parking camiones", "Wi-Fi", "Aire"],
    quote: "La terraza da la vida. Servicio rápido incluso cuando hay bastante gente.",
    author: "Opinión de ejemplo",
  },
  {
    id: 3,
    brand: "BP",
    name: "BP · La Dehesa",
    road: "A-2",
    exit: "Salida 76",
    direction: "Zaragoza",
    distance: "9 km",
    detour: "4 min",
    place: "Torija, Guadalajara",
    rating: 4.2,
    reviews: 92,
    verified: false,
    open: "Abierto hasta 23:00",
    updated: "ayer, 19:10",
    accent: "#50a848",
    cafe: "Tienda y café para llevar",
    badges: ["Carga eléctrica"],
    prices: [
      { label: "Gasoil A", value: "1,479 €", best: true },
      { label: "Gasolina 95", value: "1,569 €", best: true },
      { label: "Carga 150 kW", value: "0,49 €/kWh" },
    ],
    scores: [
      { label: "Café", value: 4.1, icon: "coffee" },
      { label: "Baños", value: 4.0, icon: "bath" },
      { label: "Limpieza", value: 4.4, icon: "sparkles" },
    ],
    amenities: ["Café", "Carga 150 kW", "Tienda", "Baño accesible", "Aire"],
    quote: "El cargador funcionó a la primera. Baños pequeños, pero muy cuidados.",
    author: "Opinión de ejemplo",
  },
  {
    id: 4,
    brand: "MOEVE",
    name: "Moeve · Kilómetro 171",
    road: "A-6",
    exit: "Salida 171",
    direction: "A Coruña",
    distance: "27 km",
    detour: "1 min",
    place: "Tordesillas, Valladolid",
    rating: 4.6,
    reviews: 321,
    verified: true,
    open: "Abierto 24 h",
    updated: "hace 18 min",
    accent: "#6b3df5",
    cafe: "Café amplio, opciones vegetarianas y terraza",
    badges: ["Top familias", "Perfil de ejemplo"],
    prices: [
      { label: "Gasoil A", value: "1,462 €", best: true },
      { label: "Gasolina 95", value: "1,554 €", best: true },
      { label: "GLP", value: "0,949 €" },
    ],
    scores: [
      { label: "Café", value: 4.7, icon: "coffee" },
      { label: "Baños", value: 4.8, icon: "bath" },
      { label: "Limpieza", value: 4.7, icon: "sparkles" },
    ],
    amenities: ["Cafetería", "Terraza", "Zona infantil", "GLP", "Baño accesible", "Parking"],
    quote: "Mucho espacio para parar con peques y baños de los que da gusto encontrar.",
    author: "Opinión de ejemplo",
  },
];

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

function ScoreIcon({ type }: { type: Station["scores"][number]["icon"] }) {
  if (type === "coffee") return <Coffee size={17} />;
  if (type === "bath") return <Bath size={17} />;
  return <Sparkles size={17} />;
}

export default function StationExplorer({
  currentUser,
  signInPath,
}: {
  currentUser: { signedIn: boolean; displayName: string | null };
  signInPath: string;
}) {
  const [query, setQuery] = useState("");
  const [route, setRoute] = useState(routes[0]);
  const [fuel, setFuel] = useState<FuelCode>("diesel_a");
  const [requiredProducts, setRequiredProducts] = useState<ProductCode[]>([]);
  const [view, setView] = useState<"list" | "map">("list");
  const [favorites, setFavorites] = useState<Array<number | string>>([1]);
  const [detail, setDetail] = useState<Station | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
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
  const officialStations = officialLoading ? [] : officialState.stations;
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

  const visibleStations = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return stations.filter((station) => {
      const matchesRoute = station.road === routeCode;
      const searchable = [station.name, station.place, station.road, ...station.amenities, ...station.prices.map((price) => price.label)];
      const matchesQuery = !needle || searchable
        .join(" ")
        .toLowerCase()
        .includes(needle);
      const hasLpg = searchable.some((item) => item.toLowerCase().includes("glp"));
      const hasAdblue = searchable.some((item) => item.toLowerCase().includes("adblue"));
      const matchesProducts = requiredProducts.every((product) => product === "lpg" ? hasLpg : hasAdblue);
      const selectedLabel = selectedFuel.label.toLowerCase();
      const matchesFuel = fuel === "diesel_a"
        ? station.prices.some((price) => price.label.toLowerCase().includes("gasoil"))
        : fuel === "gasoline_95_e5"
          ? station.prices.some((price) => price.label.toLowerCase().includes("95"))
          : searchable.some((item) => item.toLowerCase().includes(selectedLabel));
      return matchesRoute && matchesQuery && matchesProducts && matchesFuel;
    });
  }, [fuel, query, requiredProducts, routeCode, selectedFuel.label]);

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

  const rateStation = async (stationId: string, value: number) => {
    if (!currentUser.signedIn) {
      setLoginOpen(true);
      return;
    }
    setRatingStation(null);
    const response = await fetch(`/api/stations/${encodeURIComponent(stationId)}/ratings/overall`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value }),
    });
    if (!response.ok) {
      showToast("No se pudo guardar tu valoración");
      return;
    }
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
        <button className="brand" aria-label="Ir al inicio">
          <span className="brand-mark"><Fuel size={19} strokeWidth={2.8} /></span>
          <span>gasoli<span>guapis</span></span>
        </button>
        <div className="top-actions">
          <button className="icon-button notification" aria-label="Notificaciones" onClick={() => showToast("No tienes avisos nuevos")}>
            <Bell size={20} />
            <i />
          </button>
          <button className="avatar-button" aria-label="Abrir acceso" onClick={() => setLoginOpen(true)}>
            <UserRound size={18} />
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="eyebrow"><span /> Paradas que sí merecen la pena</div>
        <h1>¿Dónde paramos<br /><em>esta vez?</em></h1>
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
              <label htmlFor="needs-search">¿Qué necesitas?</label>
              <input id="needs-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Café, GLP, cargador, duchas…" />
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

      <section className="results-section">
        <div className="results-head">
          <div>
            <span className="result-kicker">CATÁLOGO OFICIAL · MITECO</span>
            <h2>{officialLoading ? "Buscando paradas…" : `${officialStations.length} con ${selectedFuel.label}`}</h2>
          </div>
          <div className="view-switch" aria-label="Cambiar vista">
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}><ListFilter size={16} /> Lista</button>
            <button className={view === "map" ? "active" : ""} onClick={() => setView("map")}><Map size={16} /> Mapa</button>
          </div>
        </div>

        <p className="official-context"><ShieldCheck size={14} /> Selección oficial en {province}, tramo inicial de {routeCode}. La asignación exacta a sentido y salida se añadirá con el cruce viario.</p>

        {officialError ? <div className="official-message error"><X size={18} /> {officialError}</div> : null}
        {!officialLoading && !officialError && officialStations.length === 0 ? (
          <div className="official-message"><Fuel size={19} /><div><strong>Aún no aparecen estaciones con estos criterios</strong><span>Prueba a quitar GLP o AdBlue, o cambia de tramo.</span></div></div>
        ) : null}
        {officialLoading ? <div className="official-loading"><span /><span /><span /></div> : null}

        <div className="official-list">
          {officialStations.map((station) => (
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

        <div className="community-divider"><span>EXPERIENCIA DE COMUNIDAD · DEMOSTRACIÓN</span><p>Café, baños y opiniones de ejemplo mientras verificamos estas fichas.</p></div>

        {view === "map" ? (
          <div className="map-view">
            <div className="map-road road-a" /><div className="map-road road-b" /><div className="map-road road-c" />
            <span className="map-label label-a">{routeCode}</span><span className="map-label label-b">{province.toUpperCase()}</span>
            {visibleStations.map((station, index) => (
              <button key={station.id} className={`map-pin pin-${index + 1}`} onClick={() => setDetail(station)}>
                <Fuel size={16} /><b>{station.rating}</b>
              </button>
            ))}
            <button className="recenter" onClick={() => showToast("Mapa centrado en tu ruta")}><LocateFixed size={18} /></button>
          </div>
        ) : null}

        <div className={view === "list" ? "station-list" : "station-list map-list"}>
          {visibleStations.map((station, index) => (
            <article className="station-card" key={station.id} style={{ "--brand-accent": station.accent } as React.CSSProperties}>
              <span className="demo-badge">FICHA DE EJEMPLO</span>
              <div className="card-top">
                <div className="station-logo">{station.brand.slice(0, 1)}</div>
                <div className="station-main">
                  <div className="station-title-row">
                    <div>
                      <p className="distance"><Navigation size={13} fill="currentColor" /> {station.distance} · {station.detour} de desvío</p>
                      <h3>{station.name}</h3>
                    </div>
                    <button className={`heart ${favorites.includes(station.id) ? "saved" : ""}`} aria-label="Guardar parada" onClick={() => toggleFavorite(station.id)}>
                      <Heart size={21} fill={favorites.includes(station.id) ? "currentColor" : "none"} />
                    </button>
                  </div>
                  <div className="road-meta"><strong>{station.road}</strong> · {station.exit} · dirección {station.direction}</div>
                  <div className="rating-row"><span><Star size={15} fill="currentColor" /> {station.rating}</span><button onClick={() => setDetail(station)}>{station.reviews} opiniones demo</button>{station.verified ? <i><ShieldCheck size={14} /> perfil demo</i> : null}</div>
                </div>
              </div>

              {index === 0 ? <div className="community-pick"><Sparkles size={14} /> La comunidad destaca: {station.cafe}</div> : null}

              <div className="score-grid">
                {station.scores.map((score) => (
                  <div key={score.label}><span><ScoreIcon type={score.icon} /> {score.label}</span><strong>{score.value}</strong></div>
                ))}
              </div>

              <div className="price-row">
                {station.prices.map((price) => (
                  <div key={price.label} className={price.best ? "best" : ""}>
                    <span>{price.label}{price.best ? <i>MEJOR</i> : null}</span>
                    <strong>{price.value}</strong>
                  </div>
                ))}
              </div>
              <p className="price-time"><Check size={13} /> Precios de muestra · {station.updated}</p>

              <div className="card-footer">
                <div><span className="open-dot" /> <strong>{station.open}</strong><small>{station.place}</small></div>
                <button onClick={() => setDetail(station)}>Ver parada <ChevronRight size={17} /></button>
              </div>
            </article>
          ))}
          {visibleStations.length === 0 ? (
            <div className="empty-state"><Search size={28} /><h3>No vemos ninguna parada así</h3><p>Prueba con otra ruta o quita algún filtro.</p><button onClick={clearFilters}>Limpiar filtros</button></div>
          ) : null}
        </div>

        <div className="insight-card">
          <div className="insight-icon"><Fuel size={22} /></div>
          <div><span>DATO DE LA RUTA</span><p>Ahorrarías hasta <strong>6,40 €</strong> llenando en la mejor parada de este trayecto.</p></div>
        </div>
      </section>

      <button className="contribute" onClick={() => setLoginOpen(true)}><Plus size={22} /> <span>Añadir una parada</span></button>

      <nav className="bottom-nav" aria-label="Navegación principal">
        <button className="active"><Search size={21} /><span>Explorar</span></button>
        <button onClick={() => setView("map")}><Map size={21} /><span>Mapa</span></button>
        <button onClick={() => showToast(`${favorites.length} paradas guardadas`)}><Bookmark size={21} /><span>Guardadas</span></button>
        <button onClick={() => setLoginOpen(true)}><UserRound size={21} /><span>Perfil</span></button>
      </nav>

      {detail ? (
        <div className="overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetail(null); }}>
          <section className="detail-sheet" role="dialog" aria-modal="true" aria-label={`Detalle de ${detail.name}`}>
            <div className="sheet-grabber" />
            <div className="sheet-head"><button onClick={() => setDetail(null)} aria-label="Cerrar"><ArrowLeft size={20} /></button><span>Ficha de la parada</span><button onClick={() => toggleFavorite(detail.id)} aria-label="Guardar"><Heart size={20} fill={favorites.includes(detail.id) ? "currentColor" : "none"} /></button></div>
            <div className="detail-hero" style={{ "--brand-accent": detail.accent } as React.CSSProperties}>
              <div className="station-logo big">{detail.brand.slice(0, 1)}</div>
              <p>{detail.road} · {detail.exit}</p><h2>{detail.name}</h2><span><MapPin size={15} /> {detail.place}</span>
              <div className="detail-rating"><strong>{detail.rating}</strong><div><div>{[1,2,3,4,5].map((item) => <Star key={item} size={15} fill="currentColor" />)}</div><span>{detail.reviews} opiniones de viajeros</span></div></div>
            </div>
            <div className="detail-content">
              <div className="amenity-list">{detail.amenities.map((item) => <span key={item}><Check size={14} /> {item}</span>)}</div>
              <h3>Lo importante, de un vistazo</h3>
              <div className="score-grid large">{detail.scores.map((score) => <div key={score.label}><span><ScoreIcon type={score.icon} /> {score.label}</span><strong>{score.value}</strong></div>)}</div>
              <blockquote>“{detail.quote}”<footer>{detail.author}</footer></blockquote>
              <div className="detail-actions"><button onClick={() => showToast("Abriendo indicaciones…")}><Navigation size={18} /> Cómo llegar</button><button onClick={() => setLoginOpen(true)}><Star size={18} /> Valorar</button></div>
            </div>
          </section>
        </div>
      ) : null}

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
            {currentUser.signedIn ? (
              <>
                <h2>Hola, {currentUser.displayName}</h2>
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
