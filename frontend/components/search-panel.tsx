"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Place, PaginatedResponse } from "@/lib/api";
import {
    getPlaces,
    getCategories,
    searchPlaces,
    getNearbyPlaces,
} from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import PlaceCard from "@/components/place-card";
import {
    Search,
    MapPin,
    Navigation,
    ChevronLeft,
    ChevronRight,
    Loader2,
    X,
    LayoutGrid,
    Locate,
} from "lucide-react";

const PAGE_SIZE = 15;

type SearchMode = "browse" | "search" | "nearby";

interface SearchPanelProps {
    selectedPlace: Place | null;
    onSelectPlace: (p: Place) => void;
    onPlacesChange: (places: Place[]) => void;
}

export default function SearchPanel({
    selectedPlace,
    onSelectPlace,
    onPlacesChange,
}: SearchPanelProps) {
    const [mode, setMode] = useState<SearchMode>("browse");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Browse state
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>("");

    // Search state
    const [query, setQuery] = useState("");
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Nearby state
    const [nearbyLat, setNearbyLat] = useState("1.08");
    const [nearbyLng, setNearbyLng] = useState("104.03");
    const [nearbyRadius, setNearbyRadius] = useState("3");
    const [geoLoading, setGeoLoading] = useState(false);
    const [geoError, setGeoError] = useState<string | null>(null);
    const geoDetectedRef = useRef(false);

    // Request device location via Geolocation API
    const requestLocation = useCallback(() => {
        if (!navigator.geolocation) {
            setGeoError("Geolocation is not supported by your browser");
            return;
        }
        setGeoLoading(true);
        setGeoError(null);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setNearbyLat(position.coords.latitude.toFixed(6));
                setNearbyLng(position.coords.longitude.toFixed(6));
                setGeoLoading(false);
            },
            (err) => {
                setGeoError(
                    err.code === err.PERMISSION_DENIED
                        ? "Location permission denied"
                        : err.code === err.POSITION_UNAVAILABLE
                            ? "Location unavailable"
                            : "Location request timed out"
                );
                setGeoLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }, []);

    // Auto-detect location when switching to nearby mode (once)
    useEffect(() => {
        if (mode === "nearby" && !geoDetectedRef.current) {
            geoDetectedRef.current = true;
            requestLocation();
        }
    }, [mode, requestLocation]);

    // Results
    const [page, setPage] = useState(1);
    const [result, setResult] = useState<PaginatedResponse<Place> | null>(null);

    // Load categories once
    useEffect(() => {
        getCategories()
            .then(setCategories)
            .catch(() => { });
    }, []);

    // Fetch function
    const fetchData = useCallback(
        async (p: number) => {
            setLoading(true);
            setError(null);
            try {
                let res: PaginatedResponse<Place>;
                if (mode === "search" && query.trim()) {
                    res = await searchPlaces({ q: query.trim(), page: p, page_size: PAGE_SIZE });
                } else if (mode === "nearby") {
                    res = await getNearbyPlaces({
                        lat: parseFloat(nearbyLat),
                        lng: parseFloat(nearbyLng),
                        radius_km: parseFloat(nearbyRadius) || 3,
                        page: p,
                        page_size: PAGE_SIZE,
                    });
                } else {
                    res = await getPlaces({
                        page: p,
                        page_size: PAGE_SIZE,
                        category: selectedCategory || undefined,
                    });
                }
                setResult(res);
                setPage(p);
                onPlacesChange(res.data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to fetch data");
            } finally {
                setLoading(false);
            }
        },
        [mode, query, selectedCategory, nearbyLat, nearbyLng, nearbyRadius, onPlacesChange]
    );

    // Initial load + re-fetch on mode / category change
    useEffect(() => {
        if (mode !== "search") {
            fetchData(1);
        }
    }, [mode, selectedCategory]); // eslint-disable-line react-hooks/exhaustive-deps

    // Debounced search
    useEffect(() => {
        if (mode !== "search") return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (!query.trim()) {
            setResult(null);
            onPlacesChange([]);
            return;
        }
        debounceRef.current = setTimeout(() => fetchData(1), 400);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]); // eslint-disable-line react-hooks/exhaustive-deps

    const selectedRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (selectedRef.current) {
            selectedRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [selectedPlace]);

    return (
        <div className="h-full flex flex-col bg-background">
            {/* ── Header ─────────────────────────────── */}
            <div className="p-4 pb-3 space-y-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h1 className="text-lg font-bold tracking-tight">GeoMarket</h1>
                    <span className="text-xs text-muted-foreground">Batam Culinary</span>
                </div>

                {/* Mode tabs */}
                <div className="flex gap-1">
                    {(
                        [
                            { key: "browse", label: "Browse", icon: LayoutGrid },
                            { key: "search", label: "Search", icon: Search },
                            { key: "nearby", label: "Nearby", icon: Navigation },
                        ] as const
                    ).map(({ key, label, icon: Icon }) => (
                        <Button
                            key={key}
                            size="sm"
                            variant={mode === key ? "default" : "ghost"}
                            className="flex-1 gap-1.5 text-xs h-8"
                            onClick={() => {
                                setMode(key);
                                setPage(1);
                            }}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                        </Button>
                    ))}
                </div>
            </div>

            {/* ── Controls ───────────────────────────── */}
            <div className="px-4 pt-3 pb-2 space-y-2">
                {mode === "search" && (
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search places, categories, or addresses…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-9 pr-8 h-9 text-sm"
                            autoFocus
                        />
                        {query && (
                            <button
                                onClick={() => setQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                )}

                {mode === "browse" && (
                    <div className="flex flex-wrap gap-1.5">
                        <Badge
                            variant={selectedCategory === "" ? "default" : "secondary"}
                            className="cursor-pointer text-xs"
                            onClick={() => setSelectedCategory("")}
                        >
                            All
                        </Badge>
                        {categories.slice(0, 20).map((c) => (
                            <Badge
                                key={c}
                                variant={selectedCategory === c ? "default" : "secondary"}
                                className="cursor-pointer text-xs"
                                onClick={() =>
                                    setSelectedCategory(selectedCategory === c ? "" : c)
                                }
                            >
                                {c}
                            </Badge>
                        ))}
                        {categories.length > 20 && (
                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                +{categories.length - 20} more
                            </Badge>
                        )}
                    </div>
                )}

                {mode === "nearby" && (
                    <div className="space-y-2">
                        {/* Use My Location button */}
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs gap-1.5"
                            onClick={requestLocation}
                            disabled={geoLoading}
                        >
                            {geoLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Locate className="h-3.5 w-3.5" />
                            )}
                            {geoLoading ? "Detecting location…" : "Use My Location"}
                        </Button>
                        {geoError && (
                            <p className="text-[11px] text-destructive">{geoError}</p>
                        )}

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                    Latitude
                                </label>
                                <Input
                                    type="number"
                                    step="any"
                                    value={nearbyLat}
                                    onChange={(e) => setNearbyLat(e.target.value)}
                                    className="h-8 text-xs font-mono"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                    Longitude
                                </label>
                                <Input
                                    type="number"
                                    step="any"
                                    value={nearbyLng}
                                    onChange={(e) => setNearbyLng(e.target.value)}
                                    className="h-8 text-xs font-mono"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[10px] text-muted-foreground uppercase tracking-wider">
                                Radius (km): {nearbyRadius}
                            </label>
                            <input
                                type="range"
                                min="0.5"
                                max="20"
                                step="0.5"
                                value={nearbyRadius}
                                onChange={(e) => setNearbyRadius(e.target.value)}
                                className="w-full h-2 accent-primary"
                            />
                        </div>
                        <Button
                            size="sm"
                            className="w-full h-8 text-xs"
                            onClick={() => fetchData(1)}
                        >
                            <Navigation className="h-3.5 w-3.5 mr-1.5" />
                            Search Nearby
                        </Button>
                    </div>
                )}
            </div>

            <Separator className="opacity-50" />

            {/* ── Results header ─────────────────────── */}
            {result && (
                <div className="px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                        {result.total.toLocaleString()} places found
                    </span>
                    <span>
                        Page {result.page} / {result.total_pages}
                    </span>
                </div>
            )}

            {/* ── Results list ───────────────────────── */}
            <ScrollArea className="flex-1 min-h-0">
                <div className="px-4 pb-4 space-y-2">
                    {loading && (
                        <div className="flex items-center justify-center py-12 text-muted-foreground">
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                            Loading…
                        </div>
                    )}

                    {error && (
                        <div className="py-8 text-center">
                            <p className="text-destructive text-sm">{error}</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2"
                                onClick={() => fetchData(page)}
                            >
                                Retry
                            </Button>
                        </div>
                    )}

                    {!loading &&
                        !error &&
                        result?.data.map((p) => (
                            <div
                                key={p.id}
                                ref={selectedPlace?.id === p.id ? selectedRef : undefined}
                            >
                                <PlaceCard
                                    place={p}
                                    isSelected={selectedPlace?.id === p.id}
                                    onClick={() => onSelectPlace(p)}
                                />
                            </div>
                        ))}

                    {!loading && !error && result && result.data.length === 0 && (
                        <p className="text-center text-muted-foreground text-sm py-12">
                            No places found
                        </p>
                    )}
                </div>
            </ScrollArea>

            {/* ── Pagination ─────────────────────────── */}
            {result && result.total_pages > 1 && (
                <div className="p-3 border-t border-border/50 flex items-center justify-between gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        disabled={page <= 1 || loading}
                        onClick={() => fetchData(page - 1)}
                    >
                        <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                        Prev
                    </Button>
                    <span className="text-xs text-muted-foreground">
                        {page} / {result.total_pages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        disabled={page >= result.total_pages || loading}
                        onClick={() => fetchData(page + 1)}
                    >
                        Next
                        <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                </div>
            )}
        </div>
    );
}
