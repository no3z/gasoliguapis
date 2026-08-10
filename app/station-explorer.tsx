"use client";

import {
  Bath,
  Bell,
  Bookmark,
  Check,
  ChevronDown,
  Coffee,
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
type SortMode = "price" | "distance";
type RatingDimension = "overall" | "bathroom" | "coffee" | "cleanliness";

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
  distanceKm?: number | null;
  bathroomRating?: number | null;
  bathroomCount?: number;
  coffeeRating?: number | null;
  coffeeCount?: number;
  cleanlinessRating?: number | null;
  cleanlinessCount?: number;
};

type StaticFuelStation = Pick<OfficialStation, "id" | "name" | "brand" | "address" | "municipality" | "province" | "latE6" | "lngE6" | "priceMicros">;
type StaticSpecialFuels = {
  observedRaw: { lpg: string; adblue: string };
  products: { lpg: StaticFuelStation[]; adblue: StaticFuelStation[] };
};

const provinces = [
  ["CORUÑA (A)", "A Coruña"], ["ARABA/ÁLAVA", "Álava"], ["ALBACETE", "Albacete"], ["ALICANTE", "Alicante"],
  ["ALMERÍA", "Almería"], ["ASTURIAS", "Asturias"], ["ÁVILA", "Ávila"], ["BADAJOZ", "Badajoz"],
  ["BALEARS (ILLES)", "Illes Balears"], ["BARCELONA", "Barcelona"], ["BIZKAIA", "Bizkaia"], ["BURGOS", "Burgos"],
  ["CÁCERES", "Cáceres"], ["CÁDIZ", "Cádiz"], ["CANTABRIA", "Cantabria"], ["CASTELLÓN / CASTELLÓ", "Castellón"],
  ["CEUTA", "Ceuta"], ["CIUDAD REAL", "Ciudad Real"], ["CÓRDOBA", "Córdoba"], ["CUENCA", "Cuenca"],
  ["GIPUZKOA", "Gipuzkoa"], ["GIRONA", "Girona"], ["GRANADA", "Granada"], ["GUADALAJARA", "Guadalajara"],
  ["HUELVA", "Huelva"], ["HUESCA", "Huesca"], ["JAÉN", "Jaén"], ["LEÓN", "León"], ["LLEIDA", "Lleida"],
  ["LUGO", "Lugo"], ["MADRID", "Madrid"], ["MÁLAGA", "Málaga"], ["MELILLA", "Melilla"], ["MURCIA", "Murcia"],
  ["NAVARRA", "Navarra"], ["OURENSE", "Ourense"], ["PALENCIA", "Palencia"], ["PALMAS (LAS)", "Las Palmas"],
  ["PONTEVEDRA", "Pontevedra"], ["RIOJA (LA)", "La Rioja"], ["SALAMANCA", "Salamanca"],
  ["SANTA CRUZ DE TENERIFE", "Santa Cruz de Tenerife"], ["SEGOVIA", "Segovia"], ["SEVILLA", "Sevilla"],
  ["SORIA", "Soria"], ["TARRAGONA", "Tarragona"], ["TERUEL", "Teruel"], ["TOLEDO", "Toledo"],
  ["VALENCIA / VALÈNCIA", "Valencia"], ["VALLADOLID", "Valladolid"], ["ZAMORA", "Zamora"], ["ZARAGOZA", "Zaragoza"],
] as const;
const fuelOptions: { code: FuelCode; label: string; short: string }[] = [
  { code: "diesel_a", label: "Gasóleo A", short: "Diésel" },
  { code: "gasoline_95_e5", label: "Gasolina 95", short: "95" },
  { code: "lpg", label: "GLP", short: "GLP" },
  { code: "adblue", label: "AdBlue", short: "AdBlue" },
];
const ratingOptions: { code: RatingDimension; label: string }[] = [
  { code: "overall", label: "Parada" },
  { code: "bathroom", label: "Baños" },
  { code: "coffee", label: "Café" },
  { code: "cleanliness", label: "Limpieza" },
];

function displayProvince(value: string | null) {
  return provinces.find(([officialValue]) => officialValue === value)?.[1] || value || "";
}

function distanceKm(latA: number, lngA: number, latB: number, lngB: number) {
  const radians = (value: number) => value * Math.PI / 180;
  const latDistance = radians(latB - latA);
  const lngDistance = radians(lngB - lngA);
  const a = Math.sin(latDistance / 2) ** 2
    + Math.cos(radians(latA)) * Math.cos(radians(latB)) * Math.sin(lngDistance / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function officialLocalTimestamp(value: string) {
  const match = value.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (!match) return Date.now();
  const targetUtc = Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]), Number(match[4]), Number(match[5]), Number(match[6]));
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(new Date(targetUtc)).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
  const madridAtTarget = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
  return targetUtc - (madridAtTarget - targetUtc);
}

export default function StationExplorer({
  signInPath,
  initialFuel = "diesel_a",
}: {
  signInPath: string;
  initialFuel?: FuelCode;
}) {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [province, setProvince] = useState("");
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [sort, setSort] = useState<SortMode>("price");
  const [fuel, setFuel] = useState<FuelCode>(initialFuel);
  const [requiredProducts, setRequiredProducts] = useState<ProductCode[]>([]);
  const [favorites, setFavorites] = useState<Array<number | string>>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<{ signedIn: boolean; displayName: string | null }>({ signedIn: false, displayName: null });
  const [toast, setToast] = useState("");
  const [officialState, setOfficialState] = useState<{
    key: string;
    stations: OfficialStation[];
    total: number;
    error: string;
  }>({ key: "", stations: [], total: 0, error: "" });
  const [ratingStation, setRatingStation] = useState<string | null>(null);
  const [ratingDimension, setRatingDimension] = useState<RatingDimension>("overall");
  const [showCount, setShowCount] = useState(20);

  const selectedFuel = fuelOptions.find((item) => item.code === fuel) ?? fuelOptions[0];
  const provinceLabel = displayProvince(province);
  const requiredProductsKey = [...requiredProducts].sort().join(",");
  const locationKey = location ? `${location.latitude.toFixed(2)},${location.longitude.toFixed(2)}` : "national";
  const officialRequestKey = `${fuel}|${province}|${requiredProductsKey}|${searchTerm}|${locationKey}|${sort}`;
  const officialLoading = officialState.key !== officialRequestKey;
  const officialStations = useMemo(
    () => officialLoading ? [] : officialState.stations,
    [officialLoading, officialState.stations],
  );
  const officialError = officialLoading ? "" : officialState.error;
  const officialTotal = officialLoading ? 0 : officialState.total;

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearchTerm(query.trim()), 320);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ fuel, limit: "100", sort });
    if (province) params.set("province", province);
    if (searchTerm) params.set("q", searchTerm);
    if (location) {
      params.set("lat", location.latitude.toFixed(2));
      params.set("lng", location.longitude.toFixed(2));
      params.set("radiusKm", "75");
    }
    requiredProductsKey.split(",").filter(Boolean).forEach((product) => params.append("requires", product));
    fetch(`/api/stations?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("official-data");
        return response.json() as Promise<{ data: OfficialStation[]; total: number }>;
      })
      .then((payload) => setOfficialState({
        key: officialRequestKey,
        stations: payload.data,
        total: Number(payload.total ?? payload.data.length),
        error: "",
      }))
      .catch(async (error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (fuel === "lpg" || fuel === "adblue") {
          try {
            const snapshotResponse = await fetch("/data/miteco-special-fuels.json", { signal: controller.signal });
            if (!snapshotResponse.ok) throw new Error("snapshot-unavailable");
            const snapshot = await snapshotResponse.json() as StaticSpecialFuels;
            const lpgById = new Map(snapshot.products.lpg.map((station) => [station.id, station]));
            const adblueById = new Map(snapshot.products.adblue.map((station) => [station.id, station]));
            const observedAt = officialLocalTimestamp(snapshot.observedRaw[fuel]);
            const lpgObservedAt = officialLocalTimestamp(snapshot.observedRaw.lpg);
            const adblueObservedAt = officialLocalTimestamp(snapshot.observedRaw.adblue);
            const normalizedQuery = searchTerm.toLocaleLowerCase("es");
            const matches = snapshot.products[fuel]
              .filter((station) => !province || station.province?.toLocaleLowerCase("es") === province.toLocaleLowerCase("es"))
              .filter((station) => !normalizedQuery || [station.name, station.brand, station.address, station.municipality, station.province]
                .filter(Boolean).join(" ").toLocaleLowerCase("es").includes(normalizedQuery))
              .filter((station) => !requiredProductsKey.split(",").includes("lpg") || lpgById.has(station.id))
              .filter((station) => !requiredProductsKey.split(",").includes("adblue") || adblueById.has(station.id))
              .map((station): OfficialStation => {
                const lpgStation = lpgById.get(station.id);
                const adblueStation = adblueById.get(station.id);
                const calculatedDistance = location
                  ? distanceKm(location.latitude, location.longitude, station.latE6 / 1_000_000, station.lngE6 / 1_000_000)
                  : null;
                return {
                  ...station,
                  currency: "EUR",
                  priceObservedAt: observedAt,
                  lpgPriceMicros: lpgStation?.priceMicros ?? null,
                  lpgObservedAt: lpgStation ? lpgObservedAt : null,
                  adbluePriceMicros: adblueStation?.priceMicros ?? null,
                  adblueObservedAt: adblueStation ? adblueObservedAt : null,
                  distanceKm: calculatedDistance,
                  bathroomRating: null, bathroomCount: 0,
                  coffeeRating: null, coffeeCount: 0,
                  cleanlinessRating: null, cleanlinessCount: 0,
                };
              })
              .filter((station) => !location || Number(station.distanceKm) <= 75)
              .sort((left, right) => sort === "distance"
                ? Number(left.distanceKm) - Number(right.distanceKm)
                : left.priceMicros - right.priceMicros);
            setOfficialState({ key: officialRequestKey, stations: matches.slice(0, 100), total: matches.length, error: "" });
            return;
          } catch (snapshotError: unknown) {
            if (snapshotError instanceof DOMException && snapshotError.name === "AbortError") return;
          }
        }
        setOfficialState({
          key: officialRequestKey,
          stations: [],
          total: 0,
          error: "No hemos podido cargar ahora los datos oficiales.",
        });
      });
    return () => controller.abort();
  }, [fuel, location, officialRequestKey, province, requiredProductsKey, searchTerm, sort]);

  const visibleOfficialStations = useMemo(() => officialStations.slice(0, showCount), [officialStations, showCount]);

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
    setShowCount(20);
  };

  const selectFuel = (nextFuel: FuelCode) => {
    setFuel(nextFuel);
    setRequiredProducts((current) => current.filter((product) => product !== nextFuel));
    setShowCount(20);
  };

  const clearFilters = () => {
    setQuery("");
    setSearchTerm("");
    setProvince("");
    setLocation(null);
    setSort("price");
    setRequiredProducts([]);
    setFuel(initialFuel);
    setShowCount(20);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      showToast("Tu navegador no permite usar la ubicación");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: Number(position.coords.latitude.toFixed(2)),
          longitude: Number(position.coords.longitude.toFixed(2)),
        });
        setProvince("");
        setSort("distance");
        setShowCount(20);
        setLocationLoading(false);
        showToast("Mostrando estaciones a menos de 75 km");
      },
      () => {
        setLocationLoading(false);
        showToast("No hemos podido obtener tu ubicación");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 },
    );
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
    const response = await fetch(`/api/stations/${encodeURIComponent(stationId)}/ratings/${ratingDimension}`, {
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
    const payload = await response.json() as { stats?: { average: number; count: number } };
    if (payload.stats && ratingDimension !== "overall") {
      const ratingField = `${ratingDimension}Rating` as "bathroomRating" | "coffeeRating" | "cleanlinessRating";
      const countField = `${ratingDimension}Count` as "bathroomCount" | "coffeeCount" | "cleanlinessCount";
      setOfficialState((current) => ({
        ...current,
        stations: current.stations.map((station) => station.id === stationId
          ? { ...station, [ratingField]: payload.stats?.average, [countField]: payload.stats?.count }
          : station),
      }));
    }
    setSessionUser((current) => ({ signedIn: true, displayName: current.displayName }));
    const dimensionLabel = ratingOptions.find((item) => item.code === ratingDimension)?.label.toLowerCase() || "parada";
    showToast(`Tu valoración de ${dimensionLabel}: ${value} estrellas`);
  };

  const formatPrice = (micros: number | null) => micros === null
    ? "—"
    : `${(micros / 1_000_000).toLocaleString("es-ES", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} €`;

  const formatOfficialTime = (timestamp: number | null) => timestamp
    ? new Date(timestamp).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "sin hora";

  const stationHighlights = (station: OfficialStation) => {
    const highlights = [{
      label: selectedFuel.label,
      value: formatPrice(station.priceMicros),
      detail: "por litro",
      className: "primary",
    }];
    if (fuel !== "lpg") highlights.push({
      label: "GLP",
      value: formatPrice(station.lpgPriceMicros),
      detail: station.lpgPriceMicros !== null ? "confirmado" : "sin dato",
      className: station.lpgPriceMicros !== null ? "available" : "unknown",
    });
    if (fuel !== "adblue") highlights.push({
      label: "AdBlue",
      value: formatPrice(station.adbluePriceMicros),
      detail: station.adbluePriceMicros !== null ? "confirmado" : "desconocido",
      className: station.adbluePriceMicros !== null ? "available" : "unknown",
    });
    if (highlights.length < 3) highlights.push({
      label: location ? "Distancia" : "Provincia",
      value: location && station.distanceKm !== null && station.distanceKm !== undefined
        ? `${station.distanceKm < 10 ? station.distanceKm.toFixed(1) : Math.round(station.distanceKm)} km`
        : displayProvince(station.province) || "España",
      detail: location ? "en línea recta" : "ámbito oficial",
      className: "info",
    });
    return highlights.slice(0, 3);
  };

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
              <label htmlFor="province-select">Dónde buscas</label>
              <select
                id="province-select"
                value={province}
                onChange={(event) => {
                  setProvince(event.target.value);
                  setLocation(null);
                  setSort("price");
                  setShowCount(20);
                }}
                aria-label="Selecciona toda España o una provincia"
              >
                <option value="">Toda España</option>
                {provinces.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
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
          <button className={`nearby-button ${location ? "active" : ""}`} onClick={useMyLocation} disabled={locationLoading}>
            <LocateFixed size={18} /> {locationLoading ? "Localizando…" : location ? "A menos de 75 km" : "Cerca de mí"}
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
                onClick={() => selectFuel(option.code)}
              >
                {option.code === "adblue" ? <Droplets size={15} /> : <Fuel size={15} />}{option.short}
              </button>
            ))}
          </div>
        </div>

        {(fuel === "lpg" || fuel === "adblue") && !location ? (
          <button className="glp-now" onClick={useMyLocation} disabled={locationLoading}>
            <span><b>{fuel === "lpg" ? "GLP AHORA" : "ADBLUE AHORA"}</b><strong>Encuentra puntos confirmados cerca de ti</strong><small>Usamos una ubicación aproximada y no la guardamos.</small></span>
            {fuel === "adblue" ? <Droplets size={21} /> : <LocateFixed size={21} />}
          </button>
        ) : null}

        <div className="quick-filters" aria-label="Filtros rápidos">
          {fuel !== "lpg" ? <button
              className={requiredProducts.includes("lpg") ? "active" : ""}
              aria-pressed={requiredProducts.includes("lpg")}
              onClick={() => toggleRequiredProduct("lpg")}
            ><Fuel size={16} /> Tiene GLP</button> : null}
          {fuel !== "adblue" ? <button
              className={requiredProducts.includes("adblue") ? "active" : ""}
              aria-pressed={requiredProducts.includes("adblue")}
              onClick={() => toggleRequiredProduct("adblue")}
            ><Droplets size={16} /> Tiene AdBlue</button> : null}
          <button><Zap size={16} /> Carga EV</button>
          <button onClick={() => setFilterOpen(true)}><ListFilter size={16} /> Más</button>
        </div>
      </section>

      <section className="results-section" id="explorar">
        <div className="results-head">
          <div>
            <span className="result-kicker">CATÁLOGO OFICIAL · MITECO</span>
            <h2>{officialLoading ? "Buscando paradas…" : `${officialTotal.toLocaleString("es-ES")} con ${selectedFuel.label}`}</h2>
          </div>
          <label className="result-sort"><ListFilter size={14} /><select value={sort} onChange={(event) => { setSort(event.target.value as SortMode); setShowCount(20); }} aria-label="Ordenar resultados"><option value="price">Más baratas</option><option value="distance" disabled={!location}>Más cercanas</option></select></label>
        </div>

        <p className="official-context"><ShieldCheck size={14} /> {location ? "Estaciones en un radio de 75 km; la distancia es en línea recta." : province ? `Resultados oficiales en ${provinceLabel}.` : "Búsqueda nacional en toda España."} Precio y disponibilidad procedentes de MITECO.</p>

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
                  <p><MapPin size={13} /> {[station.address, station.municipality, displayProvince(station.province)].filter(Boolean).join(" · ")}</p>
                </div>
                <button className={`heart ${favorites.includes(station.id) ? "saved" : ""}`} aria-label="Guardar parada" onClick={() => toggleFavorite(station.id)}>
                  <Heart size={20} fill={favorites.includes(station.id) ? "currentColor" : "none"} />
                </button>
              </div>
              <div className="official-price-panel">
                {stationHighlights(station).map((item) => <div className={item.className} key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.detail}</small></div>)}
              </div>
              <div className="official-source"><Check size={13} /> MITECO · {formatOfficialTime(station.priceObservedAt)}</div>
              <div className="community-scores" aria-label="Valoraciones de servicios">
                {[
                  { code: "bathroom" as const, label: "Baños", icon: <Bath size={14} />, rating: station.bathroomRating, count: station.bathroomCount },
                  { code: "coffee" as const, label: "Café", icon: <Coffee size={14} />, rating: station.coffeeRating, count: station.coffeeCount },
                  { code: "cleanliness" as const, label: "Limpieza", icon: <Sparkles size={14} />, rating: station.cleanlinessRating, count: station.cleanlinessCount },
                ].map((service) => <button key={service.code} onClick={() => { setRatingStation(station.id); setRatingDimension(service.code); }}><span>{service.icon}{service.label}</span><strong>{service.count ? `${Number(service.rating).toFixed(1)} · ${service.count}` : "Valorar"}</strong></button>)}
              </div>
              <div className="official-actions">
                <a href={`https://www.google.com/maps/search/?api=1&query=${station.latE6 / 1_000_000},${station.lngE6 / 1_000_000}`} target="_blank" rel="noreferrer"><Navigation size={16} /> Cómo llegar</a>
                <button onClick={() => { setRatingStation(ratingStation === station.id ? null : station.id); setRatingDimension("overall"); }}><Star size={16} /> Valorar parada</button>
              </div>
              {ratingStation === station.id ? (
                <div className="rating-picker">
                  <div className="rating-dimensions">{ratingOptions.map((option) => <button className={ratingDimension === option.code ? "active" : ""} key={option.code} onClick={() => setRatingDimension(option.code)}>{option.code === "bathroom" ? <Bath size={13} /> : option.code === "coffee" ? <Coffee size={13} /> : option.code === "cleanliness" ? <Sparkles size={13} /> : <Star size={13} />}{option.label}</button>)}</div>
                  <span>¿Qué nota le das a {ratingOptions.find((item) => item.code === ratingDimension)?.label.toLowerCase()}?</span>
                  <div className="rating-stars">{[1, 2, 3, 4, 5].map((value) => <button key={value} aria-label={`${value} estrellas para ${ratingDimension}`} onClick={() => rateStation(station.id, value)}><Star size={22} fill="currentColor" /></button>)}</div>
                </div>
              ) : null}
            </article>
          ))}
        </div>

        {!officialLoading && showCount < officialStations.length ? (
          <button className="load-more" onClick={() => setShowCount((current) => current + 20)}>Ver 20 estaciones más</button>
        ) : null}
        {!officialLoading && officialTotal > officialStations.length ? <p className="result-limit">Mostramos las 100 mejores coincidencias. Usa provincia, búsqueda o cercanía para afinar.</p> : null}

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
