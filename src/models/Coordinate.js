/**
 * Coordinate type representing a point in the viewport
 * @typedef {Object} Coordinate
 * @property {number} x - The x-coordinate in pixels
 * @property {number} y - The y-coordinate in pixels
 */

/**
 * Converts a coordinate to a string key for use in Maps
 * @param {Coordinate} coord - The coordinate to convert
 * @returns {string} A string key in the format "x,y"
 */
export function coordToKey(coord) {
  return `${coord.x},${coord.y}`;
}

/**
 * Converts a string key back to a Coordinate object
 * @param {string} key - The string key in the format "x,y"
 * @returns {Coordinate} The coordinate object
 */
export function keyToCoord(key) {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

/**
 * Compares two coordinates for equality
 * @param {Coordinate} coord1 - First coordinate
 * @param {Coordinate} coord2 - Second coordinate
 * @returns {boolean} True if coordinates are equal
 */
export function coordEquals(coord1, coord2) {
  return coord1.x === coord2.x && coord1.y === coord2.y;
}

/**
 * Validates that a coordinate has valid x and y properties
 * @param {Coordinate} coord - The coordinate to validate
 * @returns {boolean} True if coordinate is valid
 */
export function isValidCoordinate(coord) {
  return (
    coord !== null &&
    coord !== undefined &&
    typeof coord === 'object' &&
    typeof coord.x === 'number' &&
    typeof coord.y === 'number' &&
    !isNaN(coord.x) &&
    !isNaN(coord.y) &&
    isFinite(coord.x) &&
    isFinite(coord.y)
  );
}

/**
 * Creates a new Coordinate object
 * @param {number} x - The x-coordinate
 * @param {number} y - The y-coordinate
 * @returns {Coordinate} A new coordinate object
 */
export function createCoordinate(x, y) {
  return { x, y };
}
