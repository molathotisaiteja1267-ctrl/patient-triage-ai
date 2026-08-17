"""
Safety Engine for PatientTriage.ai.
Implements the Worst-Case-First Clinical Safety Screen:
- Physiological plausibility bounds checking
- Missing data flagging (never assuming normal vitals)
- Contradictory clinical data detection
- 12 Core immediate safety screening guards
- UNKNOWN != NO handling (elevating clinical uncertainty)
"""

from typing import List
from app.models import (
    PatientIntake,
    SafetyEvaluation,
    UncertaintyLevel,
    ConsciousnessLevel,
    MobilityStatus,
    SpeechAbility,
    RedFlagChoice
)

PHYSIOLOGICAL_LIMITS = {
    "heart_rate": (20, 300, "bpm"),
    "respiratory_rate": (4, 70, "breaths/min"),
    "spo2": (40.0, 100.0, "%"),
    "systolic_bp": (30, 300, "mmHg"),
    "diastolic_bp": (20, 200, "mmHg"),
    "temperature": (25.0, 45.0, "°C"),
    "gcs": (3, 15, "score")
}


def evaluate_safety(intake: PatientIntake) -> SafetyEvaluation:
    """Perform rigorous worst-case-first clinical safety analysis."""
    vitals = intake.vitals
    symptoms = intake.symptoms
    rf = intake.red_flags
    complaint_lower = intake.chief_complaint.lower()
    symptoms_text = " ".join(symptoms.main_symptoms).lower() + " " + complaint_lower

    risk_flags: List[str] = []
    missing_info: List[str] = []
    suspicious_values: List[str] = []
    contradictions: List[str] = []
    uncertainty_reasons: List[str] = []

    # -------------------------------------------------------------
    # 1. 12 Core Immediate Safety Screening Guards
    # -------------------------------------------------------------
    active_red_flags = []

    # A. Airway / Breathing
    if rf.airway_obstruction == RedFlagChoice.YES:
        active_red_flags.append("Airway obstruction / inability to maintain airway")
    if rf.severe_dyspnea == RedFlagChoice.YES:
        active_red_flags.append("Severe difficulty breathing")

    # B. Circulation / Perfusion
    if rf.shock_poor_perfusion == RedFlagChoice.YES:
        active_red_flags.append("Signs of shock / poor perfusion")

    # C. Cardiac
    if rf.severe_chest_pain == RedFlagChoice.YES:
        active_red_flags.append("Severe acute chest pain / pressure")

    # D. Neurological
    if rf.loss_of_consciousness == RedFlagChoice.YES:
        active_red_flags.append("Loss of consciousness / unresponsiveness")
    if rf.altered_mental_status == RedFlagChoice.YES:
        active_red_flags.append("New confusion / altered mental status")
    if rf.seizure == RedFlagChoice.YES:
        active_red_flags.append("Active or recent seizure")
    
    # Combined Neurological Deficit (and backward compatibility check)
    is_neuro_deficit = (
        rf.sudden_neurological_deficit == RedFlagChoice.YES or
        rf.acute_weakness_facial_droop == RedFlagChoice.YES or
        rf.acute_speech_difficulty == RedFlagChoice.YES
    )
    if is_neuro_deficit:
        active_red_flags.append("Sudden neurological deficit / possible stroke symptoms")

    # E. Bleeding
    if rf.uncontrolled_bleeding == RedFlagChoice.YES:
        active_red_flags.append("Uncontrolled bleeding")

    # F. Allergic
    if rf.severe_allergic_reaction == RedFlagChoice.YES:
        active_red_flags.append("Severe allergic reaction")

    # G. Trauma
    if rf.major_trauma == RedFlagChoice.YES:
        active_red_flags.append("Major trauma")

    # H. Severe Pain
    if rf.severe_uncontrolled_pain == RedFlagChoice.YES:
        active_red_flags.append("Severe uncontrolled pain / distress")

    # Conditional Context-Specific Warnings
    if rf.pregnancy_warning_signs == RedFlagChoice.YES:
        active_red_flags.append("Pregnancy / postpartum warning signs flagged")
    if rf.pediatric_warning_signs == RedFlagChoice.YES:
        active_red_flags.append("Pediatric warning signs flagged")
    if rf.trauma_warning_details == RedFlagChoice.YES:
        active_red_flags.append("Trauma severity detail warning flagged")
    if rf.stroke_warning_details == RedFlagChoice.YES:
        active_red_flags.append("Acute stroke warning detail flagged")

    for arf in active_red_flags:
        risk_flags.append(f"Safety Concern: {arf}")

    # -------------------------------------------------------------
    # 2. Count Unknown Safety Screening Items (UNKNOWN != NO)
    # -------------------------------------------------------------
    core_flags_values = [
        rf.airway_obstruction,
        rf.severe_dyspnea,
        rf.shock_poor_perfusion,
        rf.severe_chest_pain,
        rf.loss_of_consciousness,
        rf.altered_mental_status,
        rf.seizure,
        rf.sudden_neurological_deficit,
        rf.uncontrolled_bleeding,
        rf.severe_allergic_reaction,
        rf.major_trauma,
        rf.severe_uncontrolled_pain
    ]
    num_unknown_flags = sum(1 for v in core_flags_values if v == RedFlagChoice.UNKNOWN)
    if num_unknown_flags > 0:
        missing_info.append(f"{num_unknown_flags} safety screening guard(s) marked as UNKNOWN.")
        if num_unknown_flags >= 2:
            uncertainty_reasons.append(f"Safety screening incomplete ({num_unknown_flags} unknown items).")

    # -------------------------------------------------------------
    # 3. Physiological Plausibility & Impossible Values Check
    # -------------------------------------------------------------
    if vitals.heart_rate is not None:
        min_v, max_v, unit = PHYSIOLOGICAL_LIMITS["heart_rate"]
        if vitals.heart_rate < min_v or vitals.heart_rate > max_v:
            suspicious_values.append(
                f"Heart rate {vitals.heart_rate} {unit} is outside plausible human range ({min_v}–{max_v} {unit})."
            )
            
    if vitals.respiratory_rate is not None:
        min_v, max_v, unit = PHYSIOLOGICAL_LIMITS["respiratory_rate"]
        if vitals.respiratory_rate < min_v or vitals.respiratory_rate > max_v:
            suspicious_values.append(
                f"Respiratory rate {vitals.respiratory_rate} {unit} is outside plausible range ({min_v}–{max_v} {unit})."
            )
            
    if vitals.spo2 is not None:
        min_v, max_v, unit = PHYSIOLOGICAL_LIMITS["spo2"]
        if vitals.spo2 < min_v or vitals.spo2 > max_v:
            suspicious_values.append(
                f"SpO2 {vitals.spo2}% is outside plausible range ({min_v}–{max_v}%)."
            )
            
    if vitals.systolic_bp is not None:
        min_v, max_v, unit = PHYSIOLOGICAL_LIMITS["systolic_bp"]
        if vitals.systolic_bp < min_v or vitals.systolic_bp > max_v:
            suspicious_values.append(
                f"Systolic BP {vitals.systolic_bp} {unit} is outside plausible range ({min_v}–{max_v} {unit})."
            )
            
    if vitals.diastolic_bp is not None:
        min_v, max_v, unit = PHYSIOLOGICAL_LIMITS["diastolic_bp"]
        if vitals.diastolic_bp < min_v or vitals.diastolic_bp > max_v:
            suspicious_values.append(
                f"Diastolic BP {vitals.diastolic_bp} {unit} is outside plausible range ({min_v}–{max_v} {unit})."
            )
            
    if vitals.temperature is not None:
        min_v, max_v, unit = PHYSIOLOGICAL_LIMITS["temperature"]
        if vitals.temperature < min_v or vitals.temperature > max_v:
            suspicious_values.append(
                f"Temperature {vitals.temperature}°C is outside plausible survival range ({min_v}–{max_v}°C)."
            )
            
    if vitals.gcs is not None:
        min_v, max_v, unit = PHYSIOLOGICAL_LIMITS["gcs"]
        if vitals.gcs < min_v or vitals.gcs > max_v:
            suspicious_values.append(
                f"GCS score {vitals.gcs} is invalid (Valid Glasgow Coma Scale range is 3–15)."
            )

    # -------------------------------------------------------------
    # 4. Missing Critical Data Handling (Never Assume Normal)
    # -------------------------------------------------------------
    if vitals.spo2 is None:
        if rf.severe_dyspnea == RedFlagChoice.YES or any(w in symptoms_text for w in ["breath", "dyspnea", "asthma", "cough", "chest pain", "choking", "stridor"]):
            missing_info.append("CRITICAL: SpO2 unavailable — respiratory risk cannot be reliably assessed.")
            risk_flags.append("Missing oxygen saturation in patient with respiratory/chest symptoms.")
        else:
            missing_info.append("SpO2 not measured at intake.")
            
    if vitals.systolic_bp is None:
        if rf.severe_chest_pain == RedFlagChoice.YES or rf.uncontrolled_bleeding == RedFlagChoice.YES or rf.shock_poor_perfusion == RedFlagChoice.YES or any(w in symptoms_text for w in ["dizziness", "syncope", "chest pain", "bleed", "trauma", "weakness"]):
            missing_info.append("CRITICAL: Blood pressure unavailable — hemodynamic stability cannot be verified.")
            risk_flags.append("Missing blood pressure in high-risk hemodynamic presentation.")
        else:
            missing_info.append("Blood pressure not measured.")

    if vitals.heart_rate is None:
        missing_info.append("Heart rate not measured.")

    if vitals.respiratory_rate is None:
        missing_info.append("Respiratory rate not measured.")

    if vitals.temperature is None and any(w in symptoms_text for w in ["fever", "chills", "infection", "shivering", "lethargy"]):
        missing_info.append("Temperature not measured in potential febrile presentation.")

    # -------------------------------------------------------------
    # 5. Contradictory Clinical Data Detection
    # -------------------------------------------------------------
    if symptoms.consciousness_status == ConsciousnessLevel.UNRESPONSIVE or rf.loss_of_consciousness == RedFlagChoice.YES:
        if symptoms.ability_to_walk == MobilityStatus.INDEPENDENT:
            contradictions.append(
                "Clinical Conflict: Patient marked as 'Unresponsive / Loss of Consciousness' but mobility is recorded as 'Independent'."
            )
        if symptoms.ability_to_speak == SpeechAbility.NORMAL:
            contradictions.append(
                "Clinical Conflict: Patient marked as 'Unresponsive' but speech is recorded as 'Normal'."
            )
        if vitals.gcs is not None and vitals.gcs >= 14:
            contradictions.append(
                f"Clinical Conflict: Patient marked as 'Unresponsive' but GCS is {vitals.gcs} (Alert/Normal)."
            )

    if symptoms.consciousness_status == ConsciousnessLevel.ALERT and vitals.gcs is not None and vitals.gcs <= 8:
        contradictions.append(
            f"Clinical Conflict: Patient marked as 'Alert' but GCS score is critically low ({vitals.gcs})."
        )

    if vitals.systolic_bp is not None and vitals.diastolic_bp is not None:
        if vitals.systolic_bp <= vitals.diastolic_bp:
            contradictions.append(
                f"Physiological Conflict: Systolic BP ({vitals.systolic_bp}) must exceed Diastolic BP ({vitals.diastolic_bp})."
            )

    # -------------------------------------------------------------
    # 6. Qualitative Uncertainty & Review Determination
    # -------------------------------------------------------------
    safe_to_recommend = True
    requires_human_review = False
    uncertainty_level = UncertaintyLevel.LOW

    if active_red_flags:
        requires_human_review = True
        uncertainty_reasons.append(f"{len(active_red_flags)} immediate safety concern(s) flagged.")

    if suspicious_values:
        safe_to_recommend = False
        requires_human_review = True
        uncertainty_level = UncertaintyLevel.CRITICAL
        uncertainty_reasons.append("Physiologically implausible vital signs detected.")

    if contradictions:
        safe_to_recommend = False
        requires_human_review = True
        uncertainty_level = UncertaintyLevel.CRITICAL
        uncertainty_reasons.append("Conflicting clinical inputs detected.")

    critical_missing = [m for m in missing_info if "CRITICAL" in m]
    if critical_missing:
        requires_human_review = True
        if uncertainty_level != UncertaintyLevel.CRITICAL:
            uncertainty_level = UncertaintyLevel.HIGH
        uncertainty_reasons.append("Critical vital signs missing for presenting complaint.")
    elif num_unknown_flags >= 4 or len(missing_info) >= 4:
        requires_human_review = True
        if uncertainty_level == UncertaintyLevel.LOW:
            uncertainty_level = UncertaintyLevel.HIGH
        uncertainty_reasons.append("Multiple physiological parameters or safety checks incomplete.")
    elif num_unknown_flags >= 2 or len(missing_info) >= 2:
        if uncertainty_level == UncertaintyLevel.LOW:
            uncertainty_level = UncertaintyLevel.MODERATE
        uncertainty_reasons.append("Key arrival information incomplete.")

    return SafetyEvaluation(
        safe_to_recommend=safe_to_recommend,
        requires_human_review=requires_human_review,
        risk_flags=risk_flags,
        missing_information=missing_info,
        suspicious_values=suspicious_values,
        contradictions=contradictions,
        uncertainty_level=uncertainty_level,
        uncertainty_reason="; ".join(uncertainty_reasons) if uncertainty_reasons else None
    )
