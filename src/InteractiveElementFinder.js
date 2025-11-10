/**
 * Interactive Element Finder
 * Identifies which elements should handle click events at given coordinates
 */

/**
 * Checks if an element is interactive (has role=button or role=link and valid pointer-events)
 * @param {Element} element - The element to check
 * @returns {boolean} True if the element is interactive
 */
export function isInteractive(element) {
  if (!element || !(element instanceof Element)) {
    return false;
  }

  // Get the explicit role attribute
  const explicitRole = element.getAttribute('role');
  
  // Get the implicit role based on element type
  const implicitRole = getImplicitRole(element);
  
  // Use explicit role if present, otherwise use implicit role
  const role = explicitRole || implicitRole;
  
  // Check if role is button or link
  if (role !== 'button' && role !== 'link') {
    return false;
  }
  
  // Check computed style for pointer-events
  const computedStyle = window.getComputedStyle(element);
  const pointerEvents = computedStyle.pointerEvents;
  
  // Return false if pointer-events is 'none'
  if (pointerEvents === 'none') {
    return false;
  }
  
  return true;
}

/**
 * Gets the implicit ARIA role for an element based on its tag name and attributes
 * @param {Element} element - The element to check
 * @returns {string|null} The implicit role or null if none
 */
function getImplicitRole(element) {
  const tagName = element.tagName.toLowerCase();
  
  // Button elements
  if (tagName === 'button') {
    return 'button';
  }
  
  // Input elements with type=button, submit, reset, or image
  if (tagName === 'input') {
    const type = element.getAttribute('type');
    if (type === 'button' || type === 'submit' || type === 'reset' || type === 'image') {
      return 'button';
    }
  }
  
  // Anchor elements with href attribute
  if (tagName === 'a' && element.hasAttribute('href')) {
    return 'link';
  }
  
  // Area elements with href attribute
  if (tagName === 'area' && element.hasAttribute('href')) {
    return 'link';
  }
  
  return null;
}

/**
 * Traverses up the DOM tree to find the first interactive ancestor
 * @param {Element} element - The starting element
 * @returns {Element|null} The first interactive ancestor or null if none found
 */
export function findInteractiveAncestor(element) {
  if (!element || !(element instanceof Element)) {
    return null;
  }
  
  let current = element;
  
  // Traverse up the DOM tree until we reach the document root
  while (current && current !== document.documentElement && current !== document) {
    if (isInteractive(current)) {
      return current;
    }
    current = current.parentElement;
  }
  
  return null;
}
