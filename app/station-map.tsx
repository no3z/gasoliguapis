"use client";

import { Box, Layers3, LocateFixed, MapPin, Navigation, Star } from "lucide-react";
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

type Props = {
  stations: MapStation[];
  selectedId: string | null;
  userLocation: { latitude: number; longitude: number } | null;
  loading: boolean;
  fuelLabel: string;
  onSelect: (stationId: string) => void;
  onOpenList: (stationId: string) => void;
  onDirections: (stationId: string) => void;
};

const SPAIN_BOUNDS: [[number, number], [number, number]] = [[-9.7, 35.7], [4.5, 43.9]];

function formatPrice(micros: number) {
  return `${(micros / 1_000_000).toLocaleString("es-ES", { minimumFractionDigits: 3, maximumFractionDigits: 3 })} €`;
}

export default function StationMap({ stations, selectedId, userLocation, loading, fuelLabel, onSelect, onOpenList, onDirections }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const userMarkerRef = useRef<MapLibreMarker | null>(null);
  const onSelectRef = useRef(onSelect);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState(false);
  const [perspective, setPerspective] = useState(true);

  useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);
  const selectedStation = useMemo(
    () => stations.find((station) => station.id === selectedId) ?? null,
    [selectedId, stations],
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let cancelled = false;
    import("maplibre-gl").then((maplibre) => {
      if (cancelled || !containerRef.current) return;
      const map = new maplibre.Map({
        container: containerRef.current,
        style: "https://tiles.openfreemap.org/styles/liberty",
        center: [-3.7, 40.2],
        zoom: 4.6,
        pitch: 38,
        bearing: -8,
        minZoom: 3,
        maxZoom: 17,
      });
      map.addControl(new maplibre.NavigationControl({ showCompass: true, visualizePitch: true }), "top-right");
      map.on("load", () => { setMapError(false); setReady(true); });
      map.on("error", () => { if (!map.isStyleLoaded()) setMapError(true); });
      mapRef.current = map;
    }).catch(() => setMapError(true));
    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.remove());
      userMarkerRef.current?.remove();
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    let active = true;
    import("maplibre-gl").then((maplibre) => {
      if (!active || mapRef.current !== map) return;
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = stations.map((station) => {
        const markerButton = document.createElement("button");
        markerButton.type = "button";
        markerButton.className = `map-station-marker${station.id === selectedId ? " selected" : ""}`;
        markerButton.title = `${station.name}: ${formatPrice(station.priceMicros)}`;
        markerButton.setAttribute("aria-label", markerButton.title);
        const priceLabel = document.createElement("span");
        priceLabel.textContent = formatPrice(station.priceMicros).replace(" €", "");
        markerButton.appendChild(priceLabel);
        markerButton.addEventListener("click", () => onSelectRef.current(station.id));
        return new maplibre.Marker({ element: markerButton, anchor: "bottom" })
          .setLngLat([station.lngE6 / 1_000_000, station.latE6 / 1_000_000])
          .addTo(map);
      });
    });
    return () => { active = false; };
  }, [ready, selectedId, stations]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    if (stations.length === 0) {
      map.fitBounds(SPAIN_BOUNDS, { padding: 22, duration: 500 });
      return;
    }
    const longitudes = stations.map((station) => station.lngE6 / 1_000_000);
    const latitudes = stations.map((station) => station.latE6 / 1_000_000);
    map.fitBounds([
      [Math.min(...longitudes), Math.min(...latitudes)],
      [Math.max(...longitudes), Math.max(...latitudes)],
    ], { padding: 52, maxZoom: 12, duration: 650 });
  }, [ready, stations]);

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
    if (userLocation) map.flyTo({ center: [userLocation.longitude, userLocation.latitude], zoom: 10, duration: 600 });
    else map.fitBounds(SPAIN_BOUNDS, { padding: 22, duration: 600 });
  };

  const togglePerspective = () => {
    const nextPerspective = !perspective;
    setPerspective(nextPerspective);
    mapRef.current?.easeTo({ pitch: nextPerspective ? 42 : 0, bearing: nextPerspective ? -8 : 0, duration: 550 });
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
      {mapError ? <div className="map-loading error"><MapPin size={24} /><strong>No se pudo cargar el mapa</strong><span>La lista sigue disponible más abajo.</span></div> : null}
      <div className={`map-result-count ${selectedStation ? "with-selection" : ""}`}><MapPin size={14} /><strong>{stations.length}</strong> en el mapa{loading ? " · actualizando…" : ""}</div>
      <button className="map-recenter" onClick={recenter} aria-label={userLocation ? "Centrar mapa en mi ubicación" : "Mostrar toda España"}><LocateFixed size={19} /></button>
      <button className={`map-perspective ${perspective ? "active" : ""}`} onClick={togglePerspective} aria-pressed={perspective}>{perspective ? <Layers3 size={17} /> : <Box size={17} />}{perspective ? "3D" : "2D"}</button>
      {selectedStation ? (
        <div className="map-selection">
          <button className="map-selection-main" onClick={() => onOpenList(selectedStation.id)}>
            <span>{selectedStation.municipality || "Estación seleccionada"}</span>
            <strong>{selectedStation.name}</strong>
            <small>{fuelLabel} · {formatPrice(selectedStation.priceMicros)}{selectedStation.overallCount ? ` · ★ ${Number(selectedStation.overallRating).toFixed(1)}` : " · sin nota todavía"}</small>
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
