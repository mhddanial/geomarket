"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Place } from "@/lib/api";

/* ── Fix Leaflet default marker icons in bundlers ─────────────────── */
const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

const selectedIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [30, 49],
    iconAnchor: [15, 49],
    popupAnchor: [1, -40],
    shadowSize: [49, 49],
    className: "selected-marker",
});

/* ── Fly-to helper component ──────────────────────────────────────── */
function FlyTo({ place }: { place: Place | null }) {
    const map = useMap();
    useEffect(() => {
        if (place?.latitude != null && place?.longitude != null) {
            map.flyTo([place.latitude, place.longitude], 16, { duration: 1.2 });
        }
    }, [place, map]);
    return null;
}

/* ── Star rating helper ───────────────────────────────────────────── */
function stars(rating: number | null) {
    if (rating == null) return "N/A";
    return "★".repeat(Math.round(rating)) + "☆".repeat(5 - Math.round(rating));
}

/* ── Parse services string like "['Dine-in', 'Takeaway']" ─────────── */
function parseServices(raw: string | null): string[] {
    if (!raw || raw === "[]") return [];
    try {
        // Replace single quotes with double quotes for JSON.parse
        return JSON.parse(raw.replace(/'/g, '"'));
    } catch {
        // Fallback: extract words between quotes
        const matches = raw.match(/'([^']+)'/g);
        return matches ? matches.map((m) => m.replace(/'/g, "")) : [];
    }
}

/* ── Parse open_hours string into a list of { day, hours } ────────── */
function parseAllHours(raw: string | null): { day: string; hours: string }[] {
    if (!raw || raw === "[]") return [];
    try {
        const results: { day: string; hours: string }[] = [];
        const regex = /day:\s*'([^']*)'[^}]*hours:\s*'([^']*)'/g;
        let match;
        while ((match = regex.exec(raw)) !== null) {
            results.push({ day: match[1], hours: match[2] });
        }
        return results;
    } catch {
        return [];
    }
}

function getTodayName(): string {
    return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][new Date().getDay()];
}

/* ── Main Map Component ───────────────────────────────────────────── */
interface MapViewProps {
    places: Place[];
    selectedPlace: Place | null;
    onSelectPlace: (p: Place) => void;
}

export default function MapView({
    places,
    selectedPlace,
    onSelectPlace,
}: MapViewProps) {
    // Center on Batam
    const center: [number, number] = [1.08, 104.03];

    return (
        <MapContainer
            center={center}
            zoom={12}
            className="h-full w-full"
            zoomControl={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            <FlyTo place={selectedPlace} />

            {places.map((p) => {
                if (p.latitude == null || p.longitude == null) return null;
                const isSelected = selectedPlace?.id === p.id;
                return (
                    <Marker
                        key={p.id}
                        position={[p.latitude, p.longitude]}
                        icon={isSelected ? selectedIcon : defaultIcon}
                        eventHandlers={{ click: () => onSelectPlace(p) }}
                    >
                        <Popup>
                            <div className="min-w-[200px] max-w-[280px] text-sm">
                                <p className="font-semibold text-base mb-1">{p.name}</p>
                                <p className="text-amber-500 text-xs mb-0.5">
                                    {stars(p.rating)}{" "}
                                    <span className="text-gray-400">({p.review ?? 0})</span>
                                </p>
                                <p className="text-gray-500 text-xs">{p.category}</p>
                                {p.address && (
                                    <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                                        {p.address}
                                    </p>
                                )}

                                {/* Services */}
                                {parseServices(p.services).length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {parseServices(p.services).map((s) => (
                                            <span
                                                key={s}
                                                className="inline-block bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded"
                                            >
                                                {s}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Open hours */}
                                {parseAllHours(p.open_hours).length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-gray-600 text-[11px] font-semibold mb-1 flex items-center gap-1">
                                            🕐 Open Hours
                                        </p>
                                        <ul className="space-y-0.5">
                                            {parseAllHours(p.open_hours).map((h) => {
                                                const isToday = h.day === getTodayName();
                                                return (
                                                    <li
                                                        key={h.day}
                                                        className={`text-[11px] flex justify-between gap-3 ${isToday
                                                            ? "text-blue-600 font-semibold"
                                                            : "text-gray-500"
                                                            }`}
                                                    >
                                                        <span>{h.day}</span>
                                                        <span>{h.hours}</span>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                )}

                                {/* Google Maps link */}
                                {p.url && (
                                    <a
                                        href={p.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-block mt-2 text-[11px] text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        Open in Google Maps →
                                    </a>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                );
            })}
        </MapContainer>
    );
}
