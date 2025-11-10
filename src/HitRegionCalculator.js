/**
 * Hit Region Calculator
 * Samples the viewport and builds element-to-coordinates mappings
 */

import { findInteractiveAncestor } from './InteractiveElementFinder.js';
import { HitRegionMap } from './models/HitRegionMap.js';
import { createCoordinate } from './models/Coordinate.js';

/**
 * Generates a grid of coordinates covering the viewport at the specified resolution
 * @param {number} resolution - Pixels between sample points
 * @returns {Coordinate[]} Array of coordinates covering the viewport
 */
export function generateCoordinateGrid(resolution) {
  const coordinates = [];
  const width = window.innerWidth;
  const height = window.innerHeight;

  for (let x = 0; x < width; x += resolution) {
    for (let y = 0; y < height; y += resolution) {
      coordinates.push(createCoordinate(x, y));
    }
  }

  return coordinates;
}

/**
 * Samples a single coordinate to find the interactive element at that position
 * @param {number} x - The x-coordinate
 * @param {number} y - The y-coordinate
 * @returns {Element|null} The interactive element at that coordinate, or null
 */
export function sampleCoordinate(x, y) {
  try {
    // Call document.elementFromPoint to get the element at this coordinate
    const element = document.elementFromPoint(x, y);
    
    // Handle null returns gracefully
    if (!element) {
      return null;
    }
    
    // Check if element is still in the document (not removed during calculation)
    if (!document.contains(element)) {
      console.warn(`Element at (${x}, ${y}) was removed from DOM during calculation`);
      return null;
    }
    
    // Find the interactive ancestor of the element
    const interactiveElement = findInteractiveAncestor(element);
    
    return interactiveElement;
  } catch (error) {
    // Catch and log errors from elementFromPoint
    console.error(`Error sampling coordinate (${x}, ${y}):`, error);
    return null;
  }
}

/**
 * Calculates hit regions for all interactive elements in the viewport
 * @param {number} resolution - Pixels between sample points (default: 10)
 * @param {Object} options - Optional configuration
 * @param {number} options.timeout - Maximum calculation time in milliseconds (default: 5000)
 * @param {Function} options.onProgress - Progress callback function
 * @param {AbortSignal} options.signal - AbortSignal for cancellation
 * @returns {HitRegionMap} The calculated hit region map
 * @throws {Error} If calculation times out or is aborted
 */
export function calculate(resolution = 10, options = {}) {
  const { 
    timeout = 5000, 
    onProgress = null,
    signal = null 
  } = options;
  
  // Track calculation start time for performance monitoring
  const startTime = performance.now();
  
  // Create a new HitRegionMap instance
  const hitRegionMap = new HitRegionMap();
  
  // Generate coordinate grid using configured resolution
  const coordinates = generateCoordinateGrid(resolution);
  const totalCoordinates = coordinates.length;
  
  // Loop through all coordinates and sample each one
  for (let i = 0; i < coordinates.length; i++) {
    // Check for cancellation
    if (signal && signal.aborted) {
      throw new Error('Calculation cancelled by user');
    }
    
    // Check for timeout
    const elapsed = performance.now() - startTime;
    if (elapsed > timeout) {
      console.error(`Calculation timeout after ${elapsed.toFixed(2)}ms`);
      throw new Error(`Calculation exceeded timeout of ${timeout}ms`);
    }
    
    const coord = coordinates[i];
    
    try {
      const element = sampleCoordinate(coord.x, coord.y);
      
      // If an interactive element was found, add the coordinate to the map
      if (element) {
        // Check if element is still valid before adding
        if (document.contains(element)) {
          hitRegionMap.addCoordinate(element, coord);
        }
      }
    } catch (error) {
      // Log error but continue with remaining coordinates
      console.error(`Error processing coordinate (${coord.x}, ${coord.y}):`, error);
    }
    
    // Report progress periodically (every 10%)
    if (onProgress && i % Math.floor(totalCoordinates / 10) === 0) {
      const progress = (i / totalCoordinates) * 100;
      onProgress(progress, i, totalCoordinates);
    }
  }
  
  // Track calculation end time and log warning if it exceeds threshold
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  if (duration > 500) {
    console.warn(
      `Hit region calculation took ${duration.toFixed(2)}ms, ` +
      `which exceeds the 500ms threshold. Consider increasing the resolution ` +
      `(current: ${resolution}px) to improve performance.`
    );
  }
  
  // Log calculation statistics
  const stats = hitRegionMap.getStats();
  console.log(
    `Hit region calculation complete: ${stats.elementCount} elements, ` +
    `${stats.coordinateCount} coordinates, ${duration.toFixed(2)}ms`
  );
  
  return hitRegionMap;
}

/**
 * Gets the hit region (array of coordinates) for a specific element
 * @param {HitRegionMap} hitRegionMap - The hit region map to query
 * @param {Element} element - The element to look up
 * @returns {Coordinate[]} Array of coordinates for that element
 */
export function getHitRegion(hitRegionMap, element) {
  if (!hitRegionMap || !element) {
    return [];
  }
  
  return hitRegionMap.getCoordinates(element);
}
