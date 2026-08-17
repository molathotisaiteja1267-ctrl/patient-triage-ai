"""
Operational Surge Simulation API for PatientTriage.ai.
Allows staff to model wait-time multipliers on active intake queue during surge conditions.
DOES NOT GENERATE FAKE / DEMO PATIENTS.
"""

from typing import Dict, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends
from app.auth import get_current_user_payload
from app.database import get_db_connection

router = APIRouter(prefix="", tags=["Simulation"])


class OverloadConfig(BaseModel):
    load_level: str = Field("Normal", description="'Normal', 'Moderate', 'High', 'Critical Overload'")
    wait_time_multiplier: float = Field(1.0, ge=1.0, le=5.0)


@router.post("/simulation/overload")
def apply_overload_simulation(
    config: OverloadConfig,
    current_user: dict = Depends(get_current_user_payload)
):
    """
    Simulate Emergency Department Overload conditions on active patient queue.
    Scales patient wait times without generating synthetic records.
    """
    hospital_id = current_user["hospital_id"]
    level = config.load_level

    multiplier_map = {
        "Normal": 1.0,
        "Moderate": 1.5,
        "High": 2.5,
        "Critical Overload": 4.0
    }
    multiplier = multiplier_map.get(level, config.wait_time_multiplier)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    INSERT INTO system_state (hospital_id, key, value) VALUES (?, 'load_level', ?)
    ON CONFLICT(hospital_id, key) DO UPDATE SET value = excluded.value
    """, (hospital_id, level))
    
    cursor.execute("SELECT COUNT(*) as c FROM patients WHERE hospital_id = ?", (hospital_id,))
    count = cursor.fetchone()["c"]
    conn.commit()
    conn.close()

    return {
        "status": "success",
        "load_level": level,
        "wait_time_multiplier": multiplier,
        "active_patient_count": count,
        "message": f"Emergency Department surge level set to '{level}'."
    }
