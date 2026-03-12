/* ── API types & fetch helpers for the GeoMarket backend ───────────── */

const API_BASE = "http://127.0.0.1:8000";

/* ───── Types ───── */

export interface Place {
    id: number;
    name: string | null;
    latitude: number | null;
    longitude: number | null;
    category: string | null;
    rating: number | null;
    review: number | null;
    price_level: number | null;
    services: string | null;
    address: string | null;
    open_hours: string | null;
    phone: string | null;
    url: string | null;
    cluster: string | null;
}

export interface PaginatedResponse<T> {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
    data: T[];
}

/* ───── Fetchers ───── */

async function fetcher<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    return res.json() as Promise<T>;
}

export function getPlaces(params: {
    page?: number;
    page_size?: number;
    category?: string;
    min_rating?: number;
}) {
    const sp = new URLSearchParams();
    if (params.page) sp.set("page", String(params.page));
    if (params.page_size) sp.set("page_size", String(params.page_size));
    if (params.category) sp.set("category", params.category);
    if (params.min_rating !== undefined) sp.set("min_rating", String(params.min_rating));
    return fetcher<PaginatedResponse<Place>>(`/api/v1/places?${sp}`);
}

export function getPlaceById(id: number) {
    return fetcher<Place>(`/api/v1/places/${id}`);
}

export function getCategories() {
    return fetcher<string[]>("/api/v1/places/categories");
}

export function searchPlaces(params: {
    q: string;
    page?: number;
    page_size?: number;
}) {
    const sp = new URLSearchParams({ q: params.q });
    if (params.page) sp.set("page", String(params.page));
    if (params.page_size) sp.set("page_size", String(params.page_size));
    return fetcher<PaginatedResponse<Place>>(`/api/v1/places/search?${sp}`);
}

export function getNearbyPlaces(params: {
    lat: number;
    lng: number;
    radius_km?: number;
    category?: string;
    page?: number;
    page_size?: number;
}) {
    const sp = new URLSearchParams({
        lat: String(params.lat),
        lng: String(params.lng),
    });
    if (params.radius_km) sp.set("radius_km", String(params.radius_km));
    if (params.category) sp.set("category", params.category);
    if (params.page) sp.set("page", String(params.page));
    if (params.page_size) sp.set("page_size", String(params.page_size));
    return fetcher<PaginatedResponse<Place>>(`/api/v1/places/nearby?${sp}`);
}
