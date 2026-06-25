import time
import logging
from playwright.sync_api import sync_playwright
from config import HEADLESS, BROWSER_TIMEOUT
from utils import DOM_EXTRACT_JS

logger = logging.getLogger("BrowserManager")

class BrowserManager:
    """
    Manages Playwright browser instance lifetime and implements core tools/capabilities:
    - open_browser
    - navigate_to_url
    - take_screenshot
    - click_on_screen
    - send_keys
    - scroll
    - double_click
    """
    def __init__(self):
        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None
        
    def open_browser(self):
        """Initialize and launch a browser instance."""
        if self.browser:
            logger.warning("Browser instance is already running.")
            return
            
        logger.info(f"Launching chromium browser (headless={HEADLESS})...")
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(
            headless=HEADLESS,
            args=["--disable-web-security"] # Helps avoid CORS issues for dynamic scripts if any
        )
        # Create standard macOS desktop context for realistic rendering
        self.context = self.browser.new_context(
            viewport={"width": 1280, "height": 800},
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        self.context.set_default_timeout(BROWSER_TIMEOUT)
        self.page = self.context.new_page()
        logger.info("Browser successfully opened.")
        
    def navigate_to_url(self, url: str):
        """Direct the browser to a specific URL."""
        if not self.page:
            raise RuntimeError("Browser context is not open. Call open_browser() first.")
        logger.info(f"Navigating to URL: {url}")
        self.page.goto(url, wait_until="load")
        # Give page scripts 3 seconds to fully render React/animations
        time.sleep(3)
        
    def take_screenshot(self, path: str):
        """Capture the current state of the browser window."""
        if not self.page:
            raise RuntimeError("Browser context is not open. Call open_browser() first.")
        logger.info(f"Saving screenshot to: {path}")
        self.page.screenshot(path=path)
        
    def click_on_screen(self, x: float, y: float):
        """Perform mouse clicks at specified coordinates."""
        if not self.page:
            raise RuntimeError("Browser context is not open. Call open_browser() first.")
        logger.info(f"Clicking coordinate: ({x}, {y})")
        # Perform visual click
        self.page.mouse.click(x, y)
        # Briefly wait for any click-triggered state transition
        time.sleep(1.5)
        
    def double_click(self, x: float, y: float):
        """Perform double-click actions when necessary."""
        if not self.page:
            raise RuntimeError("Browser context is not open. Call open_browser() first.")
        logger.info(f"Double-clicking coordinate: ({x}, {y})")
        self.page.mouse.dblclick(x, y)
        time.sleep(1)
        
    def send_keys(self, text: str, x: float = None, y: float = None):
        """
        Input text into form fields or text areas.
        If coordinates (x, y) are specified, the agent clicks to focus first.
        Otherwise, it types directly into the currently focused element.
        """
        if not self.page:
            raise RuntimeError("Browser context is not open. Call open_browser() first.")
            
        if x is not None and y is not None:
            logger.info(f"Focusing field at coordinate: ({x}, {y}) before typing.")
            self.click_on_screen(x, y)
            
        logger.info(f"Sending keys: '{text}'")
        # Simulate realistic user typing using standard keyboard delay
        self.page.keyboard.type(text, delay=30)
        time.sleep(1)
        
    def scroll(self, direction: str = "down", amount: int = 400):
        """Scroll the page to reveal hidden elements."""
        if not self.page:
            raise RuntimeError("Browser context is not open. Call open_browser() first.")
        logger.info(f"Scrolling page {direction} by {amount} pixels.")
        if direction.lower() == "down":
            self.page.evaluate(f"window.scrollBy(0, {amount})")
        elif direction.lower() == "up":
            self.page.evaluate(f"window.scrollBy(0, -{amount})")
        else:
            logger.warning(f"Unsupported scroll direction: '{direction}'")
        time.sleep(1)
        
    def get_interactive_elements(self):
        """Extract all visible interactive DOM elements with details."""
        if not self.page:
            raise RuntimeError("Browser context is not open. Call open_browser() first.")
        elements = self.page.evaluate(DOM_EXTRACT_JS)
        logger.info(f"Found {len(elements)} visible interactive elements.")
        return elements
        
    def close(self):
        """Close browser instance and clean up Playwright resources."""
        logger.info("Cleaning up and closing browser resources...")
        try:
            if self.page:
                self.page.close()
                self.page = None
            if self.context:
                self.context.close()
                self.context = None
            if self.browser:
                self.browser.close()
                self.browser = None
            if self.playwright:
                self.playwright.stop()
                self.playwright = None
            logger.info("Browser cleanup completed.")
        except Exception as e:
            logger.error(f"Error closing browser: {e}")
