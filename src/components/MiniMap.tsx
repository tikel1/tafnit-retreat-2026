import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { Venue, VenueKind } from "../data/types";
import NavigateLinks from "./NavigateLinks";

const COLOR_BY_KIND: Record<VenueKind, string> = {
  meeting: "#2E5599",
  marina:  "#4FA37D",
  hotel:   "#0F2A55",
  spa:     "#6BB89A"
};

function shade(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.max(0, Math.min(255, (num >> 16) + amt));
  const G = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amt));
  const B = Math.max(0, Math.min(255, (num & 0xff) + amt));
  return "#" + (0x1000000 + (R << 16) + (G << 8) + B).toString(16).slice(1);
}

function makePin(color: string, n: number, isHero = false): L.DivIcon {
  const size = isHero ? 38 : 32;
  return L.divIcon({
    html: `
      <div style="position:relative;width:${size}px;height:${size}px;">
        <div style="
          position:absolute;inset:0;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          background:linear-gradient(135deg, ${color} 0%, ${shade(color, -15)} 100%);
          border:2px solid #FBF8EF;
          box-shadow:0 6px 14px rgba(15,42,85,0.4);
          display:flex;align-items:center;justify-content:center;
        ">
          <div style="transform:rotate(45deg);color:#FBF8EF;font-weight:700;font-size:${
            isHero ? 14 : 12
          }px;line-height:1;">${n}</div>
        </div>
      </div>
    `,
    className: "tafnit-marker",
    iconSize: [size, size],
    iconAnchor: [size / 2, size - 2],
    popupAnchor: [0, -size + 4]
  });
}

function FitBounds({ venues }: { venues: Venue[] }) {
  const map = useMap();
  useEffect(() => {
    if (venues.length === 0) return;
    if (venues.length === 1) {
      map.setView(venues[0].coords, 13);
      return;
    }
    const bounds = L.latLngBounds(venues.map((v) => v.coords));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [venues, map]);
  return null;
}

export default function MiniMap({ venues }: { venues: Venue[] }) {
  if (venues.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-cream-200 shadow-[0_18px_40px_-22px_rgba(15,42,85,0.22)]">
      <MapContainer
        center={venues[0].coords}
        zoom={11}
        scrollWheelZoom={false}
        className="h-72 sm:h-96 w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />
        <FitBounds venues={venues} />

        {venues.map((v, i) => {
          const color = COLOR_BY_KIND[v.kind] ?? "#4FA37D";
          return (
            <Marker key={v.id} position={v.coords} icon={makePin(color, i + 1, v.kind === "hotel")}>
              <Popup>
                <div className="font-sans">
                  <div className="font-display font-bold text-sm text-tafnit-navy-900 leading-tight">
                    <span className="text-tafnit-mint-700 font-semibold me-1">
                      {i + 1}.
                    </span>
                    {v.name}
                  </div>
                  {v.description && (
                    <p className="text-xs text-ink-700/85 mt-1 leading-snug">
                      {v.description}
                    </p>
                  )}
                  <div className="mt-1.5">
                    <NavigateLinks name={v.name} coords={v.coords} address={v.address} />
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
