"""
Direct Triage Evaluation Endpoint.
Allows client applications to run real-time triage evaluations and preview recommendations
without persisting patient records.
"""

from fastapi import APIRouter
from app.models import PatientIntake, TriageAssessment
from app.triage_engine import evaluate_triage

router = APIRouter(prefix="/triage", tags=["Triage Engine"])


@router.post("", response_model=TriageAssessment)
def evaluate_patient_triage(intake: PatientIntake):
    """
    Run the full triage decision support pipeline for a given patient intake payload.
    Returns estimated priority tier, recommended hospital route, safety flags, and explainable reasoning.
    """
    return evaluate_triage(intake)
