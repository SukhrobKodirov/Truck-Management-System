from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Enum as SAEnum
from sqlalchemy.sql import func
from .database import Base
import enum


class LoadStatus(str, enum.Enum):
    pending = "pending"
    at_shipper = "at_shipper"
    rolling = "rolling"
    stopped = "stopped"
    issue = "issue"
    at_receiver = "at_receiver"
    delivered = "delivered"
    cancelled = "cancelled"


class Truck(Base):
    __tablename__ = "trucks"

    id = Column(Integer, primary_key=True, index=True)
    truck_number = Column(String(50), unique=True, nullable=False, index=True)
    driver_name = Column(String(100), nullable=False)
    driver_phone = Column(String(20))
    license_plate = Column(String(20))
    trailer_number = Column(String(50))
    samsara_vehicle_id = Column(String(100))  # Samsara integration
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Load(Base):
    __tablename__ = "loads"

    id = Column(Integer, primary_key=True, index=True)
    load_number = Column(String(50), unique=True, nullable=False, index=True)

    # Truck / driver
    truck_number = Column(String(50), index=True)
    driver_name = Column(String(100))
    driver_phone = Column(String(20))

    # Route
    ship_from = Column(String(255), nullable=False)
    ship_from_lat = Column(Float)
    ship_from_lng = Column(Float)
    ship_to = Column(String(255), nullable=False)
    ship_to_lat = Column(Float)
    ship_to_lng = Column(Float)
    mileage = Column(Float)  # auto-calculated via Google Maps

    # Scheduled times
    pickup_date = Column(String(20))        # YYYY-MM-DD
    pickup_time = Column(String(10))        # HH:MM
    delivery_date = Column(String(20))
    delivery_time = Column(String(10))

    # Actual times
    actual_pickup_at = Column(DateTime(timezone=True))
    actual_delivery_at = Column(DateTime(timezone=True))

    # Status & details
    status = Column(SAEnum(LoadStatus), default=LoadStatus.pending, nullable=False)
    commodity = Column(String(100))
    weight = Column(Float)                  # lbs
    rate = Column(Float)                    # USD
    broker_name = Column(String(100))
    broker_phone = Column(String(20))
    reference_number = Column(String(100))
    notes = Column(Text)

    # Samsara
    samsara_vehicle_id = Column(String(100))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
