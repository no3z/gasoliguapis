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
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  UtensilsCrossed,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import StationMap, { type VisibleMapBounds } from "./station-map";

type FuelCode = "diesel_a" | "gasoline_95_e5" | "lpg" | "adblue";
type ProductCode = "lpg" | "adblue";
type SortMode = "price" | "distance" | "rating";
type ActiveNav = "map" | "search" | "saved" | "profile";
type RatingDimension = "overall" | "bathroom" | "coffee" | "cleanliness";
type ServiceFilter = "bathroom" | "coffee" | "restaurant" | "rated";
type ConfirmationCategory = "lpg_status" | "adblue_status" | "bathroom" | "coffee" | "restaurant" | "cleanliness";
type ConfirmationStatus = "working" | "no_product" | "broken" | "closed" | "clean" | "dirty" | "good" | "poor";

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
  overallRating?: number | null;
  overallCount?: number;
  bathroomRating?: number | null;
  bathroomCount?: number;
  coffeeRating?: number | null;
  coffeeCount?: number;
  cleanlinessRating?: number | null;
  cleanlinessCount?: number;
  fuelCommunityStatus?: ConfirmationStatus | null;
  fuelCommunityAt?: number | null;
  fuelCommunityNearby?: number | boolean;
  bathroomStatus?: ConfirmationStatus | null;
  bathroomStatusAt?: number | null;
  coffeeStatus?: ConfirmationStatus | null;
  coffeeStatusAt?: number | null;
  restaurantStatus?: ConfirmationStatus | null;
  restaurantStatusAt?: number | null;
  cleanlinessStatus?: ConfirmationStatus | null;
  cleanlinessStatusAt?: number | null;
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
const confirmationOptions: Record<ConfirmationCategory, Array<{ status: ConfirmationStatus; label: string; tone: "positive" | "negative" | "neutral" }>> = {
  lpg_status: [
    { status: "working", label: "He repostado GLP", tone: "positive" },
    { status: "no_product", label: "No había GLP", tone: "negative" },
    { status: "broken", label: "Surtidor averiado", tone: "negative" },
  ],
  adblue_status: [
    { status: "working", label: "He repostado AdBlue", tone: "positive" },
    { status: "no_product", label: "No había AdBlue", tone: "negative" },
    { status: "broken", label: "Surtidor averiado", tone: "negative" },
  ],
  bathroom: [
    { status: "clean", label: "Abierto y limpio", tone: "positive" },
    { status: "dirty", label: "Estaba sucio", tone: "negative" },
    { status: "closed", label: "Cerrado", tone: "neutral" },
  ],
  coffee: [
    { status: "good", label: "Abierto y bien", tone: "positive" },
    { status: "poor", label: "Mala experiencia", tone: "negative" },
    { status: "closed", label: "Cerrado", tone: "neutral" },
  ],
  restaurant: [
    { status: "good", label: "Abierto y bien", tone: "positive" },
    { status: "poor", label: "Mala experiencia", tone: "negative" },
    { status: "closed", label: "Cerrado", tone: "neutral" },
  ],
  cleanliness: [
    { status: "clean", label: "La parada está limpia", tone: "positive" },
    { status: "dirty", label: "Necesita limpieza", tone: "negative" },
  ],
};

const confirmationCategories: Array<{ code: ConfirmationCategory; label: string }> = [
  { code: "lpg_status", label: "GLP" },
  { code: "adblue_status", label: "AdBlue" },
  { code: "bathroom", label: "Baños" },
  { code: "coffee", label: "Café" },
  { code: "restaurant", label: "Restaurante" },
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
  const [mapBounds, setMapBounds] = useState<VisibleMapBounds | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [sort, setSort] = useState<SortMode>("price");
  const [fuel, setFuel] = useState<FuelCode>(initialFuel);
  const [requiredProducts, setRequiredProducts] = useState<ProductCode[]>([]);
  const [serviceFilters, setServiceFilters] = useState<ServiceFilter[]>([]);
  const [favorites, setFavorites] = useState<Array<number | string>>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [activeNav, setActiveNav] = useState<ActiveNav>("map");
  const [filterOpen, setFilterOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<{ signedIn: boolean; displayName: string | null }>({ signedIn: false, displayName: null });
  const [personalRatings, setPersonalRatings] = useState<Record<string, number>>({});
  const [toast, setToast] = useState("");
  const [officialState, setOfficialState] = useState<{
    key: string;
    stations: OfficialStation[];
    total: number;
    error: string;
  }>({ key: "", stations: [], total: 0, error: "" });
  const [ratingStation, setRatingStation] = useState<string | null>(null);
  const [ratingDimension, setRatingDimension] = useState<RatingDimension>("overall");
  const [confirmationStation, setConfirmationStation] = useState<OfficialStation | null>(null);
  const [directionsStation, setDirectionsStation] = useState<OfficialStation | null>(null);
  const [confirmationCategory, setConfirmationCategory] = useState<ConfirmationCategory>("bathroom");
  const [confirmationSaving, setConfirmationSaving] = useState(false);
  const [clockNow] = useState(Date.now);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [showCount, setShowCount] = useState(20);

  const selectedFuel = fuelOptions.find((item) => item.code === fuel) ?? fuelOptions[0];
  const provinceLabel = displayProvince(province);
  const requiredProductsKey = [...requiredProducts].sort().join(",");
  const serviceFiltersKey = [...serviceFilters].sort().join(",");
  const locationKey = location ? `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}` : "national";
  const mapBoundsKey = mapBounds
    ? `${mapBounds.west.toFixed(4)},${mapBounds.south.toFixed(4)},${mapBounds.east.toFixed(4)},${mapBounds.north.toFixed(4)}`
    : "no-bounds";
  const officialRequestKey = `${fuel}|${province}|${requiredProductsKey}|${serviceFiltersKey}|${searchTerm}|${locationKey}|${mapBoundsKey}|${sort}`;
  const officialLoading = (locationLoading && !location) || officialState.key !== officialRequestKey;
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
    try {
      const saved = JSON.parse(window.localStorage.getItem("gasoliguapis:favorites") || "[]") as unknown;
      if (Array.isArray(saved)) window.setTimeout(() => setFavorites(saved.filter((id) => typeof id === "string" || typeof id === "number")), 0);
    } catch {
      // A private browser session may make local storage unavailable.
    }
  }, []);

  useEffect(() => {
    if (locationLoading && !location) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ fuel, limit: "100", sort });
    if (province) params.set("province", province);
    if (searchTerm) params.set("q", searchTerm);
    if (location) {
      params.set("lat", location.latitude.toFixed(4));
      params.set("lng", location.longitude.toFixed(4));
      params.set("radiusKm", "75");
    }
    if (mapBounds) params.set("bounds", mapBoundsKey);
    requiredProductsKey.split(",").filter(Boolean).forEach((product) => params.append("requires", product));
    serviceFiltersKey.split(",").filter(Boolean).forEach((service) => params.append("service", service));
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
              .filter((station) => !mapBounds || (
                station.lngE6 / 1_000_000 >= mapBounds.west
                && station.lngE6 / 1_000_000 <= mapBounds.east
                && station.latE6 / 1_000_000 >= mapBounds.south
                && station.latE6 / 1_000_000 <= mapBounds.north
              ))
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
                  overallRating: null, overallCount: 0,
                  bathroomRating: null, bathroomCount: 0,
                  coffeeRating: null, coffeeCount: 0,
                  cleanlinessRating: null, cleanlinessCount: 0,
                  fuelCommunityStatus: null, fuelCommunityAt: null, fuelCommunityNearby: 0,
                  bathroomStatus: null, bathroomStatusAt: null,
                  coffeeStatus: null, coffeeStatusAt: null,
                  restaurantStatus: null, restaurantStatusAt: null,
                  cleanlinessStatus: null, cleanlinessStatusAt: null,
                };
              })
              .filter(() => serviceFiltersKey.length === 0)
              .filter((station) => !location || mapBounds || Number(station.distanceKm) <= 75)
              .sort((left, right) => sort === "distance"
                ? Number(left.distanceKm) - Number(right.distanceKm)
                : sort === "rating"
                  ? Number(right.overallRating ?? 0) - Number(left.overallRating ?? 0) || left.priceMicros - right.priceMicros
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
  }, [fuel, location, locationLoading, mapBounds, mapBoundsKey, officialRequestKey, province, requiredProductsKey, searchTerm, serviceFiltersKey, sort]);

  const filteredOfficialStations = useMemo(
    () => favoritesOnly ? officialStations.filter((station) => favorites.includes(station.id)) : officialStations,
    [favorites, favoritesOnly, officialStations],
  );
  const orderedOfficialStations = useMemo(() => {
    if (!selectedStationId) return filteredOfficialStations;
    const selected = filteredOfficialStations.find((station) => station.id === selectedStationId);
    if (!selected) return filteredOfficialStations;
    const nearbyAlternatives = filteredOfficialStations
      .filter((station) => station.id !== selectedStationId)
      .map((station) => ({
        station,
        selectedDistanceKm: distanceKm(
          selected.latE6 / 1_000_000,
          selected.lngE6 / 1_000_000,
          station.latE6 / 1_000_000,
          station.lngE6 / 1_000_000,
        ),
      }))
      .sort((left, right) => left.selectedDistanceKm - right.selectedDistanceKm || left.station.priceMicros - right.station.priceMicros)
      .map(({ station }) => station);
    return [selected, ...nearbyAlternatives];
  }, [filteredOfficialStations, selectedStationId]);
  const visibleOfficialStations = useMemo(() => orderedOfficialStations.slice(0, showCount), [orderedOfficialStations, showCount]);
  const recommendedStationId = useMemo(() => {
    if (!location || officialStations.length === 0) return null;
    const candidates = officialStations.slice(0, 40);
    const prices = candidates.map((station) => station.priceMicros);
    const distances = candidates.map((station) => Number(station.distanceKm ?? 75));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const maxDistance = Math.max(...distances, 1);
    return candidates.map((station) => {
      const serviceRatings = [station.bathroomRating, station.coffeeRating, station.cleanlinessRating]
        .filter((value): value is number => typeof value === "number");
      const serviceScore = serviceRatings.length
        ? serviceRatings.reduce((sum, value) => sum + value, 0) / serviceRatings.length / 5
        : .5;
      const priceScore = maxPrice === minPrice ? 1 : 1 - (station.priceMicros - minPrice) / (maxPrice - minPrice);
      const distanceScore = 1 - Math.min(Number(station.distanceKm ?? maxDistance), maxDistance) / maxDistance;
      return { id: station.id, score: distanceScore * .5 + priceScore * .35 + serviceScore * .15 };
    }).sort((left, right) => right.score - left.score)[0]?.id ?? null;
  }, [location, officialStations]);
  const recommendedStation = recommendedStationId
    ? officialStations.find((station) => station.id === recommendedStationId) ?? null
    : null;
  const selectedOfficialStation = selectedStationId
    ? officialStations.find((station) => station.id === selectedStationId) ?? null
    : null;

  const scrollToSection = (id: "mapa" | "buscar" | "explorar") => {
    window.requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const searchVisibleMapArea = (bounds: VisibleMapBounds) => {
    setMapBounds(bounds);
    setProvince("");
    setSelectedStationId(null);
    setFavoritesOnly(false);
    setShowCount(20);
    setActiveNav("map");
    showToast("Buscando en toda el área visible");
  };

  const showMap = () => {
    setFavoritesOnly(false);
    setActiveNav("map");
    scrollToSection("mapa");
  };

  const showSearch = () => {
    setFavoritesOnly(false);
    setActiveNav("search");
    scrollToSection("buscar");
  };

  const showSavedStations = () => {
    setFavoritesOnly(true);
    setSelectedStationId(null);
    setShowCount(20);
    setActiveNav("saved");
    scrollToSection("explorar");
    if (favorites.length === 0) showToast("Guarda una parada con el corazón para verla aquí");
  };

  const contributeStation = selectedOfficialStation ?? recommendedStation ?? officialStations[0] ?? null;
  const contribute = () => {
    if (!contributeStation) {
      showToast("Busca y selecciona una estación para confirmar sus datos");
      showMap();
      return;
    }
    openConfirmation(contributeStation);
  };

  const focusStationOnMap = (stationId: string) => {
    setSelectedStationId(stationId);
    setActiveNav("map");
    window.requestAnimationFrame(() => document.getElementById("mapa")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const openStationInList = (stationId: string) => {
    setSelectedStationId(stationId);
    setActiveNav("search");
    setShowCount((current) => Math.max(current, 20));
    window.setTimeout(() => document.getElementById(`station-${stationId.replace(/[^a-zA-Z0-9_-]/g, "-")}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
  };

  const openDirections = (stationId: string) => {
    const station = officialStations.find((item) => item.id === stationId);
    if (station) setDirectionsStation(station);
  };

  const toggleFavorite = (id: number | string) => {
    setFavorites((current) => {
      const next = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      try { window.localStorage.setItem("gasoliguapis:favorites", JSON.stringify(next)); } catch {
        // Favorites remain available for this visit if storage is unavailable.
      }
      return next;
    });
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

  const toggleServiceFilter = (service: ServiceFilter) => {
    setServiceFilters((current) => current.includes(service)
      ? current.filter((item) => item !== service)
      : [...current, service]);
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
    setMapBounds(null);
    setSort("price");
    setRequiredProducts([]);
    setServiceFilters([]);
    setFuel(initialFuel);
    setFavoritesOnly(false);
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
        setMapBounds(null);
        setLocation({
          latitude: Number(position.coords.latitude.toFixed(4)),
          longitude: Number(position.coords.longitude.toFixed(4)),
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
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 120_000 },
    );
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      window.setTimeout(() => setLocationLoading(false), 0);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setMapBounds(null);
        setLocation({
          latitude: Number(position.coords.latitude.toFixed(4)),
          longitude: Number(position.coords.longitude.toFixed(4)),
        });
        setProvince("");
        setSort("distance");
        setShowCount(20);
        setLocationLoading(false);
      },
      () => {
        setLocationLoading(false);
        setToast("Activa la ubicación para ver primero las estaciones cercanas");
        window.setTimeout(() => setToast(""), 2600);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 120_000 },
    );
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/me/ratings", { cache: "no-store" })
      .then(async (response) => response.ok
        ? await response.json() as { signedIn?: boolean; displayName?: string | null; ratings?: Record<string, number> }
        : null)
      .then((payload) => {
        if (!active || !payload) return;
        setSessionUser({ signedIn: Boolean(payload.signedIn), displayName: payload.displayName ?? null });
        setPersonalRatings(payload.ratings ?? {});
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

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
    const station = officialStations.find((item) => item.id === stationId);
    const response = await fetch(`/api/stations/${encodeURIComponent(stationId)}/ratings/${ratingDimension}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        value,
        station: station ? {
          name: station.name,
          brand: station.brand,
          address: station.address,
          municipality: station.municipality,
          province: station.province,
          latE6: station.latE6,
          lngE6: station.lngE6,
        } : undefined,
      }),
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
    if (payload.stats) {
      const ratingField = `${ratingDimension}Rating` as "overallRating" | "bathroomRating" | "coffeeRating" | "cleanlinessRating";
      const countField = `${ratingDimension}Count` as "overallCount" | "bathroomCount" | "coffeeCount" | "cleanlinessCount";
      setOfficialState((current) => ({
        ...current,
        stations: current.stations.map((station) => station.id === stationId
          ? { ...station, [ratingField]: payload.stats?.average, [countField]: payload.stats?.count }
          : station),
      }));
    }
    if (ratingDimension === "overall") {
      setPersonalRatings((current) => ({ ...current, [stationId]: value }));
    }
    setSessionUser((current) => ({ signedIn: true, displayName: current.displayName }));
    const dimensionLabel = ratingOptions.find((item) => item.code === ratingDimension)?.label.toLowerCase() || "parada";
    showToast(`Tu valoración de ${dimensionLabel}: ${value} estrellas`);
  };

  const openConfirmation = (station: OfficialStation, category?: ConfirmationCategory) => {
    setConfirmationStation(station);
    setConfirmationCategory(category ?? (fuel === "lpg" ? "lpg_status" : fuel === "adblue" ? "adblue_status" : "bathroom"));
  };

  const submitConfirmation = async (status: ConfirmationStatus) => {
    if (!confirmationStation || confirmationSaving) return;
    setConfirmationSaving(true);
    try {
      const response = await fetch(`/api/stations/${encodeURIComponent(confirmationStation.id)}/confirmations`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          category: confirmationCategory,
          status,
          latitude: location?.latitude,
          longitude: location?.longitude,
          station: {
            name: confirmationStation.name,
            brand: confirmationStation.brand,
            address: confirmationStation.address,
            municipality: confirmationStation.municipality,
            province: confirmationStation.province,
            latE6: confirmationStation.latE6,
            lngE6: confirmationStation.lngE6,
          },
        }),
      });
      if (response.status === 401) {
        setConfirmationStation(null);
        await openLogin();
        return;
      }
      if (!response.ok) throw new Error("confirmation-failed");
      const payload = await response.json() as { confirmation: { createdAt: number; proximityVerified: boolean } };
      const fields: Partial<OfficialStation> = confirmationCategory === "lpg_status" || confirmationCategory === "adblue_status"
        ? ((confirmationCategory === `${fuel}_status`) ? {
            fuelCommunityStatus: status,
            fuelCommunityAt: payload.confirmation.createdAt,
            fuelCommunityNearby: payload.confirmation.proximityVerified,
          } : {})
        : confirmationCategory === "bathroom"
          ? { bathroomStatus: status, bathroomStatusAt: payload.confirmation.createdAt }
          : confirmationCategory === "coffee"
            ? { coffeeStatus: status, coffeeStatusAt: payload.confirmation.createdAt }
            : confirmationCategory === "restaurant"
              ? { restaurantStatus: status, restaurantStatusAt: payload.confirmation.createdAt }
              : { cleanlinessStatus: status, cleanlinessStatusAt: payload.confirmation.createdAt };
      setOfficialState((current) => ({
        ...current,
        stations: current.stations.map((station) => station.id === confirmationStation.id ? { ...station, ...fields } : station),
      }));
      setSessionUser((current) => ({ signedIn: true, displayName: current.displayName }));
      setConfirmationStation(null);
      showToast(payload.confirmation.proximityVerified ? "Confirmación guardada · cercanía comprobada" : "Confirmación guardada");
    } catch {
      showToast("No se pudo guardar la confirmación");
    } finally {
      setConfirmationSaving(false);
    }
  };

  const formatPrice = (micros: number | null) => micros === null
    ? "—"
    : `${(micros / 1_000_000).toLocaleString("es-ES", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} €`;

  const formatOfficialTime = (timestamp: number | null) => timestamp
    ? new Date(timestamp).toLocaleString("es-ES", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "sin hora";

  const recentConfirmation = (status?: ConfirmationStatus | null, timestamp?: number | null) => {
    if (!status || !timestamp) return null;
    const negative = status === "no_product" || status === "broken" || status === "closed" || status === "dirty" || status === "poor";
    return clockNow > 0 && clockNow - timestamp <= (negative ? 6 : 24) * 60 * 60 * 1000 ? status : null;
  };

  const confirmationAge = (timestamp?: number | null) => {
    if (!timestamp) return "";
    const minutes = Math.max(1, Math.round((clockNow - timestamp) / 60_000));
    return minutes < 60 ? `hace ${minutes} min` : `hace ${Math.round(minutes / 60)} h`;
  };

  const serviceStatusText = (status?: ConfirmationStatus | null, timestamp?: number | null) => {
    const recent = recentConfirmation(status, timestamp);
    if (recent === "clean") return "Limpio ahora";
    if (recent === "good") return "Abierto y bien";
    if (recent === "dirty") return "Aviso: sucio";
    if (recent === "poor") return "Aviso reciente";
    if (recent === "closed") return "Cerrado ahora";
    return null;
  };

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

      <section className="map-stage advanced" aria-labelledby="map-heading">
        <h1 className="sr-only" id="map-heading">MAPA NACIONAL DE PARADAS · Encuentra tu mejor parada y las gasolineras cerca de ti</h1>
        <div className="map-canvas-shell">
          <StationMap
            stations={filteredOfficialStations}
            selectedId={selectedStationId}
            userLocation={location}
            loading={officialLoading}
            fuelLabel={selectedFuel.label}
            personalRatings={personalRatings}
            lockViewport={Boolean(mapBounds)}
            onSelect={(stationId) => { setSelectedStationId(stationId); setActiveNav("map"); }}
            onOpenList={openStationInList}
            onDirections={openDirections}
            onRequestLocation={useMyLocation}
            onSearchVisibleArea={searchVisibleMapArea}
          />
        </div>
      </section>

      <section className="search-section" id="buscar" aria-labelledby="search-heading">
        <div className="search-section-head">
          <div><span>AFINA TU PARADA</span><h2 id="search-heading">¿Dónde y qué buscas?</h2><p>Combustible, servicios y puntuaciones en un solo lugar.</p></div>
          <small>{officialLoading ? "Buscando gasolineras…" : `${officialTotal.toLocaleString("es-ES")} coincidencias`}</small>
        </div>
        <div className="search-controls">
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
                  setMapBounds(null);
                  setFavoritesOnly(false);
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
            <LocateFixed size={18} /> {locationLoading ? "Cerca de mí · localizando…" : location ? "A menos de 75 km" : "Cerca de mí"}
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
          <button className={serviceFilters.includes("bathroom") ? "active" : ""} aria-pressed={serviceFilters.includes("bathroom")} onClick={() => toggleServiceFilter("bathroom")}><Bath size={16} /> Baños</button>
          <button className={serviceFilters.includes("coffee") ? "active" : ""} aria-pressed={serviceFilters.includes("coffee")} onClick={() => toggleServiceFilter("coffee")}><Coffee size={16} /> Cafetería</button>
          <button className={serviceFilters.includes("restaurant") ? "active" : ""} aria-pressed={serviceFilters.includes("restaurant")} onClick={() => toggleServiceFilter("restaurant")}><UtensilsCrossed size={16} /> Restaurante</button>
          <button className={serviceFilters.includes("rated") ? "active" : ""} aria-pressed={serviceFilters.includes("rated")} onClick={() => toggleServiceFilter("rated")}><Star size={16} /> Con puntuación</button>
          <button onClick={() => setFilterOpen(true)}><ListFilter size={16} /> Más</button>
          </div>
        </div>
      </section>

      <section className="results-section" id="explorar">
        <div className="results-head">
          <div>
            <span className="result-kicker">{favoritesOnly ? "GUARDADAS EN ESTE DISPOSITIVO" : mapBounds ? "ÁREA VISIBLE · MITECO" : "CATÁLOGO OFICIAL · MITECO"}</span>
            <h2>{officialLoading ? "Buscando paradas…" : favoritesOnly ? `${filteredOfficialStations.length.toLocaleString("es-ES")} guardadas en estos resultados` : `${officialTotal.toLocaleString("es-ES")} con ${selectedFuel.label}`}</h2>
          </div>
          <label className="result-sort"><ListFilter size={14} /><select value={selectedStationId ? "selected" : sort} onChange={(event) => { setSelectedStationId(null); setSort(event.target.value as SortMode); setShowCount(20); }} aria-label="Ordenar resultados">{selectedStationId ? <option value="selected">Seleccionada + cercanas</option> : null}<option value="price">Más baratas</option><option value="rating">Mejor puntuadas</option><option value="distance" disabled={!location}>Más cercanas</option></select></label>
        </div>

        <p className="official-context"><ShieldCheck size={14} /> {favoritesOnly ? "Tus guardadas se conservan en este dispositivo y respetan los filtros actuales." : mapBounds ? "Estaciones dentro del rectángulo visible del mapa; mueve el mapa para buscar en otra zona." : location ? "Estaciones en un radio de 75 km; la distancia es en línea recta." : province ? `Resultados oficiales en ${provinceLabel}.` : "Búsqueda nacional en toda España."} Precio y disponibilidad procedentes de MITECO.</p>

        {officialError ? <div className="official-message error"><X size={18} /> {officialError}</div> : null}
        {!officialLoading && !officialError && visibleOfficialStations.length === 0 ? (
          <div className="official-message"><Fuel size={19} /><div><strong>{favoritesOnly ? "No tienes paradas guardadas en estos resultados" : "Aún no aparecen estaciones con estos criterios"}</strong><span>{favoritesOnly ? "Vuelve a explorar y toca el corazón de una estación para guardarla." : "Prueba otra búsqueda, quita GLP o AdBlue, o cambia de tramo."}</span><button onClick={favoritesOnly ? showSearch : clearFilters}>{favoritesOnly ? "Volver a buscar" : "Limpiar filtros"}</button></div></div>
        ) : null}
        {officialLoading ? <div className="official-loading"><span /><span /><span /></div> : null}

        {recommendedStation && !officialLoading && !favoritesOnly && !mapBounds ? (
          <div className="recommendation-card">
            <Sparkles size={19} />
            <div><span>NUESTRA PROPUESTA CERCA DE TI</span><strong>{recommendedStation.name}</strong><small>{Number(recommendedStation.distanceKm).toFixed(1)} km · {formatPrice(recommendedStation.priceMicros)} · equilibrio entre cercanía, precio y valoraciones disponibles</small></div>
            <a href={`#station-${recommendedStation.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`}>Ver</a>
          </div>
        ) : null}

        <div className="official-list">
          {visibleOfficialStations.map((station) => (
            <article className={`official-card ${recommendedStationId === station.id ? "recommended" : ""} ${selectedStationId === station.id ? "map-selected" : ""}`} id={`station-${station.id.replace(/[^a-zA-Z0-9_-]/g, "-")}`} key={station.id}>
              {selectedStationId === station.id ? <span className="recommended-ribbon selected"><MapPin size={11} /> Seleccionada en el mapa</span> : recommendedStationId === station.id ? <span className="recommended-ribbon"><Sparkles size={11} /> Mejor equilibrio</span> : null}
              <div className="official-card-head">
                <div className="station-logo official">{(station.brand || station.name).slice(0, 1)}</div>
                <div>
                  {selectedOfficialStation && station.id !== selectedOfficialStation.id ? <span className="near-selected"><MapPin size={11} /> {distanceKm(selectedOfficialStation.latE6 / 1_000_000, selectedOfficialStation.lngE6 / 1_000_000, station.latE6 / 1_000_000, station.lngE6 / 1_000_000).toFixed(1)} km de la seleccionada</span> : null}
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
              <button className={`overall-score ${personalRatings[station.id] ? "user-rated" : ""}`} onClick={() => { setRatingStation(station.id); setRatingDimension("overall"); }}>
                <span><Star size={15} fill="currentColor" /> {personalRatings[station.id] ? `Tu nota ${personalRatings[station.id]}/5` : station.overallCount ? Number(station.overallRating).toFixed(1) : "Sin nota"}</span>
                <small>{personalRatings[station.id] ? `${station.overallCount ? `Media ${Number(station.overallRating).toFixed(1)} · ` : ""}Toca para cambiar tu valoración` : station.overallCount ? `${station.overallCount} valoraciones de la parada` : "Sé la primera persona en puntuarla"}</small>
              </button>
              {(fuel === "lpg" || fuel === "adblue") && recentConfirmation(station.fuelCommunityStatus, station.fuelCommunityAt) ? (
                <div className={`fuel-confirmation ${station.fuelCommunityStatus === "working" ? "positive" : "warning"}`}>
                  {station.fuelCommunityStatus === "working" ? <ShieldCheck size={15} /> : <X size={15} />}
                  <span><strong>{station.fuelCommunityStatus === "working" ? `${selectedFuel.label} confirmado funcionando` : station.fuelCommunityStatus === "broken" ? `Aviso: surtidor de ${selectedFuel.label} averiado` : `Aviso: sin ${selectedFuel.label}`}</strong><small>Un aviso comunitario · {confirmationAge(station.fuelCommunityAt)}{station.fuelCommunityNearby ? " · cercanía comprobada" : ""}</small></span>
                </div>
              ) : null}
              <div className="community-scores" aria-label="Valoraciones de servicios">
                {[
                  { code: "bathroom" as const, label: "Baños", icon: <Bath size={14} />, rating: station.bathroomRating, count: station.bathroomCount, status: station.bathroomStatus, statusAt: station.bathroomStatusAt },
                  { code: "coffee" as const, label: "Café", icon: <Coffee size={14} />, rating: station.coffeeRating, count: station.coffeeCount, status: station.coffeeStatus, statusAt: station.coffeeStatusAt },
                  { code: "restaurant" as const, label: "Restaurante", icon: <UtensilsCrossed size={14} />, rating: null, count: 0, status: station.restaurantStatus, statusAt: station.restaurantStatusAt },
                  { code: "cleanliness" as const, label: "Limpieza", icon: <Sparkles size={14} />, rating: station.cleanlinessRating, count: station.cleanlinessCount, status: station.cleanlinessStatus, statusAt: station.cleanlinessStatusAt },
                ].map((service) => <button key={service.code} onClick={() => openConfirmation(station, service.code)}><span>{service.icon}{service.label}</span><strong>{serviceStatusText(service.status, service.statusAt) || (service.count ? `${Number(service.rating).toFixed(1)} · ${service.count}` : "Confirmar")}</strong></button>)}
              </div>
              <button className="confirm-now" onClick={() => openConfirmation(station)}><LocateFixed size={16} /> Confirmar GLP, AdBlue o servicios <span>10 s</span></button>
              <div className="official-actions">
                <button className="map-action" onClick={() => focusStationOnMap(station.id)}><MapPin size={16} /> Ver en mapa</button>
                <button onClick={() => setDirectionsStation(station)}><Navigation size={16} /> Cómo llegar</button>
                <button onClick={() => { setRatingStation(ratingStation === station.id ? null : station.id); setRatingDimension("overall"); }}><Star size={16} /> Puntuar</button>
              </div>
              {ratingStation === station.id ? (
                <div className="rating-picker">
                  <div className="rating-dimensions">{ratingOptions.map((option) => <button className={ratingDimension === option.code ? "active" : ""} key={option.code} onClick={() => setRatingDimension(option.code)}>{option.code === "bathroom" ? <Bath size={13} /> : option.code === "coffee" ? <Coffee size={13} /> : option.code === "cleanliness" ? <Sparkles size={13} /> : <Star size={13} />}{option.label}</button>)}</div>
                  <span>¿Qué nota le das a {ratingOptions.find((item) => item.code === ratingDimension)?.label.toLowerCase()}?</span>
                  <div className="rating-stars">{[1, 2, 3, 4, 5].map((value) => {
                    const selected = ratingDimension === "overall" && value <= (personalRatings[station.id] || 0);
                    return <button className={selected ? "active" : ""} key={value} aria-label={`${value} estrellas para ${ratingDimension}`} onClick={() => rateStation(station.id, value)}><Star size={22} fill={selected ? "currentColor" : "none"} /></button>;
                  })}</div>
                </div>
              ) : null}
            </article>
          ))}
        </div>

        {!officialLoading && showCount < filteredOfficialStations.length ? (
          <button className="load-more" onClick={() => setShowCount((current) => current + 20)}>Ver 20 estaciones más</button>
        ) : null}
        {!officialLoading && !favoritesOnly && officialTotal > officialStations.length ? <p className="result-limit">Mostramos las 100 mejores coincidencias. Usa provincia, búsqueda o cercanía para afinar.</p> : null}

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

      <button className="contribute" onClick={contribute} aria-label="Confirmar datos de una estación"><ShieldCheck size={22} /> <span>Confirmar datos</span></button>

      <nav className="bottom-nav" aria-label="Navegación principal">
        <button className={activeNav === "map" ? "active" : ""} onClick={showMap}><MapPin size={21} /><span>Mapa</span></button>
        <button className={activeNav === "search" ? "active" : ""} onClick={showSearch}><Search size={21} /><span>Buscar</span></button>
        <button className={activeNav === "saved" ? "active" : ""} onClick={showSavedStations}><Bookmark size={21} /><span>Guardadas{favorites.length ? ` (${favorites.length})` : ""}</span></button>
        <button className={activeNav === "profile" ? "active" : ""} onClick={() => { setActiveNav("profile"); void openLogin(); }}><UserRound size={21} /><span>Perfil</span></button>
      </nav>

      {directionsStation ? (
        <div className="overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDirectionsStation(null); }}>
          <section className="directions-sheet" role="dialog" aria-modal="true" aria-label={`Cómo llegar a ${directionsStation.name}`}>
            <div className="sheet-grabber" />
            <div className="modal-title"><div><span>ABRIR NAVEGACIÓN</span><h2>¿Con qué mapa?</h2></div><button onClick={() => setDirectionsStation(null)} aria-label="Cerrar"><X /></button></div>
            <p><MapPin size={14} /> {directionsStation.name} · {directionsStation.municipality}</p>
            <div className="directions-options">
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${directionsStation.latE6 / 1_000_000},${directionsStation.lngE6 / 1_000_000}&travelmode=driving`} target="_blank" rel="noreferrer" onClick={() => setDirectionsStation(null)}><span className="maps-logo google">G</span><div><strong>Google Maps</strong><small>Abrir ruta en coche</small></div><Navigation size={18} /></a>
              <a href={`https://maps.apple.com/?daddr=${directionsStation.latE6 / 1_000_000},${directionsStation.lngE6 / 1_000_000}&dirflg=d`} target="_blank" rel="noreferrer" onClick={() => setDirectionsStation(null)}><span className="maps-logo apple">A</span><div><strong>Apple Maps</strong><small>Abrir ruta en coche</small></div><Navigation size={18} /></a>
            </div>
            <small className="directions-note">La navegación se abre fuera de Gasoliguapis con las coordenadas oficiales de la estación.</small>
          </section>
        </div>
      ) : null}

      {confirmationStation ? (
        <div className="overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmationStation(null); }}>
          <section className="confirmation-sheet" role="dialog" aria-modal="true" aria-label={`Confirmar servicios en ${confirmationStation.name}`}>
            <div className="sheet-grabber" />
            <div className="modal-title"><div><span>CONFIRMACIÓN RÁPIDA</span><h2>¿Qué has encontrado?</h2></div><button onClick={() => setConfirmationStation(null)} aria-label="Cerrar"><X /></button></div>
            <p className="confirmation-station"><MapPin size={14} /> {confirmationStation.name}</p>
            <div className="confirmation-categories" aria-label="Qué quieres confirmar">
              {confirmationCategories.map((option) => <button className={confirmationCategory === option.code ? "active" : ""} key={option.code} onClick={() => setConfirmationCategory(option.code)}>{option.label}</button>)}
            </div>
            <div className="confirmation-answers">
              {confirmationOptions[confirmationCategory].map((option) => <button className={option.tone} disabled={confirmationSaving} key={option.status} onClick={() => submitConfirmation(option.status)}><span>{option.label}</span><Check size={17} /></button>)}
            </div>
            <div className={`proximity-box ${location ? "ready" : ""}`}>
              <LocateFixed size={18} />
              <div><strong>{location ? "Cercanía lista para comprobar" : "Haz más fiable tu aviso"}</strong><span>{location ? "El servidor comprueba que estás cerca y descarta inmediatamente las coordenadas." : "Podemos comprobar que estás cerca. Tu ubicación no se guarda."}</span></div>
              {!location ? <button onClick={useMyLocation} disabled={locationLoading}>{locationLoading ? "…" : "Comprobar"}</button> : null}
            </div>
            <small className="confirmation-note"><ShieldCheck size={13} /> La confirmación es temporal y nunca sustituye el dato oficial de MITECO.</small>
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
              {[
                { code: "bathroom" as const, label: "Baños confirmados" },
                { code: "coffee" as const, label: "Cafetería confirmada" },
                { code: "restaurant" as const, label: "Restaurante confirmado" },
                { code: "rated" as const, label: "Con puntuaciones" },
              ].map((item) => <button className={serviceFilters.includes(item.code) ? "selected" : ""} aria-pressed={serviceFilters.includes(item.code)} key={item.code} onClick={() => toggleServiceFilter(item.code)}><span>{item.label}</span><Check size={16} /></button>)}
              {["Abierto 24 h", "Duchas"].map((item) => <button key={item} disabled title="Disponible cuando completemos esta fuente"><span>{item}</span><small>pronto</small></button>)}
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
