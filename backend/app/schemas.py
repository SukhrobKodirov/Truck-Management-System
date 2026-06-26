from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from .models import LoadStatus


# ─── Truck Schemas ─────────────────────────────────────

class TruckBase(BaseModel):
    truck_number: str
    driver_name: str
    driver_phone: Optional[str] = None
    license_plate: Optional[str] = None
    trailer_number: Optional[str] = None
    samsara_vehicle_id: Optional[str] = None
    notes: Optional[str] = None

class TruckCreate(TruckBase):
    pass

class TruckUpdate(BaseModel):
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    license_plate: Optional[str] = None
    trailer_number: Optional[str] = None
    samsara_vehicle_id: Optional[str] = None
    notes: Optional[str] = None

class TruckOut(TruckBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Load Schemas ──────────────────────────────────────

class LoadBase(BaseModel):
    load_number: str
    truck_number: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    ship_from: str
    ship_to: str
    pickup_date: Optional[str] = None
    pickup_time: Optional[str] = None
    delivery_date: Optional[str] = None
    delivery_time: Optional[str] = None
    commodity: Optional[str] = None
    weight: Optional[float] = None
    rate: Optional[float] = None
    broker_name: Optional[str] = None
    broker_phone: Optional[str] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    samsara_vehicle_id: Optional[str] = None

class LoadCreate(LoadBase):
    status: LoadStatus = LoadStatus.pending

class LoadUpdate(BaseModel):
    truck_number: Optional[str] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    ship_from: Optional[str] = None
    ship_to: Optional[str] = None
    pickup_date: Optional[str] = None
    pickup_time: Optional[str] = None
    delivery_date: Optional[str] = None
    delivery_time: Optional[str] = None
    actual_pickup_at: Optional[datetime] = None
    actual_delivery_at: Optional[datetime] = None
    status: Optional[LoadStatus] = None
    commodity: Optional[str] = None
    weight: Optional[float] = None
    rate: Optional[float] = None
    broker_name: Optional[str] = None
    broker_phone: Optional[str] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None
    samsara_vehicle_id: Optional[str] = None

class LoadOut(LoadBase):
    id: int
    status: LoadStatus
    mileage: Optional[float] = None
    ship_from_lat: Optional[float] = None
    ship_from_lng: Optional[float] = None
    ship_to_lat: Optional[float] = None
    ship_to_lng: Optional[float] = None
    actual_pickup_at: Optional[datetime] = None
    actual_delivery_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ─── Stats Schema ──────────────────────────────────────

class DashboardStats(BaseModel):
    total_loads: int
    rolling: int
    stopped: int
    issue: int
    at_shipper: int
    at_receiver: int
    delivered: int
    pending: int
    cancelled: int
