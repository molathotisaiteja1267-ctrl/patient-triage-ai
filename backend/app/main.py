"""
PatientTriage.ai - Main FastAPI Application.
Multi-Hospital Clinical Decision Support & Care Coordination Platform.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db
from app.routes import (
    auth_router,
    patients_router,
    hospital_router,
    triage_router,
    audit_router,
    analytics_router,
    simulation_router
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite normalized tables on startup
    init_db()
    yield


app = FastAPI(
    title="PatientTriage.ai - Multi-Hospital Clinical Decision Support",
    version=settings.PROJECT_VERSION,
    description="Multi-hospital emergency triage & longitudinal patient coordination platform. 'AI Recommends, Humans Decide.'",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(patients_router, prefix=settings.API_PREFIX)
app.include_router(hospital_router, prefix=settings.API_PREFIX)
app.include_router(triage_router, prefix=settings.API_PREFIX)
app.include_router(audit_router, prefix=settings.API_PREFIX)
app.include_router(analytics_router, prefix=settings.API_PREFIX)
app.include_router(simulation_router, prefix=settings.API_PREFIX)


@app.get("/api/health", tags=["Health"])
@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint to verify backend status."""
    return {
        "status": "healthy",
        "service": "PatientTriage.ai",
        "version": settings.PROJECT_VERSION,
        "environment": settings.ENVIRONMENT,
        "database": "connected"
    }


@app.get("/", tags=["Root"])
def root_info():
    """System information & prototype disclaimer."""
    return {
        "name": "PatientTriage.ai",
        "version": settings.PROJECT_VERSION,
        "role": "Multi-Hospital Clinical Decision Support Platform Prototype",
        "philosophy": "AI Recommends. Humans Decide.",
        "disclaimer": (
            "PatientTriage.ai is a research/portfolio prototype using synthetic data. "
            "It is NOT a medical device and must not be used for real-world clinical decision-making."
        ),
        "docs_url": "/docs"
    }


import os
from fastapi.staticfiles import StaticFiles

# Mount static files if present in production container
_static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
if os.path.exists(_static_dir):
    app.mount("/app", StaticFiles(directory=_static_dir, html=True), name="static_app")


from fastapi.exceptions import RequestValidationError


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    messages = []
    for err in errors:
        loc = " -> ".join(str(l) for l in err.get("loc", []) if l != "body")
        msg = err.get("msg", "Invalid input")
        if "valid datetime" in msg.lower() or "valid date" in msg.lower() or "too short" in msg.lower():
            clean_msg = f"Invalid date or time provided for '{loc or 'field'}'. Please select a valid date/time."
        else:
            clean_msg = f"{loc}: {msg}" if loc else msg
        messages.append(clean_msg)
    
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": "Validation Error",
            "detail": "; ".join(messages),
            "errors": errors
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "detail": str(exc),
            "safety_note": "System exception logged. Human clinician review required."
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
