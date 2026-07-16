"""Central configuration and shared constants for ThreatLens."""
from pathlib import Path

# --- Paths ---
BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
SAMPLE_DATA_DIR = BASE_DIR / "sample_data"
DB_PATH = DATA_DIR / "threatlens.db"

DATA_DIR.mkdir(parents=True, exist_ok=True)

# --- Threat Taxonomy (TT-FR-01/02): hierarchical phishing categories ---
TAXONOMY = {
    "Credential Theft": "Steals usernames/passwords via fake prompts or pages.",
    "Business Email Compromise": "Impersonates executives/vendors to trigger action.",
    "Malware Delivery": "Delivers malicious attachments or payloads.",
    "Fake Login Page": "Directs victims to a spoofed sign-in page.",
    "Financial Scam": "Fraudulent payment, invoice, or reward lures.",
    "AI Generated Phishing": "Content generated with generative AI tooling.",
}

# --- Machine Learning Engine (ML-FR-04): models to train & compare ---
MODELS = ["Logistic Regression", "Random Forest", "XGBoost", "Neural Network"]

# --- Human Manipulation Analyzer (HM-FR-01): psychological techniques ---
MANIPULATION_TECHNIQUES = ["fear", "urgency", "authority", "curiosity", "reward"]

# --- Feature Extraction (FE-FR-06): documented feature groups ---
FEATURE_GROUPS = {
    "email": ["sender_domain", "language_pattern", "keyword_score", "grammar_score"],
    "url": ["domain_age_days", "url_length", "suspicious_pattern"],
    "behavioral": ["urgency_score", "authority_impersonation", "fear_tactic"],
}
