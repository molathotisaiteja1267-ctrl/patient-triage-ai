"""
Worst-Case-First Safety Design Verification Tests.
Guarantees that missing or ambiguous data never leads to false reassurance or unsafe downgrading.
"""

import pytest
from app.models import (
    PatientIntake,
    VitalSigns,
    SymptomProfile,
    RedFlagsAssessment,
    RedFlagChoice,
    PriorityLevel,
    UncertaintyLevel
)
from app.triage_engine import evaluate_triage


def test_missing_spo2_never_downgrades_respiratory_patient():
    """Verify that a patient presenting with dyspnea is never downgraded to GREEN or BLUE when SpO2 is missing."""
    intake = PatientIntake(
        patient_id="WC-001",
        age=55,
        sex="Male",
        chief_complaint="Severe shortness of breath and orthopnea",
        red_flags=RedFlagsAssessment(severe_dyspnea=RedFlagChoice.YES),
        symptoms=SymptomProfile(
            main_symptoms=["Dyspnea", "Cough"],
            severity=5
        ),
        vitals=VitalSigns(
            heart_rate=88,
            respiratory_rate=20,
            spo2=None,  # MISSING SpO2
            systolic_bp=130,
            diastolic_bp=80
        )
    )
    assessment = evaluate_triage(intake)
    assert assessment.priority in (PriorityLevel.RED, PriorityLevel.ORANGE)
    assert assessment.priority != PriorityLevel.GREEN
    assert assessment.priority != PriorityLevel.BLUE
    assert assessment.safety_eval.requires_human_review
    assert assessment.confidence_score <= 0.85


def test_chest_pain_missing_bp_escalates_safety():
    """Verify that cardiac chest pain with missing blood pressure flags missing information and lowers confidence."""
    intake = PatientIntake(
        patient_id="WC-002",
        age=62,
        sex="Female",
        chief_complaint="Substernal chest pain with radiation to back",
        red_flags=RedFlagsAssessment(severe_chest_pain=RedFlagChoice.YES),
        symptoms=SymptomProfile(
            main_symptoms=["Chest pain", "Nausea"],
            severity=8
        ),
        vitals=VitalSigns(
            heart_rate=102,
            respiratory_rate=18,
            spo2=96.0,
            systolic_bp=None,  # MISSING BP
            diastolic_bp=None
        )
    )
    assessment = evaluate_triage(intake)
    assert assessment.priority in (PriorityLevel.RED, PriorityLevel.ORANGE)
    assert any("Blood pressure unavailable" in m or "Blood pressure not measured" in m for m in assessment.safety_eval.missing_information)
    assert assessment.safety_eval.requires_human_review


def test_completely_empty_vitals_handled_safely():
    """Verify that a patient with completely unrecorded vitals receives safety warnings and human review requirement."""
    intake = PatientIntake(
        patient_id="WC-003",
        age=45,
        sex="Male",
        chief_complaint="Feeling unwell and weak",
        symptoms=SymptomProfile(severity=5),
        vitals=VitalSigns()  # All vitals None
    )
    assessment = evaluate_triage(intake)
    assert assessment.safety_eval.requires_human_review
    assert len(assessment.safety_eval.missing_information) >= 4
    assert assessment.confidence_score < 0.70
