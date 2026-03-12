"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { Place } from "@/lib/api";
import SearchPanel from "@/components/search-panel";

// Leaflet requires `window` — disable SSR
const MapView = dynamic(() => import("@/components/map-view"), { ssr: false });

export default function Home() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const handlePlacesChange = useCallback((newPlaces: Place[]) => {
    setPlaces(newPlaces);
  }, []);

  const handleSelectPlace = useCallback((p: Place) => {
    setSelectedPlace((prev) => (prev?.id === p.id ? null : p));
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      {/* ── Left sidebar ── */}
      <aside className="w-[400px] shrink-0 h-full border-r border-border/50 flex flex-col">
        <SearchPanel
          selectedPlace={selectedPlace}
          onSelectPlace={handleSelectPlace}
          onPlacesChange={handlePlacesChange}
        />
      </aside>

      {/* ── Map area ── */}
      <main className="flex-1 h-full relative">
        <MapView
          places={places}
          selectedPlace={selectedPlace}
          onSelectPlace={handleSelectPlace}
        />
      </main>
    </div>
  );
}
