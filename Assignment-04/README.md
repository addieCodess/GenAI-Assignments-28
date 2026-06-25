# Website Automation Agent

This repository contains an intelligent, multimodal Website Automation Agent built in Python. The agent uses Google's Gemini 2.5 Flash model and Playwright to autonomously navigate web pages, identify input fields, and perform form-filling operations.

It is designed to satisfy all requirements of **Assignment 04 - Website Automation Agent**, demonstrating AI-driven browser control and coordinate-based visual element manipulation.

---

## Features

- **Multimodal Control**: Uses visual inputs (screenshots) coupled with DOM metadata to make decisions.
- **Set-of-Mark (SoM) Element Detection**: Identifies visible interactive elements (buttons, inputs, links), highlights them with bounding boxes, and tags them with numeric IDs for the AI model to interact with.
- **Playwright Sync API**: Encapsulates browser controls (`open_browser`, `navigate_to_url`, `click_on_screen`, `send_keys`, `scroll`, `double_click`, `take_screenshot`).
- **Comprehensive Logging**: Outputs human-readable actions to the console and writes detailed debugging information to `agent_execution.log`.
- **Resource Cleanup**: Employs robust error handling and guarantees browser process termination to avoid process leakage.

---

## Installation

### 1. Install Dependencies
Ensure you have Python 3.12+ installed. Install the package dependencies using `pip`:

```bash
pip install -r requirements.txt
```

### 2. Install Playwright Browsers
Initialize the Playwright browser binaries on your system:

```bash
playwright install chromium
```

---

## Configuration Setup

1. Copy the `.env.example` file to create your active configuration file:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_actual_gemini_api_key_here
   ```
3. (Optional) Customize the browser mode:
   - Run headed (default, visible browser window): `HEADLESS=False`
   - Run headless (silent, background browser execution): `HEADLESS=True`

---

## Running the Agent

You can run the agent directly using Python. By default, it will navigate to the Assignment 04 target task page:

```bash
python main.py
```

### Customizing the Objective or URL
You can specify a different target page or objective using command-line arguments:

```bash
python main.py \
  --url "https://ui.shadcn.com/docs/forms/react-hook-form" \
  --objective "Locate the Username input and description input. Fill Username with 'Tester' and Description with 'Test description'."
```

### Headless execution override
To run silently in the background without modifying `.env`:

```bash
python main.py --headless
```

---

## Outputs

- **Screenshots**: Annotated and raw screenshots for each step are stored in the `./screenshots` directory (e.g., `step_1_raw.png`, `step_1_annotated.png`).
- **Logs**: Execution logs are saved to `agent_execution.log`.

---

## Project Structure

```
.
├── .env                  # Configured environment variables (ignored by git)
├── .env.example          # Template environment configuration
├── requirements.txt      # Python package requirements
├── config.py             # Configuration loader and validator
├── browser_manager.py    # Playwright browser wrapper (implements core tools)
├── utils.py              # Visual annotation (Set-of-Mark) & DOM selection helper
├── agent.py              # Core agent reasoning loop (Gemini interaction)
├── main.py               # Main CLI tool runner
├── architecture.md       # Architectural details & Mermaid flow diagrams
└── README.md             # Setup and running instructions (this file)
```
