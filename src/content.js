// Content script for Hit Region Highlighter extension
// Orchestrates hit region calculation and visualization

import { ConfigurationManager } from "./ConfigurationManager.js";
import { calculate } from "./HitRegionCalculator.js";
import CanvasRenderer from "./CanvasRenderer.js";

console.log("Hit Region Highlighter: Content script loaded");

// Global state
let configManager = null;
let currentConfig = null;
let hitRegionMap = null;
let renderer = null;
let currentlySelectedElement = null;
let mutationObserver = null;
let resizeObserver = null;
let mutationDebounceTimer = null;
let resizeDebounceTimer = null;
let calculationAbortController = null;
let progressIndicator = null;

/**
 * Initialize the Hit Region Highlighter extension
 * Requirements: 1.1, 1.3
 */
async function initialize() {
  console.log("Initializing Hit Region Highlighter...");

  try {
    // Load configuration from storage
    configManager = new ConfigurationManager();
    currentConfig = await configManager.loadConfiguration();
    console.log("Configuration loaded:", currentConfig);

    // Create CanvasRenderer instance
    renderer = new CanvasRenderer();

    // Trigger initial hit region calculation
    await calculateHitRegions();

    // Set up configuration change listener
    configManager.addChangeListener((oldConfig, newConfig) => {
      console.log("Configuration changed:", { oldConfig, newConfig });
      currentConfig = newConfig;

      // Recalculate if resolution changed
      if (oldConfig.samplingResolution !== newConfig.samplingResolution) {
        calculateHitRegions();
      }

      // Update visualization if color or opacity changed and element is selected
      if (
        currentlySelectedElement &&
        (oldConfig.highlightColor !== newConfig.highlightColor ||
          oldConfig.highlightOpacity !== newConfig.highlightOpacity)
      ) {
        console.log("Updating visualization with new color/opacity");
        visualizeHitRegion(currentlySelectedElement);
      }
    });

    // Start listening for configuration changes
    configManager.startListening();

    // Set up DOM and layout change detection
    setupMutationObserver();
    setupResizeObserver();

    console.log("Hit Region Highlighter initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Hit Region Highlighter:", error);
  }
}

/**
 * Shows a progress indicator for long calculations
 * Requirements: 2.4
 */
function showProgressIndicator() {
  if (progressIndicator) {
    return; // Already showing
  }

  progressIndicator = document.createElement("div");
  progressIndicator.id = "hit-region-progress";
  progressIndicator.style.position = "fixed";
  progressIndicator.style.top = "10px";
  progressIndicator.style.right = "10px";
  progressIndicator.style.padding = "10px 15px";
  progressIndicator.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  progressIndicator.style.color = "white";
  progressIndicator.style.borderRadius = "5px";
  progressIndicator.style.zIndex = "2147483646";
  progressIndicator.style.fontFamily = "sans-serif";
  progressIndicator.style.fontSize = "14px";
  progressIndicator.innerHTML =
    'Calculating hit regions... <span id="progress-percent">0%</span>';

  document.body.appendChild(progressIndicator);
}

/**
 * Updates the progress indicator
 * Requirements: 2.4
 */
function updateProgressIndicator(progress) {
  if (progressIndicator) {
    const percentSpan = progressIndicator.querySelector("#progress-percent");
    if (percentSpan) {
      percentSpan.textContent = `${Math.round(progress)}%`;
    }
  }
}

/**
 * Hides the progress indicator
 * Requirements: 2.4
 */
function hideProgressIndicator() {
  if (progressIndicator && progressIndicator.parentNode) {
    progressIndicator.parentNode.removeChild(progressIndicator);
    progressIndicator = null;
  }
}

/**
 * Calculate hit regions for all interactive elements
 * Requirements: 1.1, 1.2, 2.4
 */
async function calculateHitRegions() {
  console.log("Calculating hit regions...");

  try {
    const startTime = performance.now();

    // Create abort controller for cancellation support
    calculationAbortController = new AbortController();

    // Show progress indicator for long calculations
    const progressTimeout = setTimeout(() => {
      showProgressIndicator();
    }, 500); // Show after 500ms if still calculating

    // Call calculator.calculate() with configured resolution and options
    hitRegionMap = calculate(currentConfig.samplingResolution, {
      timeout: 10000, // 10 second timeout
      signal: calculationAbortController.signal,
      onProgress: (progress) => {
        updateProgressIndicator(progress);
      },
    });

    // Clear progress timeout and hide indicator
    clearTimeout(progressTimeout);
    hideProgressIndicator();

    const endTime = performance.now();
    const duration = endTime - startTime;

    // Log calculation time and statistics
    const stats = hitRegionMap.getStats();
    console.log(
      `Hit regions calculated: ${stats.elementCount} elements, ` +
        `${stats.coordinateCount} coordinates in ${duration.toFixed(2)}ms`,
    );

    calculationAbortController = null;
    return hitRegionMap;
  } catch (error) {
    hideProgressIndicator();

    if (error.message.includes("cancelled")) {
      console.log("Hit region calculation was cancelled");
    } else if (error.message.includes("timeout")) {
      console.error("Hit region calculation timed out:", error);
    } else {
      console.error("Failed to calculate hit regions:", error);
    }

    calculationAbortController = null;
    throw error;
  }
}

/**
 * Cancels an ongoing calculation
 * Requirements: 2.4
 */
function cancelCalculation() {
  if (calculationAbortController) {
    console.log("Cancelling hit region calculation...");
    calculationAbortController.abort();
    calculationAbortController = null;
    hideProgressIndicator();
    return true;
  }
  return false;
}

/**
 * Visualize the hit region for a specific element
 * Requirements: 1.1.3, 5.3, 5.4
 *
 * @param {Element} element - The element to visualize
 * @returns {boolean} True if visualization succeeded, false otherwise
 */
function visualizeHitRegion(element) {
  if (!element) {
    console.warn("Cannot visualize hit region: element is null");
    return false;
  }

  // Validate element is still in the document
  if (!document.contains(element)) {
    console.warn("Cannot visualize hit region: element is not in the document");
    clearVisualization();
    return false;
  }

  if (!hitRegionMap) {
    console.warn("Cannot visualize hit region: hit region map not calculated");
    return false;
  }

  try {
    // Track currently selected element for re-visualization after page changes
    currentlySelectedElement = element;

    // Check if element exists in HitRegionMap before visualizing
    const coordinates = hitRegionMap.getCoordinates(element);

    if (!coordinates || coordinates.length === 0) {
      console.log("No hit region found for element:", element);
      clearVisualization();
      return false;
    }

    console.log(
      `Visualizing hit region with ${coordinates.length} coordinates`,
    );

    // Validate renderer exists
    if (!renderer) {
      console.error("Cannot visualize hit region: renderer not initialized");
      return false;
    }

    // Create canvas overlay if not exists
    if (!renderer.hasOverlay()) {
      try {
        renderer.createOverlay();
      } catch (canvasError) {
        // Handle canvas creation failures gracefully
        console.error("Failed to create canvas overlay:", canvasError);
        return false;
      }
    }

    // Validate configuration
    if (!currentConfig) {
      console.error("Cannot visualize hit region: configuration not loaded");
      return false;
    }

    // Call renderer.renderHitRegion() with coordinates and config
    renderer.renderHitRegion(
      coordinates,
      currentConfig.highlightColor,
      currentConfig.highlightOpacity,
    );

    return true;
  } catch (error) {
    console.error("Failed to visualize hit region:", error);
    clearVisualization();
    return false;
  }
}

/**
 * Clear the hit region visualization
 * Requirements: 1.1.4, 5.5
 */
function clearVisualization() {
  if (renderer) {
    renderer.clear();
  }
  // Clear currently selected element
  currentlySelectedElement = null;
}

/**
 * Handle page changes (DOM mutations, layout changes, CSS changes)
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */
async function handlePageChanges() {
  console.log("Page changes detected, handling...");

  try {
    // Invalidate current HitRegionMap
    if (hitRegionMap) {
      hitRegionMap.clear();
      console.log("Hit region map invalidated");
    }

    // Check if autoRecalculate is enabled in config
    if (currentConfig && currentConfig.autoRecalculate) {
      console.log("Auto-recalculate enabled, recalculating hit regions...");

      // Trigger recalculation
      await calculateHitRegions();

      // Re-visualize currently selected element if exists
      if (
        currentlySelectedElement &&
        document.contains(currentlySelectedElement)
      ) {
        console.log("Re-visualizing currently selected element");
        visualizeHitRegion(currentlySelectedElement);
      } else if (currentlySelectedElement) {
        // Element was removed from DOM
        console.log("Currently selected element was removed from DOM");
        currentlySelectedElement = null;
        clearVisualization();
      }
    } else {
      console.log("Auto-recalculate disabled, skipping recalculation");
      clearVisualization();
    }
  } catch (error) {
    console.error("Error handling page changes:", error);
  }
}

/**
 * Debounced handler for DOM mutations
 * Debounces to avoid excessive recalculation (300ms)
 * Requirements: 6.1, 6.3
 */
function handleMutation() {
  // Clear existing timer
  if (mutationDebounceTimer) {
    clearTimeout(mutationDebounceTimer);
  }

  // Set new timer
  mutationDebounceTimer = setTimeout(() => {
    console.log("Debounced mutation handler triggered");
    handlePageChanges();
  }, 300);
}

/**
 * Debounced handler for viewport resize
 * Debounces to avoid excessive recalculation (200ms)
 * Requirements: 2.5, 6.2
 */
function handleResize() {
  // Clear existing timer
  if (resizeDebounceTimer) {
    clearTimeout(resizeDebounceTimer);
  }

  // Set new timer
  resizeDebounceTimer = setTimeout(() => {
    console.log("Debounced resize handler triggered");

    // Update canvas dimensions if overlay exists
    if (renderer && renderer.hasOverlay()) {
      renderer.updateDimensions();
    }

    handlePageChanges();
  }, 200);
}

/**
 * Check if a mutation affects interactive elements or layout
 * Requirements: 6.5
 */
function isRelevantMutation(mutation) {
  // Check for style attribute changes
  if (mutation.type === "attributes" && mutation.attributeName === "style") {
    const element = mutation.target;
    const style = element.style;

    // Check if pointer-events or position-related properties changed
    if (
      style.pointerEvents ||
      style.position ||
      style.display ||
      style.visibility ||
      style.transform ||
      style.left ||
      style.top ||
      style.right ||
      style.bottom
    ) {
      return true;
    }
  }

  // Check for class changes (might affect computed styles)
  if (mutation.type === "attributes" && mutation.attributeName === "class") {
    return true;
  }

  // Check for role attribute changes
  if (mutation.type === "attributes" && mutation.attributeName === "role") {
    return true;
  }

  // Check for DOM structure changes
  if (mutation.type === "childList") {
    return true;
  }

  return false;
}

/**
 * Set up MutationObserver to watch for DOM changes
 * Requirements: 6.1, 6.3, 6.5
 */
function setupMutationObserver() {
  console.log("Setting up MutationObserver...");

  // Create MutationObserver to watch for DOM changes
  mutationObserver = new MutationObserver((mutations) => {
    // Check if any mutations are relevant
    const hasRelevantMutation = mutations.some(isRelevantMutation);

    if (hasRelevantMutation) {
      console.log("Relevant DOM mutations detected");
      handleMutation();
    }
  });

  // Configure to observe childList, subtree, and attributes
  const config = {
    childList: true, // Watch for added/removed nodes
    subtree: true, // Watch entire subtree
    attributes: true, // Watch for attribute changes
    attributeFilter: ["style", "class", "role"], // Only watch relevant attributes
  };

  // Start observing
  mutationObserver.observe(document.body, config);
  console.log("MutationObserver started");
}

/**
 * Set up ResizeObserver to watch for viewport size changes
 * Requirements: 2.5, 6.2
 */
function setupResizeObserver() {
  console.log("Setting up ResizeObserver...");

  // Create ResizeObserver to watch for viewport size changes
  resizeObserver = new ResizeObserver(() => {
    console.log("Viewport resize detected");
    handleResize();
  });

  // Observe the document body for size changes
  resizeObserver.observe(document.body);
  console.log("ResizeObserver started");
}

/**
 * Validates an element identifier from DevTools
 *
 * @param {Object} elementId - Element identifier to validate
 * @returns {boolean} True if valid, false otherwise
 */
function validateElementIdentifier(elementId) {
  if (!elementId) {
    console.warn("Element identifier is null or undefined");
    return false;
  }

  if (typeof elementId !== "object") {
    console.warn("Element identifier must be an object");
    return false;
  }

  if (!elementId.type || typeof elementId.type !== "string") {
    console.warn("Element identifier missing or invalid type property");
    return false;
  }

  if (!elementId.value || typeof elementId.value !== "string") {
    console.warn("Element identifier missing or invalid value property");
    return false;
  }

  const validTypes = ["css", "xpath", "id"];
  if (!validTypes.includes(elementId.type)) {
    console.warn(
      `Invalid element identifier type: ${elementId.type}. Must be one of: ${validTypes.join(", ")}`,
    );
    return false;
  }

  return true;
}

/**
 * Find an element in the DOM using an element identifier
 *
 * @param {Object} elementId - Element identifier with type and value
 * @returns {Element|null} The found element or null
 */
function findElementByIdentifier(elementId) {
  // Validate element identifiers from DevTools
  if (!validateElementIdentifier(elementId)) {
    return null;
  }

  try {
    let element = null;

    switch (elementId.type) {
      case "css":
        element = document.querySelector(elementId.value);
        break;

      case "xpath":
        const result = document.evaluate(
          elementId.value,
          document,
          null,
          XPathResult.FIRST_ORDERED_NODE_TYPE,
          null,
        );
        element = result.singleNodeValue;
        break;

      case "id":
        element = document.getElementById(elementId.value);
        break;

      default:
        console.warn("Unknown element identifier type:", elementId.type);
        return null;
    }

    // Validate that the found element is still in the document
    if (element && !document.contains(element)) {
      console.warn("Found element is not in the document");
      return null;
    }

    return element;
  } catch (error) {
    console.error("Failed to find element by identifier:", error);
    return null;
  }
}

/**
 * Message handler for DevTools communication
 * Requirements: 1.1.1, 1.1.2, 1.1.4, 2.4
 */
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log("Content script received message:", message);

  try {
    switch (message.type) {
      case "elementSelected":
        // Handle 'elementSelected' message: call visualizeHitRegion()
        console.log("Element selected:", message.elementId);
        const selectedElement = findElementByIdentifier(message.elementId);
        if (selectedElement) {
          const success = visualizeHitRegion(selectedElement);
          sendResponse({ success });
        } else {
          sendResponse({ success: false, error: "Element not found" });
        }
        break;

      case "elementHovered":
        // Handle 'elementHovered' message: call visualizeHitRegion()
        console.log("Element hovered:", message.elementId);
        const hoveredElement = findElementByIdentifier(message.elementId);
        if (hoveredElement) {
          const success = visualizeHitRegion(hoveredElement);
          sendResponse({ success });
        } else {
          sendResponse({ success: false, error: "Element not found" });
        }
        break;

      case "elementDeselected":
        // Handle 'elementDeselected' message: call clearVisualization()
        console.log("Element deselected");
        clearVisualization();
        sendResponse({ success: true });
        break;

      case "cancelCalculation":
        // Handle 'cancelCalculation' message: allow calculation cancellation
        console.log("Cancel calculation requested");
        const cancelled = cancelCalculation();
        sendResponse({ success: true, cancelled });
        break;

      default:
        console.warn("Unknown message type:", message.type);
        sendResponse({ error: "Unknown message type" });
    }
  } catch (error) {
    console.error("Error handling message:", error);
    sendResponse({ success: false, error: error.message });
  }

  return true;
});

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize);
} else {
  initialize();
}
