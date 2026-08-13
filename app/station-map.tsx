"use client";

import { Layers3, LocateFixed, Map, MapPin, Navigation, Search, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Map as MapLibreMap, Marker as MapLibreMarker } from "maplibre-gl";

export type MapStation = {
  id: string;
  name: string;
  municipality: string | null;
  latE6: number;
  lngE6: number;
  priceMicros: number;
  lpgPriceMicros?: number | null;
  adbluePriceMicros?: number | null;
  overallRating?: number | null;
  overallCount?: number;
  bathroomRating?: number | null;
  bathroomCount?: number;
  coffeeRating?: number | null;
  coffeeCount?: number;
  cleanlinessRating?: number | null;
  cleanlinessCount?: number;
  bathroomStatus?: string | null;
  coffeeStatus?: string | null;
  restaurantStatus?: string | null;
  cleanlinessStatus?: string | null;
};

export type VisibleMapBounds = {
  west: number;
  south: number;
  east: number;
  north: number;
};

type Props = {
  stations: MapStation[];
  selectedId: string | null;
  userLocation: { latitude: number; longitude: number } | null;
  loading: boolean;
  fuelLabel: string;
  personalRatings: Record<string, number>;
  radiusKm: number;
  lockViewport: boolean;
  refitKey: string;
  onSelect: (stationId: string) => void;
  onOpenList: (stationId: string) => void;
  onDirections: (stationId: string) => void;
  onRequestLocation: () => void;
  onSearchVisibleArea: (bounds: VisibleMapBounds) => void;
};

const SPAIN_BOUNDS: [[number, number], [number, number]] = [[-18.5, 27.4], [4.5, 43.9]];

function formatPrice(micros: number) {
  return `${(micros / 1_000_000).toLocaleString("es-ES", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} €`;
}

function fitVisibleStations(
  map: MapLibreMap,
  stations: MapStation[],
  userLocation: { latitude: number; longitude: number } | null,
  perspective: boolean,
  duration: number,
) {
  const points = stations.map((station) => [station.lngE6 / 1_000_000, station.latE6 / 1_000_000] as const);
  if (userLocation) points.push([userLocation.longitude, userLocation.latitude]);
  if (points.length === 0) {
    map.fitBounds(SPAIN_BOUNDS, { padding: 22, duration });
    return;
  }
  if (points.length === 1) {
    map.easeTo({ center: points[0], zoom: 12, pitch: perspective ? 38 : 0, bearing: perspective ? -8 : 0, duration });
    return;
  }
  const longitudes = points.map(([longitude]) => longitude);
  const latitudes = points.map(([, latitude]) => latitude);
  map.fitBounds([
    [Math.min(...longitudes), Math.min(...latitudes)],
    [Math.max(...longitudes), Math.max(...latitudes)],
  ], {
    padding: 54,
    maxZoom: 13,
    pitch: perspective ? 38 : 0,
    bearing: perspective ? -8 : 0,
    duration,
  });
}

export default function StationMap({ stations, selectedId, userLocation, loading, fuelLabel, personalRatings, radiusKm, lockViewport, refitKey, onSelect, onOpenList, onDirections, onRequestLocation, onSearchVisibleArea }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const userMarkerRef = useRef<MapLibreMarker | null>(null);
  const onSelectRef = useRef(onSelect);
  const lastFittedKeyRef = useRef<string | null>(null);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [perspective, setPerspective] = useState(false);
  const [mapAttempt, setMapAttempt] = useState(0);
  const [showAreaSearch, setShowAreaSearch] = useState(false);

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  const mappableStations = useMemo(
    () => stations.filter((station) => {
      const latitude = station.latE6 / 1_000_000;
      const longitude = station.lngE6 / 1_000_000;
      return latitude >= 27 && latitude <= 44.5 && longitude >= -19 && longitude <= 5;
    }),
    [stations],
  );
  const selectedStation = useMemo(
    () => mappableStations.find((station) => station.id === selectedId) ?? null,
    [mappableStations, selectedId],
  );
  const visiblePersonalRatingCount = useMemo(
    () => mappableStations.filter((station) => Boolean(personalRatings[station.id])).length,
    [mappableStations, personalRatings],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    let loadTimer: ReturnType<typeof setTimeout> | null = null;
    import("maplibre-gl").then((maplibre) => {
      if (cancelled || !containerRef.current) return;
      const map = new maplibre.Map({
        container: containerRef.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [-3.7, 40.2],
        zoom: 4.6,
        pitch: 0,
        bearing: 0,
        minZoom: 3,
        maxZoom: 17,
        cooperativeGestures: true,
      });
      mapRef.current = map;
      loadTimer = setTimeout(() => {
        if (!cancelled && !map.loaded()) setMapError(true);
      }, 15_000);
      map.on("load", () => {
        if (loadTimer) clearTimeout(loadTimer);
        setMapError(false);
        setReady(true);
      });
      map.on("moveend", (event) => {
        if (event.originalEvent) setShowAreaSearch(true);
      });
    }).catch(() => setMapError(true));
    return () => {
      cancelled = true;
      if (loadTimer) clearTimeout(loadTimer);
      markersRef.current.forEach((marker) => marker.remove());
      userMarkerRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [mapAttempt]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let active = true;
    import("maplibre-gl").then((maplibre) => {
      if (!active || mapRef.current !== map) return;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = mappableStations.map((station) => {
        const personalRating = personalRatings[station.id];
        const ratingTone = personalRating <= 2 ? "low" : personalRating === 3 ? "mid" : "high";
        const markerButton = document.createElement("button");
        markerButton.type = "button";
        markerButton.className = `map-station-marker${station.id === selectedId ? " selected" : ""}${personalRating ? ` user-rated rating-${ratingTone}` : ""}`;
        markerButton.title = `${station.name}: ${formatPrice(station.priceMicros)}${personalRating ? ` · Tu nota ${personalRating}/5` : ""}`;
        markerButton.setAttribute("aria-label", markerButton.title);
        const priceLabel = document.createElement("span");
        priceLabel.textContent = formatPrice(station.priceMicros).replace(" €", "");
        markerButton.appendChild(priceLabel);
        if (personalRating) {
          const personalBadge = document.createElement("b");
          personalBadge.className = "map-marker-user-rating";
          personalBadge.textContent = `★ ${personalRating}`;
          markerButton.appendChild(personalBadge);
        }
        markerButton.addEventListener("click", () => onSelectRef.current(station.id));
        return new maplibre.Marker({ element: markerButton, anchor: "bottom", offset: [0, -7] })
          .setLngLat([station.lngE6 / 1_000_000, station.latE6 / 1_000_000])
          .addTo(map);
      });
    });
    return () => { active = false; };
  }, [mappableStations, personalRatings, ready, selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || loading) return;
    const filterChanged = lastFittedKeyRef.current !== refitKey;
    if (lockViewport && !filterChanged) return;
    lastFittedKeyRef.current = refitKey;
    fitVisibleStations(map, mappableStations, userLocation, perspective, 650);
  }, [loading, lockViewport, mappableStations, perspective, ready, refitKey, userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !selectedStation) return;
    map.flyTo({
      center: [selectedStation.lngE6 / 1_000_000, selectedStation.latE6 / 1_000_000],
      zoom: Math.max(map.getZoom(), perspective ? 14.5 : 12),
      pitch: perspective ? 48 : 0,
      duration: 700,
    });
  }, [perspective, ready, selectedStation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let active = true;
    import("maplibre-gl").then((maplibre) => {
      if (!active || mapRef.current !== map) return;
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      if (!userLocation) return;
      const marker = document.createElement("span");
      marker.className = "map-user-marker";
      marker.title = "Tu ubicación aproximada";
      userMarkerRef.current = new maplibre.Marker({ element: marker })
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map);
    });
    return () => { active = false; };
  }, [ready, userLocation]);

  const recenter = () => {
    const map = mapRef.current;
    if (!map) return;
    fitVisibleStations(map, mappableStations, userLocation, perspective, 600);
  };

  const setPerspectiveMode = (enabled: boolean) => {
    setPerspective(enabled);
    mapRef.current?.easeTo({ pitch: enabled ? 42 : 0, bearing: enabled ? -8 : 0, duration: 550 });
  };

  const retryMap = () => {
    setReady(false);
    setMapError(false);
    setMapAttempt((attempt) => attempt + 1);
  };

  const searchVisibleArea = () => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = map.getBounds();
    onSearchVisibleArea({
      west: bounds.getWest(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      north: bounds.getNorth(),
    });
    setShowAreaSearch(false);
  };

  const serviceValue = (status?: string | null, rating?: number | null, count?: number) => {
    if (status === "clean" || status === "good" || status === "working") return "Confirmado";
    if (status === "dirty" || status === "poor" || status === "broken" || status === "no_product") return "Aviso";
    if (status === "closed") return "Cerrado";
    return count ? `★ ${Number(rating).toFixed(1)}` : "Sin dato";
  };

  return (
    <section className="map-explorer" id="mapa" aria-label="Mapa de gasolineras filtradas">
      <div ref={containerRef} className="stations-map" />
      {!ready && !mapError ? <div className="map-loading"><span /><strong>Cargando mapa…</strong></div> : null}
      {mapError ? <div className="map-loading error"><MapPin size={24} /><strong>No se pudo cargar el mapa</strong><span>La lista sigue disponible más abajo.</span><button onClick={retryMap}>Reintentar</button></div> : null}
      {ready && showAreaSearch ? <button className="map-search-area" onClick={searchVisibleArea}><Search size={17} /> Buscar en esta zona</button> : null}
      <div className={`map-toolbar ${selectedStation ? "with-selection" : ""}`}>
        <div className="map-toolbar-count"><MapPin size={14} /><strong>{mappableStations.length}</strong><span>{userLocation ? `más cercanas · radio ${radiusKm} km` : "en el mapa"}{visiblePersonalRatingCount ? ` · ★ ${visiblePersonalRatingCount} tuyas` : ""}{loading ? " · actualizando…" : ""}</span></div>
        <button className="map-location-action" onClick={userLocation ? () => { recenter(); onRequestLocation(); } : onRequestLocation}>
          <LocateFixed size={16} /><span>{userLocation ? "Mi posición" : "Usar ubicación"}</span>
        </button>
        <div className="map-mode-switch" aria-label="Perspectiva del mapa">
          <button className={!perspective ? "active" : ""} onClick={() => setPerspectiveMode(false)} aria-pressed={!perspective}><Map size={14} />2D</button>
          <button className={perspective ? "active" : ""} onClick={() => setPerspectiveMode(true)} aria-pressed={perspective}><Layers3 size={14} />3D</button>
        </div>
      </div>
      {selectedStation ? (
        <div className="map-selection">
          <button className="map-selection-main" onClick={() => onOpenList(selectedStation.id)}>
            <span>{selectedStation.municipality || "Estación seleccionada"}</span>
            <strong>{selectedStation.name}</strong>
            <small>{fuelLabel} · {formatPrice(selectedStation.priceMicros)}{personalRatings[selectedStation.id] ? ` · Tu ★ ${personalRatings[selectedStation.id]}` : selectedStation.overallCount ? ` · Media ★ ${Number(selectedStation.overallRating).toFixed(1)}` : " · sin nota todavía"}</small>
          </button>
          <div className="map-selection-actions">
            <button onClick={() => onDirections(selectedStation.id)}><Navigation size={15} /> Ruta</button>
            <button onClick={() => onOpenList(selectedStation.id)}><Star size={15} /> Ficha</button>
          </div>
          <div className="map-selection-qualities">
            <span><b>GLP</b>{selectedStation.lpgPriceMicros ? formatPrice(selectedStation.lpgPriceMicros) : "Sin dato"}</span>
            <span><b>AdBlue</b>{selectedStation.adbluePriceMicros ? formatPrice(selectedStation.adbluePriceMicros) : "Sin dato"}</span>
            <span><b>Baños</b>{serviceValue(selectedStation.bathroomStatus, selectedStation.bathroomRating, selectedStation.bathroomCount)}</span>
            <span><b>Café</b>{serviceValue(selectedStation.coffeeStatus, selectedStation.coffeeRating, selectedStation.coffeeCount)}</span>
            <span><b>Restaurante</b>{serviceValue(selectedStation.restaurantStatus)}</span>
            <span><b>Limpieza</b>{serviceValue(selectedStation.cleanlinessStatus, selectedStation.cleanlinessRating, selectedStation.cleanlinessCount)}</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
