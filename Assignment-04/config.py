import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Base project directory
BASE_DIR = Path(__file__).resolve().parent

# Gemini API Configurations
# First check GEMINI_API_KEY from environment, otherwise fallback to check .env loaded key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

# Browser Settings
# Default is False (headed) so the user can watch the automation during demonstration/viva
HEADLESS = os.getenv("HEADLESS", "False").lower() in ("true", "1", "yes")

# Timeout in milliseconds (default: 30000ms / 30 seconds)
BROWSER_TIMEOUT = int(os.getenv("BROWSER_TIMEOUT", "30000"))

# Outputs & Logging Paths
SCREENSHOTS_DIR = BASE_DIR / "screenshots"
SCREENSHOTS_DIR.mkdir(exist_ok=True)

LOG_FILE = BASE_DIR / "agent_execution.log"

def validate_config():
    """Validates that critical configurations like the API key are present."""
    if not GEMINI_API_KEY:
        # If API key is not defined, we print a warning. The agent will raise an error when initialized.
        print("\n[WARNING] GEMINI_API_KEY is not set in your environment or .env file.")
        print("Please configure GEMINI_API_KEY before running the agent.\n")
        return False
    return True
