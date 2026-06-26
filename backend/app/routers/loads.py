from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import httpx

from ..database import get_db
from ..models import Load, LoadStatus
from ..schemas import LoadCreate, LoadUpdate, LoadOut, DashboardStats
from ..config import get_settings

router = APIRouter(prefix="/loads", tags=["loads"])
settings = get_settings()

GMAPS_BASE = "https://maps.googleapis.com/maps/api"


async def _geocode_and_distance(origin: str, destination: str):
    """Returns (origin_lat, origin_lng, dest_lat, dest_lng, miles) via Google Maps."""
    if not settings.google_maps_api_key:
        return None, None, None, None, None

    async with httpx.AsyncClient() as client:
        dist = await client.get(
            f"{GMAPS_BASE}/distancematrix/json",
            params={
                "origins": origin,
                "destinations": destination,
                "units": "imperial",
                "key": settings.google_maps_api_key,
            },
        )
        dist_data = dist.json()
        miles = None
        try:
            el = dist_data["rows"][0]["elements"][0]
            if el["status"] == "OK":
                miles = round(el["distance"]["value"] / 1609.344, 1)
        except (KeyError, IndexError):
            pass

        geo_o = await client.get(
            f"{GMAPS_BASE}/geocode/json",
            params={"address": origin, "key": settings.google_maps_api_key},
        )
        o_lat = o_lng = None
        if geo_o.json().get("results"):
            loc = geo_o.json()["results"][0]["geometry"]["location"]
            o_lat, o_lng = loc["lat"], loc["lng"]

        geo_d = await client.get(
            f"{GMAPS_BASE}/geocode/json",
            params={"address": destination, "key": settings.google_maps_api_key},
        )
        d_lat = d_lng = None
        if geo_d.json().get("results"):
            loc = geo_d.json()["results"][0]["geometry"]["location"]
            d_lat, d_lng = loc["lat"], loc["lng"]

    return o_lat, o_lng, d_lat, d_lng, miles


# ── Dashboard Stats ─────────────────────────────────────

@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(Load.id)).scalar()
    counts = {s.value: 0 for s in LoadStatus}
    rows = db.query(Load.status, func.count(Load.id)).group_by(Load.status).all()
    for status, count in rows:
        counts[status] = count
    return DashboardStats(total_loads=total or 0, **counts)


# ── CRUD ────────────────────────────────────────────────

@router.get("/", response_model=List[LoadOut])
def list_loads(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    truck_number: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    db: Session = Depends(get_db),
):
    q = db.query(Load)
    if status:
        q = q.filter(Load.status == status)
    if truck_number:
        q = q.filter(Load.truck_number == truck_number)
    if search:
        like = f"%{search}%"
        q = q.filter(
            Load.load_number.ilike(like)
            | Load.ship_from.ilike(like)
            | Load.ship_to.ilike(like)
            | Load.driver_name.ilike(like)
        )
    return q.order_by(Load.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/{load_id}", response_model=LoadOut)
def get_load(load_id: int, db: Session = Depends(get_db)):
    load = db.query(Load).filter(Load.id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    return load


@router.post("/", response_model=LoadOut, status_code=201)
async def create_load(payload: LoadCreate, db: Session = Depends(get_db)):
    existing = db.query(Load).filter(Load.load_number == payload.load_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Load number already exists")

    data = payload.model_dump()
    o_lat, o_lng, d_lat, d_lng, miles = await _geocode_and_distance(
        payload.ship_from, payload.ship_to
    )
    data.update(
        ship_from_lat=o_lat, ship_from_lng=o_lng,
        ship_to_lat=d_lat, ship_to_lng=d_lng,
        mileage=miles,
    )
    load = Load(**data)
    db.add(load)
    db.commit()
    db.refresh(load)
    return load


@router.patch("/{load_id}", response_model=LoadOut)
async def update_load(load_id: int, payload: LoadUpdate, db: Session = Depends(get_db)):
    load = db.query(Load).filter(Load.id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")

    updates = payload.model_dump(exclude_unset=True)

    # Re-calculate mileage if route changed
    new_from = updates.get("ship_from", load.ship_from)
    new_to = updates.get("ship_to", load.ship_to)
    if "ship_from" in updates or "ship_to" in updates:
        o_lat, o_lng, d_lat, d_lng, miles = await _geocode_and_distance(new_from, new_to)
        updates.update(
            ship_from_lat=o_lat, ship_from_lng=o_lng,
            ship_to_lat=d_lat, ship_to_lng=d_lng,
            mileage=miles,
        )

    for field, value in updates.items():
        setattr(load, field, value)
    db.commit()
    db.refresh(load)
    return load


@router.delete("/{load_id}", status_code=204)
def delete_load(load_id: int, db: Session = Depends(get_db)):
    load = db.query(Load).filter(Load.id == load_id).first()
    if not load:
        raise HTTPException(status_code=404, detail="Load not found")
    db.delete(load)
    db.commit()
