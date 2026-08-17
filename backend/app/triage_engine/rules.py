"""
Clinical Decision Rules & Safety Flag Definitions for PatientTriage.ai.
Transparent, explainable decision support adapted from emergency triage principles.
Decision-support prototype — NOT an autonomous diagnostic engine.
"""

from typing import List
from app.models import (
    PatientIntake,
    RedFlagChoice,
    ConsciousnessLevel,
    SpeechAbility,
    MobilityStatus
)


def check_red_flags(intake: PatientIntake) -> List[str]:
    """Identify immediate life-threatening emergency flags (RED Priority)."""
    flags = []
    vitals = intake.vitals
    symptoms = intake.symptoms
    rf = intake.red_flags
    complaint_lower = intake.chief_complaint.lower()
    symptoms_text = " ".join(symptoms.main_symptoms).lower() + " " + complaint_lower

    # 1. Airway / Breathing Immediate Safety Screen
    if rf.airway_obstruction == RedFlagChoice.YES:
        flags.append("IMMEDIATE RED FLAG: Airway obstruction / inability to maintain patent airway.")
    if rf.severe_dyspnea == RedFlagChoice.YES:
        flags.append("IMMEDIATE RED FLAG: Severe difficulty breathing / respiratory distress.")

    # 2. Circulation / Shock
    if rf.shock_poor_perfusion == RedFlagChoice.YES:
        flags.append("IMMEDIATE RED FLAG: Signs of shock / severe circulatory compromise.")
    if rf.uncontrolled_bleeding == RedFlagChoice.YES:
        flags.append("IMMEDIATE RED FLAG: Major uncontrolled bleeding.")

    # 3. Neurological
    if rf.loss_of_consciousness == RedFlagChoice.YES:
        flags.append("IMMEDIATE RED FLAG: Documented loss of consciousness / unresponsiveness.")
    if rf.seizure == RedFlagChoice.YES:
        flags.append("IMMEDIATE RED FLAG: Active or recent seizure activity.")

    # 4. Severe Cardiac Chest Pain with Hemodynamic Distress
    if rf.severe_chest_pain == RedFlagChoice.YES and (
        (vitals.heart_rate and (vitals.heart_rate > 115 or vitals.heart_rate < 50)) or
        (vitals.systolic_bp and (vitals.systolic_bp < 90 or vitals.systolic_bp > 190)) or
        (vitals.spo2 and vitals.spo2 < 93) or
        symptoms.severity >= 8
    ):
        flags.append("IMMEDIATE RED FLAG: Severe acute chest pain with high-risk physiological indicators.")

    # 5. Physiological Vital Signs Thresholds
    if vitals.spo2 is not None and vitals.spo2 < 88.0:
        flags.append(f"Critically low oxygen saturation (SpO2 {vitals.spo2}%) — Severe hypoxia")
    
    if vitals.respiratory_rate is not None and (vitals.respiratory_rate > 35 or vitals.respiratory_rate < 8):
        flags.append(f"Imminent respiratory compromise (Respiratory rate {vitals.respiratory_rate} breaths/min)")
        
    if symptoms.ability_to_speak == SpeechAbility.UNABLE and ("breath" in symptoms_text or "dyspnea" in symptoms_text or "choking" in symptoms_text or "stridor" in symptoms_text):
        flags.append("Severe respiratory distress with complete inability to speak")

    if vitals.systolic_bp is not None and vitals.systolic_bp < 80:
        flags.append(f"Severe hypotension / Impending shock (Systolic BP {vitals.systolic_bp} mmHg)")
        
    if vitals.heart_rate is not None and (vitals.heart_rate > 150 or vitals.heart_rate < 40):
        flags.append(f"Critical cardiac dysrhythmia risk (Heart rate {vitals.heart_rate} bpm)")

    if symptoms.consciousness_status == ConsciousnessLevel.UNRESPONSIVE:
        flags.append("Patient is unresponsive / profound altered consciousness")
        
    if vitals.gcs is not None and vitals.gcs <= 8:
        flags.append(f"Critical coma scale score (GCS {vitals.gcs} <= 8) — Airway reflex compromise")

    # 6. Severe Anaphylaxis with Airway/Circulatory Risk
    if rf.severe_allergic_reaction == RedFlagChoice.YES and (
        (vitals.spo2 is not None and vitals.spo2 < 94) or
        (vitals.systolic_bp is not None and vitals.systolic_bp < 95) or
        symptoms.ability_to_speak in (SpeechAbility.UNABLE, SpeechAbility.SINGLE_WORDS)
    ):
        flags.append("IMMEDIATE RED FLAG: Severe systemic allergic reaction with respiratory/circulatory compromise.")

    # 7. Major High-Energy Trauma with Unstable Vitals
    if rf.major_trauma == RedFlagChoice.YES and (
        (vitals.systolic_bp is not None and vitals.systolic_bp < 90) or
        (vitals.heart_rate is not None and vitals.heart_rate > 120) or
        (vitals.gcs is not None and vitals.gcs < 13)
    ):
        flags.append("IMMEDIATE RED FLAG: Major polytrauma with unstable physiological parameters.")

    return flags


def check_orange_flags(intake: PatientIntake) -> List[str]:
    """Identify very urgent, high-acuity danger flags (ORANGE Priority)."""
    flags = []
    vitals = intake.vitals
    symptoms = intake.symptoms
    rf = intake.red_flags
    complaint_lower = intake.chief_complaint.lower()
    symptoms_text = " ".join(symptoms.main_symptoms).lower() + " " + complaint_lower

    # Neurological deficit (Stroke / Focal signs)
    is_neuro = (
        rf.sudden_neurological_deficit == RedFlagChoice.YES or
        rf.acute_weakness_facial_droop == RedFlagChoice.YES or
        rf.acute_speech_difficulty == RedFlagChoice.YES
    )
    if is_neuro:
        flags.append("HIGH-RISK FLAG: Sudden neurological deficit / possible acute stroke symptoms.")

    if rf.altered_mental_status == RedFlagChoice.YES:
        flags.append("HIGH-RISK FLAG: New onset confusion or acute altered mental status.")

    if rf.severe_chest_pain == RedFlagChoice.YES and not any("Severe acute chest pain with" in f for f in check_red_flags(intake)):
        flags.append("HIGH-RISK FLAG: Severe acute chest discomfort requiring urgent clinical evaluation.")

    if rf.severe_allergic_reaction == RedFlagChoice.YES and not any("allergic reaction with" in f for f in check_red_flags(intake)):
        flags.append("HIGH-RISK FLAG: Severe allergic reaction presentation.")

    if rf.major_trauma == RedFlagChoice.YES and not any("Major polytrauma" in f for f in check_red_flags(intake)):
        flags.append("HIGH-RISK FLAG: Significant high-energy trauma mechanism.")

    if rf.severe_uncontrolled_pain == RedFlagChoice.YES or symptoms.severity >= 8:
        flags.append(f"HIGH-RISK FLAG: Severe acute distress/pain rating ({symptoms.severity}/10).")

    # Conditional Context-Specific Warnings
    if rf.pregnancy_warning_signs == RedFlagChoice.YES:
        flags.append("HIGH-RISK FLAG: Pregnancy / postpartum high-risk warning signs present.")
    if rf.pediatric_warning_signs == RedFlagChoice.YES:
        flags.append("HIGH-RISK FLAG: Pediatric warning signs present.")

    # 1. Hypoxia / Respiratory Strain
    if vitals.spo2 is not None and 88.0 <= vitals.spo2 <= 93.0:
        flags.append(f"Concerning oxygen saturation (SpO2 {vitals.spo2}%)")
        
    if vitals.respiratory_rate is not None and (26 <= vitals.respiratory_rate <= 35 or 8 <= vitals.respiratory_rate <= 10):
        flags.append(f"Abnormal respiratory rate ({vitals.respiratory_rate} breaths/min)")
        
    if symptoms.ability_to_speak in (SpeechAbility.SINGLE_WORDS, SpeechAbility.SHORT_PHRASES):
        if "breath" in symptoms_text or "chest" in symptoms_text or "asthma" in symptoms_text:
            flags.append("Significant work of breathing (limited to short phrases/words)")

    # 2. Hemodynamic / Cardiac Warning Signs
    if vitals.systolic_bp is not None and ((80 <= vitals.systolic_bp <= 90) or vitals.systolic_bp >= 200):
        flags.append(f"Critical blood pressure range (Systolic BP {vitals.systolic_bp} mmHg)")
        
    if vitals.heart_rate is not None and ((121 <= vitals.heart_rate <= 150) or (40 <= vitals.heart_rate <= 49)):
        flags.append(f"Significant tachycardia/bradycardia (Heart rate {vitals.heart_rate} bpm)")

    # 3. Altered Consciousness
    if symptoms.consciousness_status in (ConsciousnessLevel.RESPONDS_TO_VOICE, ConsciousnessLevel.RESPONDS_TO_PAIN):
        flags.append(f"Depressed consciousness level ({symptoms.consciousness_status.value})")
        
    if vitals.gcs is not None and 9 <= vitals.gcs <= 13:
        flags.append(f"Moderate neurological impairment (GCS {vitals.gcs})")

    # 4. Severe Temperature
    if vitals.temperature is not None and (vitals.temperature >= 39.5 or vitals.temperature < 35.0):
        flags.append(f"Extreme body temperature ({vitals.temperature}°C)")

    return flags


def check_yellow_flags(intake: PatientIntake) -> List[str]:
    """Identify urgent conditions requiring timely assessment (YELLOW Priority)."""
    flags = []
    vitals = intake.vitals
    symptoms = intake.symptoms
    complaint_lower = intake.chief_complaint.lower()
    symptoms_text = " ".join(symptoms.main_symptoms).lower() + " " + complaint_lower

    if vitals.spo2 is not None and 94.0 <= vitals.spo2 <= 95.0:
        flags.append(f"Borderline oxygen saturation (SpO2 {vitals.spo2}%)")

    if vitals.heart_rate is not None and 101 <= vitals.heart_rate <= 120:
        flags.append(f"Moderate tachycardia (Heart rate {vitals.heart_rate} bpm)")

    if vitals.systolic_bp is not None and 160 <= vitals.systolic_bp < 200:
        flags.append(f"Elevated systolic BP ({vitals.systolic_bp} mmHg)")

    if vitals.temperature is not None and 38.3 <= vitals.temperature < 39.5:
        flags.append(f"Significant fever ({vitals.temperature}°C)")

    if 5 <= symptoms.severity <= 7:
        flags.append(f"Moderate pain severity ({symptoms.severity}/10)")

    if "abdominal pain" in symptoms_text or "vomiting" in symptoms_text or "fracture" in symptoms_text or "burn" in symptoms_text or "infection" in symptoms_text:
        flags.append(f"Clinical condition requiring timely workup ({intake.chief_complaint})")

    return flags


def check_green_flags(intake: PatientIntake) -> List[str]:
    """Identify less urgent, stable conditions (GREEN Priority)."""
    flags = []
    complaint_lower = intake.chief_complaint.lower()
    symptoms = intake.symptoms
    symptoms_text = " ".join(symptoms.main_symptoms).lower() + " " + complaint_lower if symptoms else complaint_lower

    low_acuity_keywords = [
        "minor laceration", "small cut", "sore throat", "mild sprain", "earache",
        "mild cough", "rash", "cold symptoms", "abrasion", "suture removal",
        "mild back strain", "routine dressing change", "mild ankle pain"
    ]
    for kw in low_acuity_keywords:
        if kw in symptoms_text:
            flags.append(f"Low acuity presentation ({kw})")
            break
    return flags
