from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx
from ..config import get_settings

router = APIRouter(prefix="/maps", tags=["maps"])
settings = get_settings()

GMAPS_BASE = "https://maps.googleapis.com/maps/api"


class RouteRequest(BaseModel):
    origin: str
    destination: str


class RouteResponse(BaseModel):
    origin: str
    destination: str
    distance_miles: Optional[float] = None
    duration_text: Optional[str] = None
    origin_lat: Optional[float] = None
    origin_lng: Optional[float] = None
    destination_lat: Optional[float] = None
    destination_lng: Optional[float] = None
    error: Optional[str] = None


@router.post("/route", response_model=RouteResponse)
async def calculate_route(payload: RouteRequest):
    """
    Use Google Maps Distance Matrix API to get mileage and duration
    between two addresses. Also geocodes both addresses.
    """
    if not settings.google_maps_api_key:
        # Return mock data when no API key is configured
        return RouteResponse(
            origin=payload.origin,
            destination=payload.destination,
            distance_miles=0.0,
            duration_text="N/A (no API key)",
            error="GOOGLE_MAPS_API_KEY not configured",
        )

    async with httpx.AsyncClient() as client:
        # ── Distance Matrix ─────────────────────────────
        dist_resp = await client.get(
            f"{GMAPS_BASE}/distancematrix/json",
            params={
                "origins": payload.origin,
                "destinations": payload.destination,
                "units": "imperial",
                "key": settings.google_maps_api_key,
            },
        )
        dist_data = dist_resp.json()

        distance_miles = None
        duration_text = None

        try:
            element = dist_data["rows"][0]["elements"][0]
            if element["status"] == "OK":
                distance_meters = element["distance"]["value"]
                distance_miles = round(distance_meters / 1609.344, 1)
                duration_text = element["duration"]["text"]
        except (KeyError, IndexError):
            pass

        # ── Geocode origin ──────────────────────────────
        origin_lat, origin_lng = None, None
        dest_lat, dest_lng = None, None

        geo_origin = await client.get(
            f"{GMAPS_BASE}/geocode/json",
            params={"address": payload.origin, "key": settings.google_maps_api_key},
        )
        origin_data = geo_origin.json()
        if origin_data.get("results"):
            loc = origin_data["results"][0]["geometry"]["location"]
            origin_lat, origin_lng = loc["lat"], loc["lng"]

        # ── Geocode destination ─────────────────────────
        geo_dest = await client.get(
            f"{GMAPS_BASE}/geocode/json",
            params={"address": payload.destination, "key": settings.google_maps_api_key},
        )
        dest_data = geo_dest.json()
        if dest_data.get("results"):
            loc = dest_data["results"][0]["geometry"]["location"]
            dest_lat, dest_lng = loc["lat"], loc["lng"]

    return RouteResponse(
        origin=payload.origin,
        destination=payload.destination,
        distance_miles=distance_miles,
        duration_text=duration_text,
        origin_lat=origin_lat,
        origin_lng=origin_lng,
        destination_lat=dest_lat,
        destination_lng=dest_lng,
    )
