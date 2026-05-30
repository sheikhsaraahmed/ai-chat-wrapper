# logger.py
# This file handles saving attack logs to a JSON file
# Every time a threat is detected, we store it here with timestamp

import json
import os
from datetime import datetime

# Path to our log file inside the logs folder
LOG_FILE = os.path.join("logs", "attacks.json")

# ── Make sure log file exists ─────────────────────────────────────────────────

def initialize_log():
    """Creates the attacks.json file if it doesn't exist yet"""
    if not os.path.exists(LOG_FILE):
        with open(LOG_FILE, "w") as f:
            json.dump([], f)  # Start with an empty list

# ── Save a new attack entry ───────────────────────────────────────────────────

def log_attack(message, scan_result):
    """
    Saves a detected threat to the log file.
    message     = the original user message
    scan_result = the result dict from scanner.py
    """
    initialize_log()

    # Build the log entry
    entry = {
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "message": message,
        "threats": scan_result["threats"],
        "highest_severity": scan_result["highest_severity"]
    }

    # Read existing logs
    with open(LOG_FILE, "r") as f:
        logs = json.load(f)

    # Add new entry at the top (newest first)
    logs.insert(0, entry)

    # Save back to file
    with open(LOG_FILE, "w") as f:
        json.dump(logs, f, indent=2)

    return entry

# ── Fetch all logs ────────────────────────────────────────────────────────────

def get_logs():
    """Returns all attack logs as a list"""
    initialize_log()
    with open(LOG_FILE, "r") as f:
        return json.load(f)

# ── Clear all logs ────────────────────────────────────────────────────────────

def clear_logs():
    """Wipes all logs - useful for testing"""
    with open(LOG_FILE, "w") as f:
        json.dump([], f)