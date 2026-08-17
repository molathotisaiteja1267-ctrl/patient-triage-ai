"""
Clinical Explanation Engine for PatientTriage.ai.
Generates structured, explainable clinical reasoning for decision support.
Enforces non-diagnostic, non-prescriptive guardrails.
Includes explanation of:
- Why this recommendation?
- What could change this recommendation?
- Qualitative uncertainty explanation.
"""

from typing import List, Tuple
from app.models import (
    PatientIntake,
    PriorityLevel,
    SafetyEvaluation,
    RedFlagChoice,
    UncertaintyLevel
)
from app.config import settings

MANDATORY_SAFETY_CAVEAT = (
    "PROTOTYPE DECISION SUPPORT ONLY — NOT A CLINICAL DIAGNOSIS. "
    "This system provides algorithmic triage prioritization assistance based on arrival parameters. "
    "Final prioritization and clinical decisions remain the responsibility of qualified healthcare professionals."
)


def generate_deterministic_explanation(
    intake: PatientIntake,
    priority: PriorityLevel,
    priority_label: str,
    recommended_route: str,
    safety_eval: SafetyEvaluation,
    risk_factors: List[str]
) -> Tuple[List[str], str]:
    """Generate structured, transparent clinical explanation bullets."""
    bullets = []
    vitals = intake.vitals
    symptoms = intake.symptoms
    rf = intake.red_flags

    # 1. Primary Recommendation Summary
    bullets.append(f"Recommended Priority Tier: {priority.value} ({priority_label}) -> Care Pathway: {recommended_route}")

    # 2. Immediate Safety Screen Findings
    confirmed_rfs = []
    if rf.airway_obstruction == RedFlagChoice.YES:
        confirmed_rfs.append("Airway compromise / obstruction")
    if rf.severe_dyspnea == RedFlagChoice.YES:
        confirmed_rfs.append("Severe respiratory distress")
    if rf.shock_poor_perfusion == RedFlagChoice.YES:
        confirmed_rfs.append("Signs of shock / circulatory compromise")
    if rf.severe_chest_pain == RedFlagChoice.YES:
        confirmed_rfs.append("Severe acute chest discomfort")
    if rf.loss_of_consciousness == RedFlagChoice.YES:
        confirmed_rfs.append("Documented loss of consciousness")
    if rf.altered_mental_status == RedFlagChoice.YES:
        confirmed_rfs.append("Acute confusion / altered mental state")
    if rf.seizure == RedFlagChoice.YES:
        confirmed_rfs.append("Active or recent seizure activity")
    if (
        rf.sudden_neurological_deficit == RedFlagChoice.YES or
        rf.acute_weakness_facial_droop == RedFlagChoice.YES or
        rf.acute_speech_difficulty == RedFlagChoice.YES
    ):
        confirmed_rfs.append("Sudden neurological deficit / possible stroke presentation")
    if rf.uncontrolled_bleeding == RedFlagChoice.YES:
        confirmed_rfs.append("Uncontrolled bleeding / active hemorrhage")
    if rf.severe_allergic_reaction == RedFlagChoice.YES:
        confirmed_rfs.append("Severe allergic reaction presentation")
    if rf.major_trauma == RedFlagChoice.YES:
        confirmed_rfs.append("Major trauma mechanism reported")
    if rf.severe_uncontrolled_pain == RedFlagChoice.YES:
        confirmed_rfs.append("Severe uncontrolled pain/distress")

    for crf in confirmed_rfs:
        bullets.append(f"Safety Concern: {crf}.")

    # 3. Key Physiological Drivers
    if vitals.spo2 is not None:
        if vitals.spo2 < 90:
            bullets.append(f"Critical oxygenation compromise: SpO2 measured at {vitals.spo2}%.")
        elif vitals.spo2 <= 93:
            bullets.append(f"Sub-optimal oxygen saturation: SpO2 measured at {vitals.spo2}%.")
        else:
            bullets.append(f"Recorded oxygen saturation: SpO2 {vitals.spo2}%.")

    if vitals.respiratory_rate is not None:
        if vitals.respiratory_rate > 30 or vitals.respiratory_rate < 10:
            bullets.append(f"Acute respiratory rate abnormality: {vitals.respiratory_rate} breaths/min.")

    if vitals.heart_rate is not None:
        if vitals.heart_rate > 120 or vitals.heart_rate < 50:
            bullets.append(f"Hemodynamic rate anomaly: Heart rate recorded at {vitals.heart_rate} bpm.")

    if vitals.systolic_bp is not None:
        if vitals.systolic_bp < 90 or vitals.systolic_bp >= 180:
            bullets.append(f"Blood pressure outside normal safety margin: {vitals.systolic_bp}/{vitals.diastolic_bp or '--'} mmHg.")

    if symptoms.consciousness_status.value != "Alert":
        bullets.append(f"Altered consciousness flagged: Patient is '{symptoms.consciousness_status.value}'.")

    if symptoms.severity >= 7 and not rf.severe_uncontrolled_pain == RedFlagChoice.YES:
        bullets.append(f"High acute pain/distress rating ({symptoms.severity}/10) with {symptoms.onset.lower()} onset.")

    # 4. Safety & Uncertainty Notifications
    if safety_eval.suspicious_values:
        for val in safety_eval.suspicious_values:
            bullets.append(f"SAFETY ALERT (Suspicious Data): {val}")

    if safety_eval.contradictions:
        for cont in safety_eval.contradictions:
            bullets.append(f"SAFETY ALERT (Inconsistent Input): {cont}")

    if safety_eval.missing_information:
        crit_missing = [m for m in safety_eval.missing_information if "CRITICAL" in m]
        if crit_missing:
            for m in crit_missing:
                bullets.append(f"SAFETY WARNING: {m}")
        else:
            bullets.append(f"Data Gaps: {len(safety_eval.missing_information)} vital parameter(s) unrecorded at intake.")

    if safety_eval.requires_human_review:
        bullets.append("CLINICAL REVIEW REQUIRED: Prompt human bedside clinical evaluation recommended.")

    return bullets, MANDATORY_SAFETY_CAVEAT


def generate_ai_explanation(
    intake: PatientIntake,
    priority: PriorityLevel,
    priority_label: str,
    recommended_route: str,
    safety_eval: SafetyEvaluation,
    risk_factors: List[str]
) -> Tuple[List[str], str]:
    """Generate structured explanations using LLM or deterministic fallback."""
    bullets, caveat = generate_deterministic_explanation(
        intake, priority, priority_label, recommended_route, safety_eval, risk_factors
    )

    if settings.GEMINI_API_KEY:
        try:
            import httpx
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
            prompt_text = (
                f"You are a clinical decision support assistant in an emergency department. "
                f"Provide 3-4 concise clinical reasoning bullets explaining why "
                f"Priority {priority.value} ({priority_label}) and route '{recommended_route}' were estimated. "
                f"NEVER diagnose, NEVER prescribe medication, and NEVER claim certainty. "
                f"Patient ID: {intake.patient_id}, Age: {intake.age}, Sex: {intake.sex}, Complaint: {intake.chief_complaint}. "
                f"Vitals: HR {intake.vitals.heart_rate}, RR {intake.vitals.respiratory_rate}, SpO2 {intake.vitals.spo2}%, BP {intake.vitals.systolic_bp}/{intake.vitals.diastolic_bp}. "
                f"Risk flags: {risk_factors}. Missing data: {safety_eval.missing_information}."
            )
            payload = {
                "contents": [{"parts": [{"text": prompt_text}]}],
                "generationConfig": {"temperature": 0.2, "maxOutputTokens": 250}
            }
            response = httpx.post(url, json=payload, timeout=3.0)
            if response.status_code == 200:
                data = response.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                custom_bullets = [
                    line.strip("- *").strip()
                    for line in text.strip().split("\n")
                    if line.strip() and not line.strip().startswith("#")
                ]
                if custom_bullets:
                    if safety_eval.requires_human_review:
                        custom_bullets.append("CLINICAL REVIEW REQUIRED: Immediate bedside clinician validation recommended.")
                    return custom_bullets, caveat
        except Exception:
            pass

    return bullets, caveat
