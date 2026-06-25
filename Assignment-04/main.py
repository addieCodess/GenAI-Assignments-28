import argparse
import sys
import logging
import config
from browser_manager import BrowserManager
from agent import WebAutomationAgent

def setup_logging():
    """
    Configures logging to output to both console and a log file.
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    if root_logger.hasHandlers():
        root_logger.handlers.clear()
        
    file_formatter = logging.Formatter(
        '%(asctime)s [%(levelname)s] %(name)s: %(message)s'
    )
    console_formatter = logging.Formatter(
        '%(levelname)s - %(message)s'
    )
    
    file_handler = logging.FileHandler(config.LOG_FILE, mode='w', encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(file_formatter)
    root_logger.addHandler(file_handler)
    
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)

def parse_arguments():
    """
    Parses CLI parameters.
    """
    parser = argparse.ArgumentParser(
        description="Multimodal Website Automation Agent - Assignment 04"
    )
    parser.add_argument(
        "--url",
        type=str,
        default="https://ui.shadcn.com/docs/forms/react-hook-form",
        help="Target URL for the browser automation (default: Shadcn form documentation)."
    )
    parser.add_argument(
        "--objective",
        type=str,
        default=(
            "Navigate to the target URL, find the form demo, identify the Name (Username) and Description input fields, "
            "and automatically fill them in with 'Autogravity Agent' for name and 'Successfully filled by an autonomous AI agent!' for description."
        ),
        help="Objective description that the AI agent should achieve."
    )
    parser.add_argument(
        "--max-steps",
        type=int,
        default=10,
        help="Maximum iterations the agent is allowed to execute (default: 10)."
    )
    parser.add_argument(
        "--headless",
        action="store_true",
        default=None,
        help="Force run the browser in headless mode. Overrides the environment variable."
    )
    parser.add_argument(
        "--mock",
        action="store_true",
        default=False,
        help="Run in simulation/mock mode (requires no Gemini API Key)."
    )
    return parser.parse_args()

def main():
    setup_logging()
    logger = logging.getLogger("Main")
    
    logger.info("Initializing Website Automation Agent...")
    args = parse_arguments()
    
    # Handle headless override
    if args.headless is not None:
        config.HEADLESS = args.headless
        
    # Validate API key config. If missing, fall back to mock simulation mode
    is_mock = args.mock
    if not is_mock and not config.validate_config():
        logger.warning("GEMINI_API_KEY is not set. Automatically falling back to Visual Simulation (Mock) Mode.")
        is_mock = True
        
    browser_manager = BrowserManager()
    
    try:
        agent = WebAutomationAgent(browser_manager, mock=is_mock)
        
        # Execute the agent loop
        success = agent.run(objective=args.objective, max_steps=args.max_steps)
        
        if success:
            logger.info("Automation process completed successfully.")
            print("\n=============================================")
            print("🎉 Success! The objective was successfully achieved.")
            print("=============================================\n")
        else:
            logger.warning("Agent run completed but did not declare success.")
            print("\n=============================================")
            print("⚠️ Agent run stopped without fully achieving the goal.")
            print("=============================================\n")
            
    except KeyboardInterrupt:
        logger.warning("Execution interrupted by user.")
        print("\nProcess interrupted. Cleaning up resources...")
    except Exception as e:
        logger.error(f"Execution error: {e}", exc_info=True)
    finally:
        # Guarantee browser resources are released to prevent zombie chromium processes
        browser_manager.close()

if __name__ == "__main__":
    main()
