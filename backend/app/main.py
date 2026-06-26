from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import loads, trucks, maps, samsara

# Create all tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Truck Management System",
    description="Track loads, trucks, drivers, routes, and live vehicle locations.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(loads.router, prefix="/api")
app.include_router(trucks.router, prefix="/api")
app.include_router(maps.router, prefix="/api")
app.include_router(samsara.router, prefix="/api")


@app.get("/health")
def health():
    return {"status": "ok", "service": "truck-management-api"}
