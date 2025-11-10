import { coordToKey } from './Coordinate.js';

/**
 * HitRegionMap manages the bidirectional mapping between elements and their hit region coordinates
 */
export class HitRegionMap {
  constructor(options = {}) {
    // WeakMap to prevent memory leaks - elements can be garbage collected
    this.elementToCoordinates = new WeakMap();
    
    // Regular Map for coordinate to element lookup
    // Key is string from coordToKey(), value is Element
    this.coordinateToElement = new Map();
    
    // Track elements in a Set for iteration (WeakMap is not iterable)
    this.elements = new Set();
    
    // Performance safeguard: limit maximum coordinates per element
    this.maxCoordinatesPerElement = options.maxCoordinatesPerElement || 10000;
  }

  /**
   * Adds a coordinate to an element's hit region
   * @param {Element} element - The interactive element
   * @param {Coordinate} coord - The coordinate to add
   * @returns {boolean} True if coordinate was added, false if limit reached
   */
  addCoordinate(element, coord) {
    if (!element || !coord) {
      return false;
    }

    // Add to element -> coordinates mapping
    let coordinates = this.elementToCoordinates.get(element);
    if (!coordinates) {
      coordinates = new Set();
      this.elementToCoordinates.set(element, coordinates);
      this.elements.add(element);
    }
    
    // Limit maximum coordinates per element (performance safeguard)
    if (coordinates.size >= this.maxCoordinatesPerElement) {
      if (coordinates.size === this.maxCoordinatesPerElement) {
        console.warn(
          `Element has reached maximum coordinate limit (${this.maxCoordinatesPerElement}). ` +
          'Additional coordinates will be ignored.'
        );
      }
      return false;
    }
    
    const key = coordToKey(coord);
    coordinates.add(key);

    // Add to coordinate -> element mapping
    this.coordinateToElement.set(key, element);
    
    return true;
  }

  /**
   * Gets all coordinates for a given element
   * @param {Element} element - The element to look up
   * @returns {Coordinate[]} Array of coordinates, or empty array if element not found
   */
  getCoordinates(element) {
    if (!element) {
      return [];
    }

    const coordinateKeys = this.elementToCoordinates.get(element);
    if (!coordinateKeys) {
      return [];
    }

    // Convert string keys back to Coordinate objects
    return Array.from(coordinateKeys).map(key => {
      const [x, y] = key.split(',').map(Number);
      return { x, y };
    });
  }

  /**
   * Gets the element at a given coordinate
   * @param {Coordinate} coord - The coordinate to look up
   * @returns {Element|null} The element at that coordinate, or null if none
   */
  getElement(coord) {
    if (!coord) {
      return null;
    }

    const key = coordToKey(coord);
    return this.coordinateToElement.get(key) || null;
  }

  /**
   * Checks if an element has any coordinates in the map
   * @param {Element} element - The element to check
   * @returns {boolean} True if element has coordinates
   */
  hasElement(element) {
    return this.elementToCoordinates.has(element);
  }

  /**
   * Gets the number of coordinates for an element
   * @param {Element} element - The element to check
   * @returns {number} Number of coordinates
   */
  getCoordinateCount(element) {
    const coordinates = this.elementToCoordinates.get(element);
    return coordinates ? coordinates.size : 0;
  }

  /**
   * Gets all elements in the map
   * @returns {Element[]} Array of all elements
   */
  getElements() {
    return Array.from(this.elements);
  }

  /**
   * Clears all mappings (for invalidation)
   */
  clear() {
    this.coordinateToElement.clear();
    this.elements.clear();
    // WeakMap doesn't have a clear method, but we can create a new one
    this.elementToCoordinates = new WeakMap();
  }

  /**
   * Gets statistics about the hit region map
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      elementCount: this.elements.size,
      coordinateCount: this.coordinateToElement.size
    };
  }
}
