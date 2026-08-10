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
import { useMemo, useState } from "react";

type Station = {
  id: number;
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
    author: "Lucía M. · hace 2 días",
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
    author: "Diego R. · hace 1 semana",
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
    author: "Álvaro P. · hace 4 días",
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
    badges: ["Top familias", "Precio verificado"],
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
    author: "Marta S. · ayer",
  },
];

const routes = ["A-2 · Zaragoza", "A-6 · A Coruña", "A-1 · Burgos", "A-4 · Sevilla"];

function ScoreIcon({ type }: { type: Station["scores"][number]["icon"] }) {
  if (type === "coffee") return <Coffee size={17} />;
  if (type === "bath") return <Bath size={17} />;
  return <Sparkles size={17} />;
}

export default function StationExplorer() {
  const [query, setQuery] = useState("");
  const [route, setRoute] = useState(routes[0]);
  const [view, setView] = useState<"list" | "map">("list");
  const [favorites, setFavorites] = useState<number[]>([1]);
  const [detail, setDetail] = useState<Station | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [toast, setToast] = useState("");

  const visibleStations = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const routeCode = route.split(" · ")[0];
    return stations.filter((station) => {
      const matchesRoute = station.road === routeCode;
      const matchesQuery = !needle || [station.name, station.place, station.road, ...station.amenities]
        .join(" ")
        .toLowerCase()
        .includes(needle);
      return matchesRoute && matchesQuery;
    });
  }, [query, route]);

  const toggleFavorite = (id: number) => {
    setFavorites((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

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
              <label>Tu ruta</label>
              <select value={route} onChange={(event) => setRoute(event.target.value)} aria-label="Selecciona tu ruta">
                {routes.map((item) => <option key={item}>{item}</option>)}
              </select>
            </div>
            <ChevronDown size={18} />
          </div>
          <div className="route-line" />
          <div className="route-field search-field">
            <div className="route-symbol"><Search size={17} /></div>
            <div>
              <label>¿Qué necesitas?</label>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Café, GLP, cargador, duchas…" />
            </div>
            {query ? <button aria-label="Limpiar búsqueda" onClick={() => setQuery("")}><X size={17} /></button> : null}
          </div>
          <button className="nearby-button" onClick={() => showToast("Buscando paradas cerca de ti…")}>
            <LocateFixed size={18} /> Cerca de mí
          </button>
        </div>

        <div className="quick-filters" aria-label="Filtros rápidos">
          <button className="active"><Coffee size={16} /> Buen café</button>
          <button><Bath size={16} /> Baños top</button>
          <button><Zap size={16} /> Carga EV</button>
          <button onClick={() => setFilterOpen(true)}><ListFilter size={16} /> Más</button>
        </div>
      </section>

      <section className="results-section">
        <div className="results-head">
          <div>
            <span className="result-kicker">VISTA PREVIA · DATOS DE MUESTRA</span>
            <h2>{visibleStations.length} paradas que encajan</h2>
          </div>
          <div className="view-switch" aria-label="Cambiar vista">
            <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}><ListFilter size={16} /> Lista</button>
            <button className={view === "map" ? "active" : ""} onClick={() => setView("map")}><Map size={16} /> Mapa</button>
          </div>
        </div>

        {view === "map" ? (
          <div className="map-view">
            <div className="map-road road-a" /><div className="map-road road-b" /><div className="map-road road-c" />
            <span className="map-label label-a">A-2</span><span className="map-label label-b">GUADALAJARA</span>
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
                  <div className="rating-row"><span><Star size={15} fill="currentColor" /> {station.rating}</span><button onClick={() => setDetail(station)}>{station.reviews} opiniones</button>{station.verified ? <i><ShieldCheck size={14} /> verificada</i> : null}</div>
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
            <div className="empty-state"><Search size={28} /><h3>No vemos ninguna parada así</h3><p>Prueba con otra ruta o quita algún filtro.</p><button onClick={() => setQuery("")}>Limpiar búsqueda</button></div>
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
            <div className="filter-options">{["Cafetería", "Baños accesibles", "Zona infantil", "Duchas", "Carga rápida", "GLP", "Abierto 24 h", "Admite mascotas"].map((item) => <button key={item} onClick={(event) => event.currentTarget.classList.toggle("selected")}><span>{item}</span><Check size={16} /></button>)}</div>
            <button className="primary-action" onClick={() => { setFilterOpen(false); showToast("Filtros aplicados"); }}>Ver paradas</button>
          </section>
        </div>
      ) : null}

      {loginOpen ? (
        <div className="overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLoginOpen(false); }}>
          <section className="login-card" role="dialog" aria-modal="true" aria-label="Acceder a Gasoliguapis">
            <button className="login-close" onClick={() => setLoginOpen(false)}><X size={20} /></button>
            <div className="login-logo"><Fuel size={27} /></div>
            <h2>Haz mejores las paradas</h2>
            <p>Inicia sesión para valorar, guardar rutas y compartir cómo estaba ese baño.</p>
            <button className="social google" onClick={() => showToast("OAuth de Google se conectará al configurar producción")}><b>G</b> Continuar con Google</button>
            <button className="social facebook" onClick={() => showToast("OAuth de Facebook se conectará al configurar producción")}><b>f</b> Continuar con Facebook</button>
            <small><ShieldCheck size={14} /> Nunca publicaremos nada sin tu permiso.</small>
            <em>Acceso social preparado para configuración; aún no se solicitan datos reales.</em>
          </section>
        </div>
      ) : null}

      {toast ? <div className="toast" role="status"><Check size={17} /> {toast}</div> : null}
    </main>
  );
}
