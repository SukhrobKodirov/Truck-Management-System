"""
Samsara Integration Router
--------------------------
Plug in your SAMSARA_API_KEY in .env and this is ready to use.
Docs: https://developers.samsara.com/reference
"""
from fastapi import APIRouter, HTTPException
from typing import Optional, List
from pydantic import BaseModel
import httpx
from ..config import get_settings

router = APIRouter(prefix="/samsara", tags=["samsara"])
settings = get_settings()


class VehicleLocation(BaseModel):
    vehicle_id: str
    vehicle_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    heading: Optional[float] = None
    speed_mph: Optional[float] = None
    address: Optional[str] = None
    updated_at: Optional[str] = None


def _headers():
    if not settings.samsara_api_key:
        raise HTTPException(
            status_code=503,
            detail="Samsara API key not configured. Set SAMSARA_API_KEY in .env",
        )
    return {
        "Authorization": f"Bearer {settings.samsara_api_key}",
        "Content-Type": "application/json",
    }


@router.get("/vehicles", response_model=List[dict])
async def list_vehicles():
    """List all vehicles registered in your Samsara fleet."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.samsara_base_url}/fleet/vehicles",
            headers=_headers(),
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    data = resp.json()
    return data.get("data", [])


@router.get("/vehicles/{vehicle_id}/location", response_model=VehicleLocation)
async def get_vehicle_location(vehicle_id: str):
    """
    Get real-time location for a specific Samsara vehicle.
    Use the samsara_vehicle_id stored on the Load or Truck record.
    """
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{settings.samsara_base_url}/fleet/vehicles/locations",
            headers=_headers(),
            params={"vehicleIds": vehicle_id},
        )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)

    data = resp.json().get("data", [])
    if not data:
        raise HTTPException(status_code=404, detail="Vehicle not found in Samsara")

    v = data[0]
    loc = v.get("location", {})
    return VehicleLocation(
        vehicle_id=vehicle_id,
        vehicle_name=v.get("name"),
        latitude=loc.get("latitude"),
        longitude=loc.get("longitude"),
        heading=loc.get("heading"),
        speed_mph=loc.get("speed"),
        address=loc.get("reverseGeo", {}).get("formattedLocation"),
        updated_at=loc.get("time"),
    )


@router.get("/status")
async def samsara_status():
    """Check if Samsara API key is configured and reachable."""
    if not settings.samsara_api_key:
        return {"configured": False, "message": "Set SAMSARA_API_KEY in .env to enable tracking"}
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(
                f"{settings.samsara_base_url}/fleet/vehicles",
                headers=_headers(),
                timeout=5.0,
            )
            return {"configured": True, "reachable": resp.status_code == 200}
        except Exception as e:
            return {"configured": True, "reachable": False, "error": str(e)}
