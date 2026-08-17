"""
PatientTriage.ai - Main FastAPI Application.
Multi-Hospital Clinical Decision Support & Care Coordination Platform.
"""

import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

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


@app.get("/api/info", tags=["System Info"])
@app.get("/info", tags=["System Info"])
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
        "docs_url": "/docs",
        "health_url": "/health"
    }


# Detect production static assets directory
_possible_static_dirs = [
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static"),  # Docker: /app/static
    os.path.join(os.getcwd(), "static"),
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "dist"),
]

_static_dir = None
for _dir in _possible_static_dirs:
    if _dir and os.path.exists(_dir) and os.path.isdir(_dir):
        _static_dir = os.path.abspath(_dir)
        break

if _static_dir and os.path.exists(_static_dir):
    _assets_dir = os.path.join(_static_dir, "assets")
    if os.path.exists(_assets_dir):
        app.mount("/assets", StaticFiles(directory=_assets_dir), name="static_assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa_app(full_path: str):
        # Do not intercept API, docs, or health endpoints
        if full_path.startswith("api/") or full_path in ("docs", "redoc", "openapi.json", "health"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})

        # Serve static file directly if it exists (e.g. favicon.ico, vite.svg)
        target_file = os.path.join(_static_dir, full_path)
        if full_path and os.path.isfile(target_file):
            return FileResponse(target_file)

        # Fallback to SPA index.html for root and all client-side routes
        index_html = os.path.join(_static_dir, "index.html")
        if os.path.exists(index_html):
            return FileResponse(index_html)

        return JSONResponse(status_code=404, content={"detail": "Frontend index.html not found"})
else:
    @app.get("/", tags=["Root"])
    def root_fallback():
        return root_info()


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
