"use client";

import type { Place } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MapPin, Star, MessageSquare, ExternalLink } from "lucide-react";

interface PlaceCardProps {
    place: Place;
    isSelected: boolean;
    onClick: () => void;
}

export default function PlaceCard({
    place,
    isSelected,
    onClick,
}: PlaceCardProps) {
    return (
        <Card
            onClick={onClick}
            className={cn(
                "cursor-pointer transition-all duration-200 hover:bg-accent/50 border-border/50",
                isSelected &&
                "ring-2 ring-primary bg-accent/30 border-primary/40"
            )}
        >
            <CardContent className="p-4 space-y-2">
                {/* Name + Category */}
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                        {place.name ?? "Unnamed"}
                    </h3>
                    {place.url && (
                        <a
                            href={place.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                            title="Open in Google Maps"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    )}
                </div>

                {place.category && (
                    <Badge variant="secondary" className="text-xs font-normal">
                        {place.category}
                    </Badge>
                )}

                {/* Rating + Reviews */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {place.rating != null && (
                        <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="font-medium text-foreground">
                                {place.rating}
                            </span>
                        </span>
                    )}
                    {place.review != null && (
                        <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {place.review} reviews
                        </span>
                    )}
                </div>

                {/* Address */}
                {place.address && (
                    <p className="text-xs text-muted-foreground flex items-start gap-1 line-clamp-2">
                        <MapPin className="h-3 w-3 mt-0.5 shrink-0" />
                        {place.address}
                    </p>
                )}

                {/* Coords */}
                {place.latitude != null && place.longitude != null && (
                    <p className="text-[10px] text-muted-foreground/60 font-mono">
                        {place.latitude.toFixed(6)}, {place.longitude.toFixed(6)}
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
