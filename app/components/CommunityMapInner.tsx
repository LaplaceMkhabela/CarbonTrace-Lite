"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import { CLAIM_TYPE_LABELS, type ApiClaim } from "@/lib/api";

/*
 * Real interactive community map (Leaflet + CARTO dark basemap, OpenStreetMap
 * data — no API keys). Markers are coloured by verification status and sized
 * by claimed quantity. Scroll-wheel zoom is off so the dashboard page scrolls
 * naturally; zoom with the +/- controls or double-click.
 */

const STATUS_COLOR: Record<string, string> = {
  verified: "#34d399",
  partial: "#fbbf24",
  flagged: "#f87171",
};

const STATUS_LABEL: Record<string, string> = {
  verified: "Verified",
  partial: "Partial",
  flagged: "Flagged",
};

const DEFAULT_CENTER: [number, number] = [15, 10];
const DEFAULT_ZOOM = 2;

// CARTO raster basemaps require an API key (?key=…). It lives in
// NEXT_PUBLIC_CARTO_KEY so the client bundle can build tile URLs; without it
// tiles still render but carry an "API key required" watermark.
const CARTO_KEY = process.env.NEXT_PUBLIC_CARTO_KEY;
const TILE_URL = `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png${CARTO_KEY ? `?key=${CARTO_KEY}` : ""}`;

function markerRadius(quantity: number): number {
  if (!Number.isFinite(quantity) || quantity <= 0) return 6;
  return 5 + Math.min(13, Math.log10(quantity + 1) * 6);
}

function displayAgent(ref?: string): string {
  return ref?.replace(/^user:/, "") ?? "community";
}

/** Orange pin marker reserved for flagged claims awaiting community review. */
const flaggedIcon = L.icon({
  iconUrl: "/flagged-pin.svg",
  iconSize: [30, 42],
  iconAnchor: [15, 40],
  popupAnchor: [0, -36],
});

/** Green check-pin marker for verified claims. */
const verifiedIcon = L.icon({
  iconUrl: "/verified-pin.svg",
  iconSize: [30, 30],
  iconAnchor: [15, 28],
  popupAnchor: [0, -26],
});

/** Keeps every marker in view as the claim set changes. */
function FitBounds({ points }: { points: Array<[number, number]> }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) {
      map.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
    } else if (points.length === 1) {
      map.setView(points[0], 10);
    } else {
      map.fitBounds(points as LatLngBoundsExpression, { padding: [32, 32] });
    }
  }, [map, points]);
  return null;
}

export default function CommunityMapInner({ claims }: { claims: ApiClaim[] }) {
  const valid = useMemo(
    () => claims.filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lon)),
    [claims],
  );
  const points = useMemo(
    () => valid.map((c) => [c.lat, c.lon] as [number, number]),
    [valid],
  );

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom={false}
      className="leaflet-map"
    >
      <TileLayer
        url={TILE_URL}
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <FitBounds points={points} />
      {valid.map((c) => {
        const color = STATUS_COLOR[c.status] ?? "#94a3b8";
        const popup = (
          <Popup>
            <div style={{ minWidth: 180 }}>
              <strong>
                {CLAIM_TYPE_LABELS[c.claimType] ?? c.claimType} · {STATUS_LABEL[c.status] ?? c.status}
              </strong>
              <div>
                {c.quantity} {c.unit} · {Math.round(c.confidence * 100)}% confidence
              </div>
              <div className="muted">by {displayAgent(c.agentRef)}</div>
              <a href={`/claims/${c.claimId}`}>Open certificate →</a>
            </div>
          </Popup>
        );
        if (c.status === "flagged") {
          return (
            <Marker key={c.claimId} position={[c.lat, c.lon]} icon={flaggedIcon}>
              {popup}
            </Marker>
          );
        }
        if (c.status === "verified") {
          return (
            <Marker key={c.claimId} position={[c.lat, c.lon]} icon={verifiedIcon}>
              {popup}
            </Marker>
          );
        }
        return (
          <CircleMarker
            key={c.claimId}
            center={[c.lat, c.lon]}
            radius={markerRadius(c.quantity)}
            pathOptions={{
              color,
              weight: 2,
              opacity: 0.9,
              fillColor: color,
              fillOpacity: 0.45,
            }}
          >
            {popup}
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
