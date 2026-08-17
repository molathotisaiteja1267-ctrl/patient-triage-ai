"""
Unit tests for Safety Engine (physiological checks, contradictions, missing data, red flags).
"""

import pytest
from app.models import (
    PatientIntake,
    VitalSigns,
    SymptomProfile,
    RedFlagsAssessment,
    RedFlagChoice,
    ConsciousnessLevel,
    MobilityStatus,
    SpeechAbility,
    UncertaintyLevel
)
from app.triage_engine.safety import evaluate_safety


def test_impossible_vital_signs_detected():
    """Test that physiologically implausible vital signs are caught and flagged as suspicious."""
    intake = PatientIntake(
        patient_id="SAFE-001",
        age=30,
        sex="Male",
        chief_complaint="Palpitations",
        symptoms=SymptomProfile(),
        vitals=VitalSigns(
            heart_rate=380,        # Outlier
            respiratory_rate=80,   # Outlier
            spo2=115.0,            # Outlier
            systolic_bp=350,       # Outlier
            temperature=48.0       # Outlier
        )
    )
    safety = evaluate_safety(intake)
    assert not safety.safe_to_recommend
    assert safety.requires_human_review
    assert len(safety.suspicious_values) >= 4
    assert safety.uncertainty_level == UncertaintyLevel.CRITICAL


def test_contradictory_clinical_data_detected():
    """Test that mutually exclusive patient states (e.g. Unresponsive + Walking) are detected."""
    intake = PatientIntake(
        patient_id="SAFE-002",
        age=40,
        sex="Female",
        chief_complaint="Headache",
        red_flags=RedFlagsAssessment(
            loss_of_consciousness=RedFlagChoice.YES
        ),
        symptoms=SymptomProfile(
            consciousness_status=ConsciousnessLevel.UNRESPONSIVE,
            ability_to_walk=MobilityStatus.INDEPENDENT,
            ability_to_speak=SpeechAbility.NORMAL
        ),
        vitals=VitalSigns(
            heart_rate=75,
            respiratory_rate=16,
            spo2=99.0,
            systolic_bp=120,
            diastolic_bp=80,
            gcs=15
        )
    )
    safety = evaluate_safety(intake)
    assert not safety.safe_to_recommend
    assert safety.requires_human_review
    assert len(safety.contradictions) >= 2


def test_bp_inversion_detected():
    """Test that systolic BP <= diastolic BP is caught as a physiological contradiction."""
    intake = PatientIntake(
        patient_id="SAFE-003",
        age=50,
        sex="Male",
        chief_complaint="Dizziness",
        symptoms=SymptomProfile(),
        vitals=VitalSigns(
            heart_rate=80,
            systolic_bp=70,
            diastolic_bp=90  # SBP < DBP
        )
    )
    safety = evaluate_safety(intake)
    assert any("Systolic BP (70) must exceed Diastolic BP (90)" in c for c in safety.contradictions)
    assert safety.requires_human_review


def test_missing_critical_vitals_elevates_uncertainty():
    """Test that missing SpO2 during respiratory complaint flags critical missing info."""
    intake = PatientIntake(
        patient_id="SAFE-004",
        age=60,
        sex="Male",
        chief_complaint="Severe shortness of breath and wheezing",
        red_flags=RedFlagsAssessment(severe_dyspnea=RedFlagChoice.YES),
        symptoms=SymptomProfile(
            main_symptoms=["Dyspnea", "Wheezing"],
            severity=7
        ),
        vitals=VitalSigns(
            heart_rate=98,
            respiratory_rate=24,
            spo2=None,  # MISSING
            systolic_bp=140,
            diastolic_bp=85
        )
    )
    safety = evaluate_safety(intake)
    assert any("SpO2 unavailable — respiratory risk cannot be reliably assessed" in m for m in safety.missing_information)
    assert safety.requires_human_review
    assert safety.uncertainty_level in (UncertaintyLevel.HIGH, UncertaintyLevel.CRITICAL)
