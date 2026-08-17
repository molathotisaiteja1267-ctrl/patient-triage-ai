"""
Unit tests for Triage Engine (rules, scoring, routing, explanations).
"""

import pytest
from app.models import (
    PatientIntake,
    VitalSigns,
    SymptomProfile,
    MedicalHistory,
    RedFlagsAssessment,
    RedFlagChoice,
    PriorityLevel,
    ConsciousnessLevel,
    SpeechAbility,
    MobilityStatus
)
from app.triage_engine import evaluate_triage


def test_critical_patient_red_priority():
    """Test that a patient with severe respiratory failure and hypoxia receives RED priority."""
    intake = PatientIntake(
        patient_id="TEST-001",
        age=65,
        sex="Male",
        chief_complaint="Severe shortness of breath, gasping, cyanosis",
        red_flags=RedFlagsAssessment(
            severe_dyspnea=RedFlagChoice.YES,
            severe_chest_pain=RedFlagChoice.NO
        ),
        symptoms=SymptomProfile(
            main_symptoms=["Severe dyspnea", "Accessory muscle use"],
            severity=10,
            onset="Sudden",
            ability_to_speak=SpeechAbility.SINGLE_WORDS,
            ability_to_walk=MobilityStatus.UNABLE_STRETCHER
        ),
        vitals=VitalSigns(
            heart_rate=142,
            respiratory_rate=36,
            spo2=83.0,
            systolic_bp=82,
            diastolic_bp=50,
            temperature=37.2,
            gcs=13
        )
    )
    assessment = evaluate_triage(intake)
    assert assessment.priority == PriorityLevel.RED
    assert "Resuscitation" in assessment.recommended_route
    assert len(assessment.reasoning_bullets) >= 2
    assert "PROTOTYPE DECISION SUPPORT ONLY" in assessment.safety_caveat


def test_suspected_stroke_orange_priority():
    """Test that a patient with acute sudden stroke symptoms receives ORANGE priority."""
    intake = PatientIntake(
        patient_id="TEST-002",
        age=70,
        sex="Female",
        chief_complaint="Sudden right arm weakness and slurred speech",
        red_flags=RedFlagsAssessment(
            acute_weakness_facial_droop=RedFlagChoice.YES,
            acute_speech_difficulty=RedFlagChoice.YES
        ),
        symptoms=SymptomProfile(
            main_symptoms=["Right facial droop", "Dysarthria", "Hemiparesis"],
            severity=8,
            onset="Sudden",
            ability_to_speak=SpeechAbility.SHORT_PHRASES,
            ability_to_walk=MobilityStatus.WITH_ASSISTANCE
        ),
        vitals=VitalSigns(
            heart_rate=92,
            respiratory_rate=18,
            spo2=97.0,
            systolic_bp=195,
            diastolic_bp=105,
            temperature=36.8,
            gcs=14
        )
    )
    assessment = evaluate_triage(intake)
    assert assessment.priority == PriorityLevel.ORANGE
    assert "Stroke" in assessment.recommended_route or "High-Acuity" in assessment.recommended_route


def test_urgent_abdominal_pain_yellow_priority():
    """Test that a patient with moderate-severe abdominal pain & fever receives YELLOW priority."""
    intake = PatientIntake(
        patient_id="TEST-003",
        age=33,
        sex="Male",
        chief_complaint="Lower right quadrant abdominal pain and vomiting",
        symptoms=SymptomProfile(
            main_symptoms=["RLQ tenderness", "Nausea", "Vomiting"],
            severity=6,
            onset="Gradual",
            ability_to_speak=SpeechAbility.NORMAL,
            ability_to_walk=MobilityStatus.WITH_ASSISTANCE
        ),
        vitals=VitalSigns(
            heart_rate=105,
            respiratory_rate=18,
            spo2=98.0,
            systolic_bp=128,
            diastolic_bp=82,
            temperature=38.4,
            gcs=15
        )
    )
    assessment = evaluate_triage(intake)
    assert assessment.priority in (PriorityLevel.YELLOW, PriorityLevel.ORANGE)
    assert "ED Main Treatment" in assessment.recommended_route or "Emergency Department" in assessment.recommended_route


def test_minor_laceration_green_priority():
    """Test that a patient with a minor forearm cut and normal vitals receives GREEN priority."""
    intake = PatientIntake(
        patient_id="TEST-004",
        age=25,
        sex="Male",
        chief_complaint="Minor laceration to left forearm, bleeding stopped",
        red_flags=RedFlagsAssessment(
            uncontrolled_bleeding=RedFlagChoice.NO,
            severe_uncontrolled_pain=RedFlagChoice.NO
        ),
        symptoms=SymptomProfile(
            main_symptoms=["Small cut", "Mild local pain"],
            severity=3,
            onset="Sudden",
            ability_to_speak=SpeechAbility.NORMAL,
            ability_to_walk=MobilityStatus.INDEPENDENT
        ),
        vitals=VitalSigns(
            heart_rate=72,
            respiratory_rate=14,
            spo2=99.0,
            systolic_bp=120,
            diastolic_bp=75,
            temperature=36.7,
            gcs=15
        )
    )
    assessment = evaluate_triage(intake)
    assert assessment.priority == PriorityLevel.GREEN
    assert "Fast-Track" in assessment.recommended_route


def test_non_emergency_routine_refill_blue_priority():
    """Test that a stable chronic patient requesting prescription refill receives BLUE priority."""
    intake = PatientIntake(
        patient_id="TEST-005",
        age=45,
        sex="Female",
        chief_complaint="Routine blood pressure medication prescription refill",
        symptoms=SymptomProfile(
            main_symptoms=["None", "Asymptomatic"],
            severity=1,
            onset="Gradual",
            ability_to_speak=SpeechAbility.NORMAL,
            ability_to_walk=MobilityStatus.INDEPENDENT
        ),
        vitals=VitalSigns(
            heart_rate=70,
            respiratory_rate=14,
            spo2=99.0,
            systolic_bp=122,
            diastolic_bp=78,
            temperature=36.6,
            gcs=15
        )
    )
    assessment = evaluate_triage(intake)
    assert assessment.priority == PriorityLevel.BLUE
    assert "Alternative" in assessment.recommended_route or "Sub-Acute" in assessment.recommended_route
