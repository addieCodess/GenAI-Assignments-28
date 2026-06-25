import os
from PIL import Image, ImageDraw, ImageFont

# JavaScript script to execute inside the browser page to find visible interactive elements
DOM_EXTRACT_JS = """
() => {
    const interactiveSelectors = [
        'a', 'button', 'input', 'select', 'textarea',
        '[role="button"]', '[role="link"]', '[role="checkbox"]',
        '[role="textbox"]', '[tabindex]', '[contenteditable]'
    ];
    
    const elements = [];
    // Select candidates
    const candidates = document.querySelectorAll(interactiveSelectors.join(','));
    
    let idCounter = 1;
    candidates.forEach(el => {
        // Get bounding box
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        
        // Check computed styles for visibility
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity) === 0) return;
        
        // Ensure element is within the viewport
        const inViewport = (
            rect.top < window.innerHeight &&
            rect.bottom > 0 &&
            rect.left < window.innerWidth &&
            rect.right > 0
        );
        if (!inViewport) return;
        
        // Extract a descriptive text/label
        let text = '';
        if (el.tagName === 'INPUT' && (el.type === 'submit' || el.type === 'button')) {
            text = el.value || '';
        } else {
            text = el.innerText || el.textContent || '';
        }
        
        if (!text.trim() && el.placeholder) text = el.placeholder;
        if (!text.trim() && el.getAttribute('aria-label')) text = el.getAttribute('aria-label');
        if (!text.trim() && el.getAttribute('title')) text = el.getAttribute('title');
        
        // Handle labeled form controls
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT') {
            let labelEl = null;
            if (el.id) {
                labelEl = document.querySelector(`label[for="${el.id}"]`);
            }
            if (!labelEl) {
                labelEl = el.closest('label');
            }
            if (labelEl) {
                const labelText = (labelEl.innerText || '').trim();
                text = labelText + (text ? ` (${text.trim()})` : '');
            }
        }
        
        text = text.replace(/\\s+/g, ' ').trim().substring(0, 80);
        
        // Construct CSS Selector
        let selector = el.tagName.toLowerCase();
        if (el.id) {
            selector += `#${el.id}`;
        } else if (el.name) {
            selector += `[name="${el.name}"]`;
        } else if (el.className) {
            const cleanClasses = Array.from(el.classList)
                .filter(c => !c.includes(':') && !c.includes('[') && !c.includes('.'))
                .join('.');
            if (cleanClasses) {
                selector += `.${cleanClasses}`;
            }
        }
        
        elements.push({
            id: idCounter++,
            tag: el.tagName,
            type: el.type || '',
            text: text || '(no label)',
            selector: selector,
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
        });
    });
    
    return elements;
}
"""

def annotate_screenshot(image_path, elements, output_path):
    """
    Overlays bounding boxes and numeric ID badges on a screenshot image,
    creating a Set-of-Mark style representation that is easy for a vision model to interpret.
    """
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Screenshot file not found: {image_path}")
        
    img = Image.open(image_path)
    # Convert image to RGB if it is not (e.g. RGBA) to prevent save issues later
    if img.mode != 'RGB':
        img = img.convert('RGB')
        
    draw = ImageDraw.Draw(img)
    
    # Try to load a system font (Helvetica on macOS is clean), fallback to default
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 13)
    except IOError:
        font = ImageFont.load_default()
        
    for el in elements:
        x, y, w, h = el['x'], el['y'], el['width'], el['height']
        element_id = el['id']
        
        # Color palette: Vibrant red for element badges (#E63946)
        border_color = (230, 57, 70)  # Red RGB
        
        # 1. Draw bounding box around interactive element
        draw.rectangle([x, y, x + w, y + h], outline=border_color, width=2)
        
        # 2. Draw ID badge
        label_text = f" {element_id} "
        
        # Compute text size using bbox
        bbox = draw.textbbox((0, 0), label_text, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        
        # Place label at top-left of the bounding box, shift inside if too close to screen top
        lbl_x = max(0, x - 2)
        lbl_y = max(0, y - text_h - 6)
        
        # Draw background badge rectangle
        draw.rectangle(
            [lbl_x, lbl_y, lbl_x + text_w + 4, lbl_y + text_h + 6],
            fill=border_color
        )
        
        # Draw white numeric text inside the badge
        draw.text(
            (lbl_x + 2, lbl_y + 2),
            label_text,
            fill=(255, 255, 255),
            font=font
        )
        
    img.save(output_path)
    return output_path
