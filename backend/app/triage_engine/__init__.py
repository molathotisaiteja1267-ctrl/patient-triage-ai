"""
Triage Engine Package for PatientTriage.ai.
Main Entrypoint: evaluate_triage(intake: PatientIntake) -> TriageAssessment
"""

from datetime import datetime, timezone
from app.models import PatientIntake, TriageAssessment, UncertaintyLevel
from app.triage_engine.safety import evaluate_safety
from app.triage_engine.scoring import compute_triage_priority
from app.triage_engine.routing import determine_recommended_route
from app.triage_engine.explanations import generate_ai_explanation


def evaluate_triage(intake: PatientIntake) -> TriageAssessment:
    """
    Complete triage decision-support assessment pipeline:
    1. Safety & plausibility evaluation (Worst-case-first design)
    2. Rule & red flag scoring for priority tier
    3. Care pathway destination routing
    4. Explainable clinical reasoning, reassessment triggers & safety caveat generation
    """
    # 1. Safety analysis
    safety_eval = evaluate_safety(intake)

    # 2. Priority scoring & confidence
    priority, priority_label, confidence, risk_factors = compute_triage_priority(intake, safety_eval)

    # 3. Care pathway routing
    recommended_route = determine_recommended_route(intake, priority)

    # 4. Transparent explanations
    reasoning_bullets, safety_caveat = generate_ai_explanation(
        intake=intake,
        priority=priority,
        priority_label=priority_label,
        recommended_route=recommended_route,
        safety_eval=safety_eval,
        risk_factors=risk_factors
    )

    # 5. Uncertainty description
    unc_desc = "Low uncertainty: Physiological parameters and safety screening complete."
    if safety_eval.uncertainty_level == UncertaintyLevel.MODERATE:
        unc_desc = "Moderate uncertainty: Important arrival parameters or safety checks remain incomplete."
    elif safety_eval.uncertainty_level == UncertaintyLevel.HIGH:
        unc_desc = "High uncertainty: Critical vital signs or safety checks missing for presenting complaint. Bedside clinical review mandatory."
    elif safety_eval.uncertainty_level == UncertaintyLevel.CRITICAL:
        unc_desc = "Critical uncertainty: Implausible or conflicting clinical inputs detected."

    # 6. Reassessment triggers
    reassessment_triggers = [
        "Newly measured vital signs (e.g. SpO2 desaturation, systolic BP shifts, significant heart rate changes).",
        "Clinical symptom progression (worsening pain, increasing dyspnea, acute neurological changes).",
        "Discovery of previously unknown safety guards or newly revealed medical history."
    ]

    return TriageAssessment(
        priority=priority,
        priority_label=priority_label,
        recommended_route=recommended_route,
        confidence_score=confidence,
        uncertainty_level=safety_eval.uncertainty_level,
        uncertainty_description=unc_desc,
        safety_eval=safety_eval,
        reasoning_bullets=reasoning_bullets,
        key_risk_factors=risk_factors,
        reassessment_triggers=reassessment_triggers,
        safety_caveat=safety_caveat,
        generated_at=datetime.now(timezone.utc),
        engine_mode="Deterministic Decision Support Rule Engine"
    )
