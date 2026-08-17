# Contributing to PatientTriage.ai

Thank you for your interest in contributing to **PatientTriage.ai**!

## Clinical AI Development Standards

1. **"AI Recommends, Humans Decide"**: No code may automate patient treatment, diagnostic assertion, or bypass clinician confirmation.
2. **Worst-Case-First Safety**: Missing or ambiguous patient inputs must never lead to false reassurance or acuity downgrading.
3. **Synthetic Data Only**: Never commit or test with Real Protected Health Information (PHI). All data must be 100% synthetic.
4. **Test Coverage**: Any modifications to the safety engine or triage rules must be accompanied by automated tests in `backend/tests/`.

## Local Development Setup

### Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate
pip install -r requirements.txt
python -m pytest tests -v
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
