"""
Care Pathway and Destination Routing Logic for PatientTriage.ai.
Recommends emergency department zone/pathway, NOT specific medical treatments.
Always emphasizes clinician confirmation.
"""

from app.models import PatientIntake, PriorityLevel


def determine_recommended_route(intake: PatientIntake, priority: PriorityLevel) -> str:
    """Recommend an appropriate hospital ED zone or care pathway based on acuity and presentation."""
    complaint_lower = intake.chief_complaint.lower()
    symptoms_text = " ".join(intake.symptoms.main_symptoms).lower() + " " + complaint_lower

    if priority == PriorityLevel.RED:
        return "Resuscitation Bay / Immediate Critical Care"

    if priority == PriorityLevel.ORANGE:
        if "stroke" in symptoms_text or "facial droop" in symptoms_text or "slurred" in symptoms_text:
            return "Acute Stroke Rapid Assessment Unit"
        if "chest pain" in symptoms_text or "cardiac" in symptoms_text:
            return "Monitored Cardiac / High-Acuity Bay"
        if intake.age < 16:
            return "Pediatric High-Acuity Emergency Area"
        return "High-Acuity Acute Care Area"

    if priority == PriorityLevel.YELLOW:
        if "fracture" in symptoms_text or "ortho" in symptoms_text or "dislocation" in symptoms_text:
            return "ED Main Treatment (Ortho / Procedural)"
        if "abdominal" in symptoms_text or "vomiting" in symptoms_text:
            return "ED Main Treatment (General Acute)"
        if intake.age < 16:
            return "Pediatric Emergency Treatment Area"
        return "Emergency Department Main Treatment"

    if priority == PriorityLevel.GREEN:
        if "cut" in symptoms_text or "laceration" in symptoms_text or "wound" in symptoms_text or "sprain" in symptoms_text:
            return "Fast-Track / Minor Injury Unit"
        return "Fast-Track / Ambulatory Care Area"

    if priority == PriorityLevel.BLUE:
        return "Sub-Acute / Primary Care Alternative Pathway"

    return "General Assessment / Observation"
