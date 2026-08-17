from app.routes.auth import router as auth_router
from app.routes.patients import router as patients_router
from app.routes.hospital import router as hospital_router
from app.routes.triage import router as triage_router
from app.routes.audit import router as audit_router
from app.routes.analytics import router as analytics_router
from app.routes.simulation import router as simulation_router

__all__ = [
    "auth_router",
    "patients_router",
    "hospital_router",
    "triage_router",
    "audit_router",
    "analytics_router",
    "simulation_router",
]
