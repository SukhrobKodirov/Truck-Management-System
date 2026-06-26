from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import Truck
from ..schemas import TruckCreate, TruckUpdate, TruckOut

router = APIRouter(prefix="/trucks", tags=["trucks"])


@router.get("/", response_model=List[TruckOut])
def list_trucks(db: Session = Depends(get_db)):
    return db.query(Truck).order_by(Truck.truck_number).all()


@router.get("/{truck_id}", response_model=TruckOut)
def get_truck(truck_id: int, db: Session = Depends(get_db)):
    truck = db.query(Truck).filter(Truck.id == truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")
    return truck


@router.post("/", response_model=TruckOut, status_code=201)
def create_truck(payload: TruckCreate, db: Session = Depends(get_db)):
    existing = db.query(Truck).filter(Truck.truck_number == payload.truck_number).first()
    if existing:
        raise HTTPException(status_code=400, detail="Truck number already exists")
    truck = Truck(**payload.model_dump())
    db.add(truck)
    db.commit()
    db.refresh(truck)
    return truck


@router.patch("/{truck_id}", response_model=TruckOut)
def update_truck(truck_id: int, payload: TruckUpdate, db: Session = Depends(get_db)):
    truck = db.query(Truck).filter(Truck.id == truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(truck, field, value)
    db.commit()
    db.refresh(truck)
    return truck


@router.delete("/{truck_id}", status_code=204)
def delete_truck(truck_id: int, db: Session = Depends(get_db)):
    truck = db.query(Truck).filter(Truck.id == truck_id).first()
    if not truck:
        raise HTTPException(status_code=404, detail="Truck not found")
    db.delete(truck)
    db.commit()
