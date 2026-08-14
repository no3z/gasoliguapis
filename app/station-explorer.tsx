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
import { trackAnalyticsEvent } from "./analytics";
import { displayProvince, PROVINCES } from "./provinces";
import { CONTACT_EMAIL, legalNavigation } from "./site-config";
import StationMap, { type VisibleMapBounds } from "./station-map";

type FuelCode = "diesel_a" | "gasoline_95_e5" | "lpg" | "adblue";
type SortMode = "price" | "distance" | "rating";
type ActiveNav = "map" | "search" | "saved" | "profile";
type RatingDimension = "overall" | "bathroom" | "coffee" | "cleanliness";
type PersonalRatings = Record<string, Partial<Record<RatingDimension, number>>>;
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
  gasoline95PriceMicros?: number | null;
  dieselPriceMicros?: number | null;
  distanceKm?: number | null;
  overallRating?: number | null;
  overallCount?: number;
  overallRankScore?: number | null;
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

const fuelOptions: { code: FuelCode; label: string; short: string }[] = [
  { code: "gasoline_95_e5", label: "Gasolina 95", short: "95" },
  { code: "diesel_a", label: "Gasóleo A", short: "Diésel" },
  { code: "lpg", label: "GLP", short: "GLP" },
  { code: "adblue", label: "AdBlue", short: "AdBlue" },
];
const DEFAULT_FUEL: FuelCode = "gasoline_95_e5";
const FUEL_STORAGE_KEY = "gasoliguapis:fuel";
const radiusOptions = [10, 25, 50, 75, 100, 200] as const;
const MAP_STATION_LIMIT = 8;
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

function ratingConfidence(count = 0) {
  if (count >= 20) return "Confianza alta";
  if (count >= 5) return "Confianza media";
  if (count > 0) return "Pocos votos";
  return "Sin votos";
}

function RatingStars({ value }: { value: number }) {
  const rounded = Math.max(0, Math.min(5, Math.round(value)));
  return <span className="rating-stars-display" aria-label={`${value.toFixed(1)} de 5 estrellas`}>
    {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={11} fill={star <= rounded ? "currentColor" : "none"} />)}
  </span>;
}

function weightedRating(average?: number | null, count = 0) {
  return average && count ? (average * count + 3.5 * 5) / (count + 5) : 0;
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
  initialFuel = DEFAULT_FUEL,
  initialProvince = "",
  autoLocate = true,
  pageHeading = "MAPA NACIONAL DE PARADAS · Encuentra tu mejor parada y las gasolineras cerca de ti",
}: {
  signInPath: string;
  initialFuel?: FuelCode;
  initialProvince?: string;
  autoLocate?: boolean;
  pageHeading?: string;
}) {
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [province, setProvince] = useState(initialProvince);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapBounds, setMapBounds] = useState<VisibleMapBounds | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [radiusKm, setRadiusKm] = useState(75);
  const [sort, setSort] = useState<SortMode>("price");
  const [fuel, setFuel] = useState<FuelCode>(initialFuel);
  const [serviceFilters, setServiceFilters] = useState<ServiceFilter[]>([]);
  const [favorites, setFavorites] = useState<Array<number | string>>([]);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [mineOnly, setMineOnly] = useState(false);
  const [activeNav, setActiveNav] = useState<ActiveNav>("map");
  const [filterOpen, setFilterOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [sessionUser, setSessionUser] = useState<{ signedIn: boolean; displayName: string | null }>({ signedIn: false, displayName: null });
  const [personalRatings, setPersonalRatings] = useState<PersonalRatings>({});
  const [toast, setToast] = useState("");
  const [officialState, setOfficialState] = useState<{
    key: string;
    stations: OfficialStation[];
    total: number;
    error: string;
  }>({ key: "", stations: [], total: 0, error: "" });
  const [ratingStation, setRatingStation] = useState<string | null>(null);
  const [ratingDimension, setRatingDimension] = useState<RatingDimension>("overall");
  const [ratingSaving, setRatingSaving] = useState(false);
  const [confirmationStation, setConfirmationStation] = useState<OfficialStation | null>(null);
  const [directionsStation, setDirectionsStation] = useState<OfficialStation | null>(null);
  const [confirmationCategory, setConfirmationCategory] = useState<ConfirmationCategory>("bathroom");
  const [confirmationSaving, setConfirmationSaving] = useState(false);
  const [clockNow] = useState(Date.now);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [showCount, setShowCount] = useState(20);

  const selectedFuel = fuelOptions.find((item) => item.code === fuel) ?? fuelOptions[0];
  const provinceLabel = displayProvince(province);
  const serviceFiltersKey = [...serviceFilters].sort().join(",");
  const locationKey = location ? `${location.latitude.toFixed(4)},${location.longitude.toFixed(4)}` : "national";
  const mapBoundsKey = mapBounds
    ? `${mapBounds.west.toFixed(4)},${mapBounds.south.toFixed(4)},${mapBounds.east.toFixed(4)},${mapBounds.north.toFixed(4)}`
    : "no-bounds";
  const officialRequestKey = `${fuel}|${province}|${serviceFiltersKey}|${searchTerm}|${locationKey}|${mapBoundsKey}|${radiusKm}|${sort}`;
  const officialLoading = (locationLoading && !location) || officialState.key !== officialRequestKey;
  const officialStations = useMemo(
    () => officialLoading ? [] : officialState.stations,
    [officialLoading, officialState.stations],
  );
  const officialError = officialLoading ? "" : officialState.error;
  const officialTotal = officialLoading ? 0 : officialState.total;
  const personalOverallRatings = useMemo(() => Object.fromEntries(
    Object.entries(personalRatings)
      .filter(([, ratings]) => typeof ratings.overall === "number")
      .map(([stationId, ratings]) => [stationId, ratings.overall as number]),
  ), [personalRatings]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const normalized = query.trim();
      setSearchTerm(normalized);
      if (normalized.length >= 3) trackAnalyticsEvent("search", {
        search_term: "station_text",
        query_length: normalized.length,
        fuel,
        scope: province ? "province" : location ? "nearby" : "national",
      });
    }, 320);
    return () => window.clearTimeout(timeout);
  }, [fuel, location, province, query]);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem("gasoliguapis:favorites") || "[]") as unknown;
      if (Array.isArray(saved)) window.setTimeout(() => setFavorites(saved.filter((id) => typeof id === "string" || typeof id === "number")), 0);
    } catch {
      // A private browser session may make local storage unavailable.
    }
  }, []);

  useEffect(() => {
    if (initialFuel !== DEFAULT_FUEL) return;
    try {
      const savedFuel = window.localStorage.getItem(FUEL_STORAGE_KEY) as FuelCode | null;
      if (savedFuel && fuelOptions.some((option) => option.code === savedFuel)) setFuel(savedFuel);
    } catch {
      // The default remains available when local storage is unavailable.
    }
  }, [initialFuel]);

  useEffect(() => {
    if (locationLoading && !location) return;
    const controller = new AbortController();
    const params = new URLSearchParams({ fuel, limit: "100", sort });
    if (province) params.set("province", province);
    if (searchTerm) params.set("q", searchTerm);
    if (location) {
      params.set("lat", location.latitude.toFixed(4));
      params.set("lng", location.longitude.toFixed(4));
      params.set("radiusKm", String(radiusKm));
    }
    if (mapBounds) params.set("bounds", mapBoundsKey);
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
              .filter((station) => !location || mapBounds || Number(station.distanceKm) <= radiusKm)
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
  }, [fuel, location, locationLoading, mapBounds, mapBoundsKey, officialRequestKey, province, radiusKm, searchTerm, serviceFiltersKey, sort]);

  const filteredOfficialStations = useMemo(() => officialStations
    .filter((station) => !favoritesOnly || favorites.includes(station.id))
    .filter((station) => !mineOnly || Boolean(personalRatings[station.id]?.overall)),
  [favorites, favoritesOnly, mineOnly, officialStations, personalRatings]);
  const mapStations = useMemo(() => {
    const areaCenter = mapBounds ? {
      latitude: (mapBounds.north + mapBounds.south) / 2,
      longitude: (mapBounds.east + mapBounds.west) / 2,
    } : null;
    const reference = location ?? areaCenter;
    const nearest = [...filteredOfficialStations].sort((left, right) => {
      if (!reference) return 0;
      const leftDistance = typeof left.distanceKm === "number"
        ? left.distanceKm
        : distanceKm(reference.latitude, reference.longitude, left.latE6 / 1_000_000, left.lngE6 / 1_000_000);
      const rightDistance = typeof right.distanceKm === "number"
        ? right.distanceKm
        : distanceKm(reference.latitude, reference.longitude, right.latE6 / 1_000_000, right.lngE6 / 1_000_000);
      return leftDistance - rightDistance;
    }).slice(0, MAP_STATION_LIMIT);
    const selected = selectedStationId
      ? filteredOfficialStations.find((station) => station.id === selectedStationId)
      : null;
    if (!selected || nearest.some((station) => station.id === selected.id)) return nearest;
    return [selected, ...nearest.slice(0, MAP_STATION_LIMIT - 1)];
  }, [filteredOfficialStations, location, mapBounds, selectedStationId]);
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
    const distances = candidates.map((station) => Number(station.distanceKm ?? radiusKm));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const maxDistance = Math.max(...distances, 1);
    return candidates.map((station) => {
      const serviceRatings = [station.bathroomRating, station.coffeeRating, station.cleanlinessRating]
        .filter((value): value is number => typeof value === "number");
      const serviceScore = serviceRatings.length
        ? serviceRatings.reduce((sum, value) => sum + value, 0) / serviceRatings.length / 5
        : station.overallCount ? weightedRating(station.overallRating, station.overallCount) / 5 : .5;
      const priceScore = maxPrice === minPrice ? 1 : 1 - (station.priceMicros - minPrice) / (maxPrice - minPrice);
      const distanceScore = 1 - Math.min(Number(station.distanceKm ?? maxDistance), maxDistance) / maxDistance;
      return { id: station.id, score: distanceScore * .5 + priceScore * .35 + serviceScore * .15 };
    }).sort((left, right) => right.score - left.score)[0]?.id ?? null;
  }, [location, officialStations, radiusKm]);
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
    setMineOnly(false);
    setShowCount(20);
    setActiveNav("map");
    showToast("Buscando en toda el área visible");
    trackAnalyticsEvent("search_map_area", { fuel });
  };

  const showMap = () => {
    setFavoritesOnly(false);
    setMineOnly(false);
    setActiveNav("map");
    scrollToSection("mapa");
  };

  const showSearch = () => {
    setFavoritesOnly(false);
    setMineOnly(false);
    setActiveNav("search");
    scrollToSection("buscar");
  };

  const showSavedStations = () => {
    setFavoritesOnly(true);
    setMineOnly(false);
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
    trackAnalyticsEvent("select_content", { content_type: "station_map", item_id: stationId });
  };

  const openStationInList = (stationId: string) => {
    setSelectedStationId(stationId);
    setActiveNav("search");
    setShowCount((current) => Math.max(current, 20));
    window.setTimeout(() => document.getElementById(`station-${stationId.replace(/[^a-zA-Z0-9_-]/g, "-")}`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 50);
    trackAnalyticsEvent("select_content", { content_type: "station_card", item_id: stationId });
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
      trackAnalyticsEvent(current.includes(id) ? "remove_favorite" : "add_to_wishlist", { item_id: String(id) });
      return next;
    });
  };

  const selectRadius = (nextRadius: number) => {
    setRadiusKm(nextRadius);
    setMapBounds(null);
    setProvince("");
    setSelectedStationId(null);
    setShowCount(20);
    if (!location && !locationLoading) requestMyLocation();
    trackAnalyticsEvent("select_search_radius", { radius_km: nextRadius, fuel });
  };

  const toggleMineOnly = () => {
    if (!sessionUser.signedIn) {
      void openLogin();
      return;
    }
    setMineOnly((current) => !current);
    setFavoritesOnly(false);
    setSelectedStationId(null);
    setShowCount(20);
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const toggleServiceFilter = (service: ServiceFilter) => {
    setServiceFilters((current) => current.includes(service)
      ? current.filter((item) => item !== service)
      : [...current, service]);
    setShowCount(20);
    trackAnalyticsEvent("select_service_filter", { service, enabled: !serviceFilters.includes(service) });
  };

  const selectFuel = (nextFuel: FuelCode) => {
    const activeSpecialFuel = fuel === nextFuel && (nextFuel === "lpg" || nextFuel === "adblue");
    const resolvedFuel: FuelCode = activeSpecialFuel ? DEFAULT_FUEL : nextFuel;
    setFuel(resolvedFuel);
    try { window.localStorage.setItem(FUEL_STORAGE_KEY, resolvedFuel); } catch {
      // The choice still applies for the current visit.
    }
    setSelectedStationId(null);
    setFavoritesOnly(false);
    setMineOnly(false);
    setShowCount(20);
    trackAnalyticsEvent("select_fuel", { fuel: resolvedFuel });
  };

  const clearFilters = () => {
    setQuery("");
    setSearchTerm("");
    setProvince(initialProvince);
    setLocation(null);
    setMapBounds(null);
    setRadiusKm(75);
    setSort("price");
    setServiceFilters([]);
    setFuel(initialFuel);
    try { window.localStorage.setItem(FUEL_STORAGE_KEY, initialFuel); } catch {
      // The reset still applies for the current visit.
    }
    setFavoritesOnly(false);
    setMineOnly(false);
    setShowCount(20);
  };

  const requestMyLocation = () => {
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
        showToast(`Mostrando estaciones a menos de ${radiusKm} km`);
        trackAnalyticsEvent("use_location", { method: "manual", radius_km: radiusKm });
      },
      () => {
        setLocationLoading(false);
        showToast("No hemos podido obtener tu ubicación");
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 120_000 },
    );
  };

  useEffect(() => {
    if (!autoLocate) {
      window.setTimeout(() => setLocationLoading(false), 0);
      return;
    }
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
        trackAnalyticsEvent("use_location", { method: "automatic", radius_km: radiusKm });
      },
      () => {
        setLocationLoading(false);
        setToast("Activa la ubicación para ver primero las estaciones cercanas");
        window.setTimeout(() => setToast(""), 2600);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 120_000 },
    );
  }, [autoLocate]);

  useEffect(() => {
    let active = true;
    fetch("/api/me/ratings", { cache: "no-store" })
      .then(async (response) => response.ok
        ? await response.json() as { signedIn?: boolean; displayName?: string | null; ratings?: PersonalRatings }
        : null)
      .then((payload) => {
        if (!active || !payload) return;
        setSessionUser({ signedIn: Boolean(payload.signedIn), displayName: payload.displayName ?? null });
        setPersonalRatings(payload.ratings ?? {});
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (url.searchParams.get("auth_error") !== "google") return;
    setToast("No se pudo iniciar sesión con Google. Inténtalo de nuevo.");
    url.searchParams.delete("auth_error");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    const timer = window.setTimeout(() => setToast(""), 3600);
    return () => window.clearTimeout(timer);
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

  const openRatingFlow = (stationId: string) => {
    if (ratingStation === stationId) {
      setRatingStation(null);
      return;
    }
    const firstPending = ratingOptions.find((option) => !personalRatings[stationId]?.[option.code]);
    setRatingDimension(firstPending?.code ?? "overall");
    setRatingStation(stationId);
  };

  const advanceRatingFlow = (dimension: RatingDimension) => {
    const currentIndex = ratingOptions.findIndex((option) => option.code === dimension);
    const nextOption = ratingOptions[currentIndex + 1];
    if (nextOption) {
      setRatingDimension(nextOption.code);
      return nextOption;
    }
    setRatingStation(null);
    return null;
  };

  const rateStation = async (stationId: string, value: number) => {
    if (ratingSaving) return;
    const dimension = ratingDimension;
    const station = officialStations.find((item) => item.id === stationId);
    setRatingSaving(true);
    try {
      const response = await fetch(`/api/stations/${encodeURIComponent(stationId)}/ratings/${dimension}`, {
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
        const ratingField = `${dimension}Rating` as "overallRating" | "bathroomRating" | "coffeeRating" | "cleanlinessRating";
        const countField = `${dimension}Count` as "overallCount" | "bathroomCount" | "coffeeCount" | "cleanlinessCount";
        setOfficialState((current) => ({
          ...current,
          stations: current.stations.map((station) => station.id === stationId
            ? {
                ...station,
                [ratingField]: payload.stats?.average,
                [countField]: payload.stats?.count,
                ...(dimension === "overall" ? { overallRankScore: weightedRating(payload.stats?.average, payload.stats?.count) } : {}),
              }
            : station),
        }));
      }
      setPersonalRatings((current) => ({
        ...current,
        [stationId]: { ...current[stationId], [dimension]: value },
      }));
      setSessionUser((current) => ({ signedIn: true, displayName: current.displayName }));
      const dimensionLabel = ratingOptions.find((item) => item.code === dimension)?.label.toLowerCase() || "parada";
      const nextOption = advanceRatingFlow(dimension);
      showToast(nextOption ? `${dimensionLabel}: ${value}/5 · ahora ${nextOption.label.toLowerCase()}` : "¡Valoración completa! Gracias por ayudar");
      trackAnalyticsEvent("rate_station", { station_id: stationId, dimension, value });
    } catch {
      showToast("No se pudo guardar tu valoración");
    } finally {
      setRatingSaving(false);
    }
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
      trackAnalyticsEvent("confirm_station_service", {
        station_id: confirmationStation.id,
        category: confirmationCategory,
        status,
        proximity_verified: payload.confirmation.proximityVerified,
      });
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
    const knownPrices: Array<{ code: FuelCode; label: string; price: number | null | undefined }> = [
      { code: "gasoline_95_e5", label: "Gasolina 95", price: fuel === "gasoline_95_e5" ? station.priceMicros : station.gasoline95PriceMicros },
      { code: "diesel_a", label: "Diésel", price: fuel === "diesel_a" ? station.priceMicros : station.dieselPriceMicros },
      { code: "lpg", label: "GLP", price: fuel === "lpg" ? station.priceMicros : station.lpgPriceMicros },
      { code: "adblue", label: "AdBlue", price: fuel === "adblue" ? station.priceMicros : station.adbluePriceMicros },
    ];
    return knownPrices
      .filter((item): item is typeof item & { price: number } => typeof item.price === "number")
      .map((item) => ({
        label: item.label,
        value: formatPrice(item.price),
        detail: "precio oficial",
        className: item.code === fuel ? "primary" : "available",
      }));
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
        <h1 className="sr-only" id="map-heading">{pageHeading}</h1>
        <div className="map-canvas-shell">
          <StationMap
            stations={mapStations}
            selectedId={selectedStationId}
            userLocation={location}
            loading={officialLoading}
            fuelLabel={selectedFuel.label}
            fuelCode={fuel}
            personalRatings={personalOverallRatings}
            radiusKm={radiusKm}
            lockViewport={Boolean(mapBounds)}
            refitKey={fuel}
            onSelect={(stationId) => { setSelectedStationId(stationId); setActiveNav("map"); trackAnalyticsEvent("select_content", { content_type: "map_marker", item_id: stationId }); }}
            onOpenList={openStationInList}
            onDirections={openDirections}
            onRequestLocation={requestMyLocation}
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
                  const nextProvince = event.target.value;
                  setProvince(nextProvince);
                  setLocation(null);
                  setMapBounds(null);
                  setFavoritesOnly(false);
                  setMineOnly(false);
                  setSort("price");
                  setShowCount(20);
                  trackAnalyticsEvent("select_search_area", { scope: nextProvince ? "province" : "national", province: nextProvince || "all" });
                }}
                aria-label="Selecciona toda España o una provincia"
              >
                <option value="">Toda España</option>
                {PROVINCES.map(({ official, name }) => <option value={official} key={official}>{name}</option>)}
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
          <button className={`nearby-button ${location ? "active" : ""}`} onClick={requestMyLocation} disabled={locationLoading}>
            <LocateFixed size={18} /> {locationLoading ? "Cerca de mí · localizando…" : location ? `A menos de ${radiusKm} km` : "Cerca de mí"}
          </button>
          <div className="radius-picker" aria-label="Radio de búsqueda desde tu ubicación">
            <span>Radio desde mí</span>
            <div>{radiusOptions.map((option) => <button className={radiusKm === option ? "active" : ""} aria-pressed={radiusKm === option} key={option} onClick={() => selectRadius(option)}>{option} km</button>)}</div>
          </div>
          </div>

          <div className="fuel-picker" aria-label="Selecciona tu combustible">
            <span>Tu combustible</span>
            <div>
              {fuelOptions.map((option) => (
                <button
                  key={option.code}
                  className={fuel === option.code ? "active" : ""}
                  aria-pressed={fuel === option.code}
                  aria-label={fuel === option.code && (option.code === "lpg" || option.code === "adblue") ? `Desactivar ${option.short} y volver a Gasolina 95` : `Buscar ${option.label}`}
                  onClick={() => selectFuel(option.code)}
                >
                  {option.code === "adblue" ? <Droplets size={15} /> : <Fuel size={15} />}{option.short}
                </button>
              ))}
            </div>
          </div>

          {(fuel === "lpg" || fuel === "adblue") && !location ? (
            <button className="glp-now" onClick={requestMyLocation} disabled={locationLoading}>
              <span><b>{fuel === "lpg" ? "GLP AHORA" : "ADBLUE AHORA"}</b><strong>Encuentra puntos confirmados cerca de ti</strong><small>Usamos una ubicación aproximada y no la guardamos.</small></span>
              {fuel === "adblue" ? <Droplets size={21} /> : <LocateFixed size={21} />}
            </button>
          ) : null}

          <div className="quick-filters" aria-label="Filtros rápidos">
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
            <span className="result-kicker">{favoritesOnly ? "GUARDADAS EN ESTE DISPOSITIVO" : mineOnly ? "VALORADAS POR TI" : mapBounds ? "ÁREA VISIBLE · MITECO" : "CATÁLOGO OFICIAL · MITECO"}</span>
            <h2>{officialLoading ? "Buscando paradas…" : favoritesOnly ? `${filteredOfficialStations.length.toLocaleString("es-ES")} guardadas en estos resultados` : mineOnly ? `${filteredOfficialStations.length.toLocaleString("es-ES")} puntuadas por ti` : `${officialTotal.toLocaleString("es-ES")} con ${selectedFuel.label}`}</h2>
          </div>
          <label className="result-sort"><ListFilter size={14} /><select value={selectedStationId ? "selected" : sort} onChange={(event) => { const nextSort = event.target.value as SortMode; setSelectedStationId(null); setSort(nextSort); setShowCount(20); trackAnalyticsEvent("select_sort", { sort: nextSort }); }} aria-label="Ordenar resultados">{selectedStationId ? <option value="selected">Seleccionada + cercanas</option> : null}<option value="price">Más baratas</option><option value="rating">Mejor puntuadas</option><option value="distance" disabled={!location}>Más cercanas</option></select></label>
        </div>

        <p className="official-context"><ShieldCheck size={14} /> {favoritesOnly ? "Tus guardadas se conservan en este dispositivo y respetan los filtros actuales." : mineOnly ? "Mostramos únicamente las estaciones a las que ya has dado una nota general." : mapBounds ? "Estaciones dentro del rectángulo visible del mapa; mueve el mapa para buscar en otra zona." : location ? `Estaciones en un radio de ${radiusKm} km; la distancia es en línea recta.` : province ? `Resultados oficiales en ${provinceLabel}.` : "Búsqueda nacional en toda España."} Precio y disponibilidad procedentes de MITECO.</p>
        {sort === "rating" && !selectedStationId ? <p className="rating-method-note"><Star size={14} /> Ordenamos por nota y cantidad de votos. La media visible es la real; el orden compensa las estaciones con muy pocos votos.</p> : null}

        {officialError ? <div className="official-message error"><X size={18} /> {officialError}</div> : null}
        {!officialLoading && !officialError && visibleOfficialStations.length === 0 ? (
          <div className="official-message"><Fuel size={19} /><div><strong>{favoritesOnly ? "No tienes paradas guardadas en estos resultados" : mineOnly ? "Aún no has puntuado estaciones con estos filtros" : "Aún no aparecen estaciones con estos criterios"}</strong><span>{favoritesOnly ? "Vuelve a explorar y toca el corazón de una estación para guardarla." : mineOnly ? "Puntúa una parada y aparecerá aquí automáticamente." : "Prueba otra búsqueda, elige otro combustible o amplía el radio."}</span><button onClick={favoritesOnly || mineOnly ? showSearch : clearFilters}>{favoritesOnly || mineOnly ? "Volver a buscar" : "Limpiar filtros"}</button></div></div>
        ) : null}
        {officialLoading ? <div className="official-loading"><span /><span /><span /></div> : null}

        {recommendedStation && !officialLoading && !favoritesOnly && !mineOnly && !mapBounds ? (
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
              <button className={`overall-score ${personalRatings[station.id]?.overall ? "user-rated" : ""}`} onClick={() => openRatingFlow(station.id)}>
                <span className="overall-public-rating">{station.overallCount ? <><b>{Number(station.overallRating).toFixed(1)}</b><span><RatingStars value={Number(station.overallRating)} /><small>Media de la comunidad</small></span></> : <><Star size={15} fill="currentColor" /><span>Sin puntuación</span></>}</span>
                <span className="overall-rating-detail"><small>{station.overallCount ? `${station.overallCount} ${station.overallCount === 1 ? "voto" : "votos"}` : "Sé la primera persona"}</small><em>{ratingConfidence(station.overallCount)}</em></span>
                {personalRatings[station.id]?.overall ? <strong>Tu nota {personalRatings[station.id]?.overall}/5</strong> : <strong>Puntuar</strong>}
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
                <button onClick={() => openRatingFlow(station.id)}><Star size={16} /> Puntuar</button>
              </div>
              {ratingStation === station.id ? (
                <div className="rating-picker" aria-busy={ratingSaving}>
                  <div className="rating-flow-head"><strong>Puntúa esta parada</strong><small>Paso {ratingOptions.findIndex((option) => option.code === ratingDimension) + 1} de {ratingOptions.length}</small></div>
                  <div className="rating-dimensions">{ratingOptions.map((option) => <button className={`${ratingDimension === option.code ? "active" : ""}${personalRatings[station.id]?.[option.code] ? " completed" : ""}`} key={option.code} onClick={() => setRatingDimension(option.code)} disabled={ratingSaving}>{option.code === "bathroom" ? <Bath size={13} /> : option.code === "coffee" ? <Coffee size={13} /> : option.code === "cleanliness" ? <Sparkles size={13} /> : <Star size={13} />}{option.label}{personalRatings[station.id]?.[option.code] ? <b>{personalRatings[station.id]?.[option.code]}/5</b> : null}</button>)}</div>
                  <span>¿Qué nota le das a {ratingOptions.find((item) => item.code === ratingDimension)?.label.toLowerCase()}?</span>
                  <div className="rating-stars">{[1, 2, 3, 4, 5].map((value) => {
                    const selected = value <= (personalRatings[station.id]?.[ratingDimension] || 0);
                    return <button className={selected ? "active" : ""} key={value} aria-label={`${value} estrellas para ${ratingDimension}`} onClick={() => rateStation(station.id, value)} disabled={ratingSaving}><Star size={24} fill={selected ? "currentColor" : "none"} /></button>;
                  })}</div>
                  <div className="rating-flow-foot"><small>{ratingSaving ? "Guardando…" : "Al tocar una estrella pasas al siguiente paso"}</small><button onClick={() => advanceRatingFlow(ratingDimension)} disabled={ratingSaving}>{ratingDimension === ratingOptions.at(-1)?.code ? "Terminar" : "Omitir"}</button></div>
                </div>
              ) : null}
            </article>
          ))}
        </div>

        {!officialLoading && showCount < filteredOfficialStations.length ? (
          <button className="load-more" onClick={() => setShowCount((current) => current + 20)}>Ver 20 estaciones más</button>
        ) : null}
        {!officialLoading && !favoritesOnly && !mineOnly && officialTotal > officialStations.length ? <p className="result-limit">Mostramos las 100 mejores coincidencias. Usa provincia, búsqueda o cercanía para afinar.</p> : null}

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

      <footer className="app-footer">
        <div><strong>Gasoliguapis</strong><span>Mapa y precios oficiales para decidir dónde parar.</span></div>
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        <nav aria-label="Información legal">
          {legalNavigation.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
        </nav>
      </footer>

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
              <a href={`https://www.google.com/maps/dir/?api=1&destination=${directionsStation.latE6 / 1_000_000},${directionsStation.lngE6 / 1_000_000}&travelmode=driving`} target="_blank" rel="noreferrer" onClick={() => { trackAnalyticsEvent("get_directions", { provider: "google_maps", station_id: directionsStation.id }); setDirectionsStation(null); }}><span className="maps-logo google">G</span><div><strong>Google Maps</strong><small>Abrir ruta en coche</small></div><Navigation size={18} /></a>
              <a href={`https://maps.apple.com/?daddr=${directionsStation.latE6 / 1_000_000},${directionsStation.lngE6 / 1_000_000}&dirflg=d`} target="_blank" rel="noreferrer" onClick={() => { trackAnalyticsEvent("get_directions", { provider: "apple_maps", station_id: directionsStation.id }); setDirectionsStation(null); }}><span className="maps-logo apple">A</span><div><strong>Apple Maps</strong><small>Abrir ruta en coche</small></div><Navigation size={18} /></a>
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
              {!location ? <button onClick={requestMyLocation} disabled={locationLoading}>{locationLoading ? "…" : "Comprobar"}</button> : null}
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
              {[
                { code: "bathroom" as const, label: "Baños confirmados" },
                { code: "coffee" as const, label: "Cafetería confirmada" },
                { code: "restaurant" as const, label: "Restaurante confirmado" },
                { code: "rated" as const, label: "Con puntuaciones" },
              ].map((item) => <button className={serviceFilters.includes(item.code) ? "selected" : ""} aria-pressed={serviceFilters.includes(item.code)} key={item.code} onClick={() => toggleServiceFilter(item.code)}><span>{item.label}</span><Check size={16} /></button>)}
              <button className={mineOnly ? "selected" : ""} aria-pressed={mineOnly} onClick={toggleMineOnly}><span>Valoradas por mí</span><Check size={16} /></button>
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
                <p>Tu sesión está lista. Ya puedes puntuar estaciones oficiales; cada categoría admite un voto por usuario y no hay comentarios públicos.</p>
                <button className="primary-action" onClick={() => setLoginOpen(false)}>Seguir explorando</button>
                <button className="sign-out" onClick={() => {
                  const returnTo = `${window.location.pathname}${window.location.search}`;
                  window.location.assign(`/api/auth/logout?return_to=${encodeURIComponent(returnTo)}`);
                }}>Cerrar sesión</button>
                <small><ShieldCheck size={14} /> Tu correo nunca aparece públicamente.</small>
              </>
            ) : (
              <>
                <h2>Haz mejores las paradas</h2>
                <p>Inicia sesión para puntuar la parada, los baños, el café o la limpieza. Sin comentarios públicos.</p>
                <a className="social google" href={signInPath} onClick={() => trackAnalyticsEvent("login_start", { method: "Google" })}><b aria-hidden="true">G</b> Continuar con Google</a>
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
