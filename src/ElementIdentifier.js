/**
 * ElementIdentifier - Utilities for generating and resolving element identifiers
 * Used to communicate element references between DevTools and content script
 */

/**
 * @typedef {Object} ElementIdentifier
 * @property {'css' | 'xpath' | 'id'} type - The type of identifier
 * @property {string} value - The identifier value
 */

/**
 * Generates a unique CSS selector for an element
 * @param {Element} element - The element to generate a selector for
 * @returns {string|null} - CSS selector or null if unable to generate
 */
function generateCSSSelector(element) {
  if (!element || element === document.documentElement) {
    return null;
  }

  // Try ID first (most specific)
  if (element.id) {
    const idSelector = `#${CSS.escape(element.id)}`;
    // Verify it's unique
    if (document.querySelectorAll(idSelector).length === 1) {
      return idSelector;
    }
  }

  // Build path from element to root
  const path = [];
  let current = element;

  while (current && current !== document.documentElement) {
    let selector = current.tagName.toLowerCase();

    // Add ID if available and unique at this level
    if (current.id) {
      selector += `#${CSS.escape(current.id)}`;
      path.unshift(selector);
      break; // ID should be unique, stop here
    }

    // Add classes if available
    if (current.className && typeof current.className === 'string') {
      const classes = current.className.trim().split(/\s+/).filter(c => c);
      if (classes.length > 0) {
        selector += '.' + classes.map(c => CSS.escape(c)).join('.');
      }
    }

    // Add nth-child if needed for uniqueness
    if (current.parentElement) {
      const siblings = Array.from(current.parentElement.children);
      const sameTagSiblings = siblings.filter(s => s.tagName === current.tagName);
      
      if (sameTagSiblings.length > 1) {
        const index = sameTagSiblings.indexOf(current) + 1;
        selector += `:nth-of-type(${index})`;
      }
    }

    path.unshift(selector);
    current = current.parentElement;
  }

  return path.join(' > ');
}

/**
 * Generates an XPath for an element
 * @param {Element} element - The element to generate XPath for
 * @returns {string} - XPath expression
 */
function generateXPath(element) {
  if (!element || element === document.documentElement) {
    return '/html';
  }

  // Check if element has an ID
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }

  const path = [];
  let current = element;

  while (current && current !== document.documentElement) {
    let index = 1;
    let sibling = current.previousElementSibling;

    // Count preceding siblings with same tag name
    while (sibling) {
      if (sibling.tagName === current.tagName) {
        index++;
      }
      sibling = sibling.previousElementSibling;
    }

    const tagName = current.tagName.toLowerCase();
    const pathSegment = `${tagName}[${index}]`;
    path.unshift(pathSegment);

    current = current.parentElement;
  }

  return '/html/' + path.join('/');
}

/**
 * Verifies if a CSS selector uniquely identifies an element
 * @param {string} selector - CSS selector to verify
 * @param {Element} element - The element it should match
 * @returns {boolean} - True if selector uniquely identifies the element
 */
function isSelectorUnique(selector, element) {
  try {
    const matches = document.querySelectorAll(selector);
    return matches.length === 1 && matches[0] === element;
  } catch (e) {
    return false;
  }
}

/**
 * Generates a unique identifier for an element
 * Tries CSS selector first, falls back to XPath if CSS selector is not unique
 * @param {Element} element - The element to identify
 * @returns {ElementIdentifier} - Object with type and value
 */
export function generateElementIdentifier(element) {
  if (!element) {
    throw new Error('Element is required');
  }

  // Try ID-based identifier first
  if (element.id) {
    const idSelector = `#${CSS.escape(element.id)}`;
    if (isSelectorUnique(idSelector, element)) {
      return {
        type: 'id',
        value: element.id
      };
    }
  }

  // Try CSS selector
  const cssSelector = generateCSSSelector(element);
  if (cssSelector && isSelectorUnique(cssSelector, element)) {
    return {
      type: 'css',
      value: cssSelector
    };
  }

  // Fallback to XPath
  const xpath = generateXPath(element);
  return {
    type: 'xpath',
    value: xpath
  };
}

/**
 * Finds an element by its identifier
 * @param {ElementIdentifier} identifier - The element identifier
 * @returns {Element|null} - The found element or null
 */
export function findElementByIdentifier(identifier) {
  if (!identifier || !identifier.type || !identifier.value) {
    return null;
  }

  try {
    switch (identifier.type) {
      case 'id':
        return document.getElementById(identifier.value);

      case 'css':
        return document.querySelector(identifier.value);

      case 'xpath': {
        const result = document.evaluate(
          identifier.value,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null
        );
        return result.singleNodeValue;
      }

      default:
        console.warn(`Unknown identifier type: ${identifier.type}`);
        return null;
    }
  } catch (error) {
    console.error('Error finding element by identifier:', error);
    return null;
  }
}
