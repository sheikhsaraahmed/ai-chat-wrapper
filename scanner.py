# scanner.py
# This is the brain of our project - it scans every message before it reaches the AI
# If it detects a threat, it blocks the message and logs it

import re

# ── Threat patterns ──────────────────────────────────────────────────────────
# Each entry has: pattern to detect, threat type name, severity level

THREAT_PATTERNS = [
    # Prompt injection - trying to override system instructions
    {
        "pattern": r"ignore (all |previous |above |prior )?(instructions|prompts|rules|context)",
        "type": "Prompt Injection",
        "severity": "HIGH"
    },
    {
        "pattern": r"(you are now|act as|pretend to be|roleplay as|simulate).{0,30}(unrestricted|evil|hacker|jailbreak|dan|without rules)",
        "type": "Role Override",
        "severity": "HIGH"
    },
    {
        "pattern": r"(disregard|forget|override|bypass).{0,20}(rules|instructions|guidelines|restrictions|filters)",
        "type": "Prompt Injection",
        "severity": "HIGH"
    },

    # Jailbreak attempts
    {
        "pattern": r"\b(jailbreak|dan mode|developer mode|god mode|unrestricted mode)\b",
        "type": "Jailbreak Attempt",
        "severity": "HIGH"
    },
    {
        "pattern": r"do anything now|no restrictions|no limits|without restrictions",
        "type": "Jailbreak Attempt",
        "severity": "HIGH"
    },

    # System prompt extraction
    {
        "pattern": r"(reveal|show|print|display|tell me|what is).{0,20}(system prompt|your prompt|your instructions|your rules)",
        "type": "Prompt Extraction",
        "severity": "MEDIUM"
    },
    {
        "pattern": r"(repeat|output|echo).{0,20}(everything|all).{0,20}(above|before|prior)",
        "type": "Prompt Extraction",
        "severity": "MEDIUM"
    },

    # Social engineering
    {
        "pattern": r"(my (boss|teacher|professor|manager)|i have permission|i am authorized|i am allowed)",
        "type": "Social Engineering",
        "severity": "MEDIUM"
    },
    {
        "pattern": r"(hypothetically|theoretically|in a story|for a movie|for research).{0,40}(hack|exploit|attack|bypass|illegal)",
        "type": "Social Engineering",
        "severity": "MEDIUM"
    },

    # Malicious intent
    {
        "pattern": r"\b(how to hack|how to exploit|sql injection|xss attack|ddos|phishing email)\b",
        "type": "Malicious Intent",
        "severity": "HIGH"
    },
    {
        "pattern": r"(give me|write|create|generate).{0,20}(malware|virus|exploit|payload|ransomware)",
        "type": "Malicious Intent",
        "severity": "HIGH"
    },
]

# ── Main scan function ────────────────────────────────────────────────────────

def scan_prompt(message):
    """
    Scans a user message for threats.
    Returns a dict with:
      - is_threat (bool)
      - threats (list of detected threats)
      - highest_severity (str)
    """
    message_lower = message.lower()
    detected = []

    for entry in THREAT_PATTERNS:
        if re.search(entry["pattern"], message_lower):
            detected.append({
                "type": entry["type"],
                "severity": entry["severity"],
                "matched_pattern": entry["pattern"]
            })

    if detected:
        # Determine highest severity
        severity_rank = {"HIGH": 2, "MEDIUM": 1, "LOW": 0}
        highest = max(detected, key=lambda x: severity_rank.get(x["severity"], 0))

        return {
            "is_threat": True,
            "threats": detected,
            "highest_severity": highest["severity"]
        }

    return {
        "is_threat": False,
        "threats": [],
        "highest_severity": None
    }