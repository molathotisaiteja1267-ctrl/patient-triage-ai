"""
Triage Scoring & Priority Determination Engine for PatientTriage.ai.
Combines rule-based clinical flags and worst-case safety constraints.
"""

from typing import Tuple, List
from app.models import (
    PatientIntake,
    PriorityLevel,
    SafetyEvaluation,
    UncertaintyLevel,
    RedFlagChoice
)
from app.triage_engine.rules import (
    check_red_flags,
    check_orange_flags,
    check_yellow_flags,
    check_green_flags
)


PRIORITY_LABELS = {
    PriorityLevel.RED: "Immediate (Life-Threatening)",
    PriorityLevel.ORANGE: "Very Urgent (High Risk)",
    PriorityLevel.YELLOW: "Urgent (Timely Assessment)",
    PriorityLevel.GREEN: "Less Urgent (Stable Presentation)",
    PriorityLevel.BLUE: "Non-Emergency (Alternative Care)"
}


def compute_triage_priority(
    intake: PatientIntake,
    safety_eval: SafetyEvaluation
) -> Tuple[PriorityLevel, str, float, List[str]]:
    """
    Calculate triage priority level, descriptive label, confidence score, and primary risk factors.
    Guarantees worst-case-first handling so missing data cannot falsely downgrade acuity.
    """
    red_flags = check_red_flags(intake)
    orange_flags = check_orange_flags(intake)
    yellow_flags = check_yellow_flags(intake)
    green_flags = check_green_flags(intake)

    risk_factors: List[str] = []
    
    # 1. Base Priority Calculation
    if red_flags:
        priority = PriorityLevel.RED
        risk_factors.extend(red_flags)
    elif orange_flags:
        priority = PriorityLevel.ORANGE
        risk_factors.extend(orange_flags)
    elif yellow_flags:
        priority = PriorityLevel.YELLOW
        risk_factors.extend(yellow_flags)
    elif green_flags:
        priority = PriorityLevel.GREEN
        risk_factors.extend(green_flags)
    else:
        # Default assessment based on symptoms & pain
        if intake.symptoms.severity >= 8:
            priority = PriorityLevel.ORANGE
            risk_factors.append(f"Severe reported distress/pain ({intake.symptoms.severity}/10)")
        elif intake.symptoms.severity >= 4:
            priority = PriorityLevel.YELLOW
            risk_factors.append(f"Moderate reported distress/pain ({intake.symptoms.severity}/10)")
        elif intake.symptoms.severity <= 2:
            priority = PriorityLevel.BLUE
            risk_factors.append("Low symptom severity with stable clinical baseline")
        else:
            priority = PriorityLevel.GREEN
            risk_factors.append("Mild symptom presentation")

    # Add safety risk flags
    if safety_eval.risk_flags:
        for rf in safety_eval.risk_flags:
            if rf not in risk_factors:
                risk_factors.append(rf)

    # 2. Worst-Case Safety Escalation (Never Downgrade on Missing Data)
    complaint_lower = intake.chief_complaint.lower()
    is_cardiac_or_respiratory = (
        intake.red_flags.severe_dyspnea == RedFlagChoice.YES or
        intake.red_flags.severe_chest_pain == RedFlagChoice.YES or
        any(w in complaint_lower or any(w in s.lower() for s in intake.symptoms.main_symptoms)
            for w in ["chest pain", "breath", "dyspnea", "asthma", "heart", "palpitation"])
    )
    
    if is_cardiac_or_respiratory:
        has_missing_critical = any("CRITICAL" in m for m in safety_eval.missing_information)
        if has_missing_critical:
            if priority in (PriorityLevel.GREEN, PriorityLevel.BLUE):
                priority = PriorityLevel.ORANGE
                risk_factors.append(
                    "Safety Escalation: Acuity elevated to ORANGE due to missing critical vitals in cardiac/respiratory presentation."
                )

    # 3. Confidence Score Calculation
    base_confidence = 0.95
    if red_flags:
        base_confidence = 0.92
    elif orange_flags:
        base_confidence = 0.88
    elif yellow_flags:
        base_confidence = 0.85
    else:
        base_confidence = 0.82

    # Deductions for missing vitals
    num_missing = len(safety_eval.missing_information)
    base_confidence -= min(0.35, num_missing * 0.07)

    # Deductions for suspicious / contradictory data
    if safety_eval.suspicious_values:
        base_confidence = min(base_confidence, 0.40)
    if safety_eval.contradictions:
        base_confidence = min(base_confidence, 0.35)

    if safety_eval.uncertainty_level == UncertaintyLevel.HIGH:
        base_confidence = min(base_confidence, 0.60)
    elif safety_eval.uncertainty_level == UncertaintyLevel.CRITICAL:
        base_confidence = min(base_confidence, 0.30)

    final_confidence = max(0.15, min(0.98, round(base_confidence, 2)))
    priority_label = PRIORITY_LABELS.get(priority, priority.value)

    return priority, priority_label, final_confidence, risk_factors
