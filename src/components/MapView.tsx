import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { ExternalLink } from "lucide-react";
import type { Venue, VenueKind } from "../data/types";
import { venues as venuesData } from "../data/venues";
import { useT } from "../lib/dict";
import Section from "./Section";
import NavigateLinks from "./NavigateLinks";

// Reset Leaflet's default-icon URL resolution so it doesn't try to fetch
// the marker PNGs from the wrong path under our `/tafnit-retreat-2026/`
// base URL. We render custom DivIcons anyway.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl: unknown })._getIconUrl;

const COLOR_BY_KIND: Record<VenueKind, string> = {
  meeting: "#2E5599",
  coffee:  "#C98B2E",
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

export interface MapViewHandle {
  focusOn: (id: string) => void;
}

interface Props {
  venues?: Venue[];
}

const MapViewInner = forwardRef<MapViewHandle, Props>(function MapViewInner(
  { venues = venuesData },
  ref
) {
  const t = useT();
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  useImperativeHandle(
    ref,
    () => ({
      focusOn: (id: string) => {
        const m = mapRef.current;
        const marker = markersRef.current[id];
        const venue = venues.find((v) => v.id === id);
        if (!m || !venue) return;
        m.flyTo(venue.coords, 14, { duration: 0.8 });
        if (marker) marker.openPopup();
      }
    }),
    [venues]
  );

  // Center on the geometric midpoint of the 3 venues — falls naturally
  // between Tel Aviv and Herzliya.
  const center = useMemo<[number, number]>(() => {
    if (venues.length === 0) return [32.1, 34.8];
    const lat = venues.reduce((s, v) => s + v.coords[0], 0) / venues.length;
    const lon = venues.reduce((s, v) => s + v.coords[1], 0) / venues.length;
    return [lat, lon];
  }, [venues]);

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-cream-200 shadow-[0_18px_40px_-22px_rgba(15,42,85,0.22)]">
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom={false}
        className="h-[420px] sm:h-[520px] w-full"
        ref={(instance) => {
          mapRef.current = instance ?? null;
        }}
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
            <Marker
              key={v.id}
              position={v.coords}
              icon={makePin(color, i + 1, v.kind === "hotel")}
              ref={(instance) => {
                if (instance) markersRef.current[v.id] = instance;
              }}
            >
              <Popup>
                <div className="font-sans w-[240px]">
                  {v.image && (
                    <div className="-mx-2.5 -mt-2.5 mb-2 aspect-[16/9] overflow-hidden rounded-t-md bg-cream-100">
                      <img
                        src={v.image}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  )}
                  <div className="font-display font-bold text-sm text-tafnit-navy-900 leading-tight">
                    <span className="text-tafnit-mint-700 font-semibold me-1">
                      {i + 1}.
                    </span>
                    {v.name}
                  </div>
                  {v.address && (
                    <p className="text-xs text-ink-700/85 mt-1 leading-snug">
                      {v.address}
                    </p>
                  )}
                  {v.description && (
                    <p className="text-xs text-ink-700/75 mt-1 leading-snug">
                      {v.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3">
                    <NavigateLinks name={v.name} coords={v.coords} address={v.address} />
                    {v.website && (
                      <a
                        href={v.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-ink-700 hover:text-tafnit-navy-700 transition-colors"
                      >
                        {t("website")}
                      </a>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
});

interface OuterProps {
  venuesRef?: React.MutableRefObject<MapViewHandle | null>;
}

/* Gallery row beneath the map — one photo card per venue, with name,
 * address, navigation links and a link to focus the marker on the map.
 * This is where the freshly-fetched Wikimedia photos really earn their
 * keep on the home page. */
function VenueGallery({
  venues,
  onFocus,
}: {
  venues: Venue[];
  onFocus: (id: string) => void;
}) {
  const t = useT();
  const kindLabelKey: Record<VenueKind, string> = {
    meeting: "cat_meeting",
    coffee: "cat_coffee",
    marina: "cat_marina",
    hotel: "cat_hotel",
    spa: "cat_spa",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {venues.map((v, i) => {
        const color = COLOR_BY_KIND[v.kind];
        return (
          <article
            key={v.id}
            className="card-tafnit overflow-hidden flex flex-col"
          >
            <button
              type="button"
              onClick={() => onFocus(v.id)}
              className="relative aspect-[16/10] overflow-hidden bg-cream-100 group"
              aria-label={t("show_on_map")}
            >
              {v.image ? (
                <img
                  src={v.image}
                  alt=""
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="absolute inset-0 grid place-items-center text-tafnit-mint-700 font-display font-bold text-xl">
                  {v.name}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-tafnit-navy-900/70 to-transparent pointer-events-none" />
              <span
                className="absolute top-3 start-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-[0.18em] font-semibold text-cream-50"
                style={{ background: color }}
              >
                <span className="w-4 h-4 inline-grid place-items-center rounded-full bg-cream-50/30 text-[9px] font-bold">
                  {i + 1}
                </span>
                {t(kindLabelKey[v.kind] as Parameters<typeof t>[0])}
              </span>
            </button>
            <div className="p-4 sm:p-5 flex flex-col flex-1">
              <h3 className="font-display font-bold text-lg text-tafnit-navy-900 leading-tight">
                {v.name}
              </h3>
              {v.address && (
                <p className="text-sm text-ink-700/80 mt-1 leading-snug">{v.address}</p>
              )}
              {v.description && (
                <p className="text-sm text-ink-700/85 mt-2 leading-relaxed flex-1">
                  {v.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <NavigateLinks name={v.name} coords={v.coords} address={v.address} />
                {v.website && (
                  <a
                    href={v.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-tafnit-navy-700 hover:text-tafnit-navy-900 transition-colors"
                  >
                    <ExternalLink size={12} />
                    {t("website")}
                  </a>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default function MapView({ venuesRef }: OuterProps = {}) {
  const t = useT();
  const innerRef = useRef<MapViewHandle>(null);
  useImperativeHandle(venuesRef ?? { current: null }, () => ({
    focusOn: (id: string) => innerRef.current?.focusOn(id)
  }));

  const focusOn = (id: string) => {
    innerRef.current?.focusOn(id);
    const mapEl = document.getElementById("map");
    if (mapEl) mapEl.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <Section id="map" eyebrow={t("map_eyebrow")} title={t("map_title")} kicker={t("map_kicker")} intro={t("map_intro")}>
      <MapViewInner ref={innerRef} />

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink-700/70">
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ background: COLOR_BY_KIND.meeting }} />
          {t("cat_meeting")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ background: COLOR_BY_KIND.coffee }} />
          {t("cat_coffee")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ background: COLOR_BY_KIND.marina }} />
          {t("cat_marina")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full" style={{ background: COLOR_BY_KIND.hotel }} />
          {t("cat_hotel")}
        </span>
      </div>

      <div className="mt-8 sm:mt-10">
        <VenueGallery venues={venuesData} onFocus={focusOn} />
      </div>
    </Section>
  );
}
