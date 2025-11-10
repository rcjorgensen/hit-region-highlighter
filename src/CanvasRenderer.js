/**
 * CanvasRenderer - Manages canvas overlay and renders hit region visualizations
 * 
 * Responsibilities:
 * - Create and manage canvas overlay element
 * - Render hit regions as visual overlays
 * - Clear and destroy canvas when needed
 */

class CanvasRenderer {
  constructor() {
    this.canvas = null;
    this.ctx = null;
  }

  /**
   * Creates a canvas overlay that covers the entire viewport
   * 
   * Requirements: 5.1, 5.2
   * 
   * @returns {HTMLCanvasElement} The created canvas element
   * @throws {Error} If canvas creation fails
   */
  createOverlay() {
    try {
      // Remove existing canvas if present
      if (this.canvas) {
        this.destroy();
      }

      // Validate document.body exists
      if (!document.body) {
        throw new Error('Cannot create canvas overlay: document.body does not exist');
      }

      // Create canvas element
      this.canvas = document.createElement('canvas');
      
      if (!this.canvas) {
        throw new Error('Failed to create canvas element');
      }
      
      // Set canvas dimensions to match viewport
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
      
      // Style the canvas overlay
      this.canvas.style.position = 'fixed';
      this.canvas.style.top = '0';
      this.canvas.style.left = '0';
      this.canvas.style.zIndex = '2147483647'; // Maximum z-index value
      this.canvas.style.pointerEvents = 'none'; // Don't block interactions
      this.canvas.style.width = '100%';
      this.canvas.style.height = '100%';
      
      // Get 2D rendering context
      this.ctx = this.canvas.getContext('2d');
      
      if (!this.ctx) {
        throw new Error('Failed to get 2D rendering context from canvas');
      }
      
      // Append to document body
      document.body.appendChild(this.canvas);
      
      return this.canvas;
    } catch (error) {
      console.error('Failed to create canvas overlay:', error);
      // Clean up partial state
      this.canvas = null;
      this.ctx = null;
      throw error;
    }
  }

  /**
   * Renders a hit region by drawing at each coordinate
   * 
   * Requirements: 5.3, 5.4
   * 
   * @param {Array<{x: number, y: number}>} coordinates - Array of coordinates to render
   * @param {string} color - Hex color code (e.g., '#00ff00')
   * @param {number} opacity - Opacity value between 0.0 and 1.0
   */
  renderHitRegion(coordinates, color = '#00ff00', opacity = 0.3) {
    try {
      // Validate inputs
      if (!coordinates || !Array.isArray(coordinates)) {
        console.error('Invalid coordinates: must be an array');
        return;
      }
      
      if (coordinates.length === 0) {
        console.warn('No coordinates to render');
        return;
      }
      
      // Validate color format
      if (typeof color !== 'string' || !color.match(/^#[0-9A-Fa-f]{6}$/)) {
        console.warn(`Invalid color format: ${color}, using default`);
        color = '#00ff00';
      }
      
      // Validate opacity range
      if (typeof opacity !== 'number' || opacity < 0 || opacity > 1) {
        console.warn(`Invalid opacity: ${opacity}, using default`);
        opacity = 0.3;
      }
      
      // Ensure canvas exists
      if (!this.canvas) {
        this.createOverlay();
      }

      // Clear previous rendering
      this.clear();

      // Use requestAnimationFrame for smooth rendering
      requestAnimationFrame(() => {
        if (!this.ctx) {
          console.error('Cannot render: rendering context not available');
          return;
        }

        try {
          // Set rendering style
          this.ctx.fillStyle = color;
          this.ctx.globalAlpha = opacity;

          // Draw at each coordinate
          for (const coord of coordinates) {
            if (!coord || typeof coord.x !== 'number' || typeof coord.y !== 'number') {
              console.warn('Skipping invalid coordinate:', coord);
              continue;
            }
            
            // Draw small circle at each coordinate point
            this.ctx.beginPath();
            this.ctx.arc(coord.x, coord.y, 1, 0, Math.PI * 2);
            this.ctx.fill();
          }

          // Reset global alpha
          this.ctx.globalAlpha = 1.0;
        } catch (renderError) {
          console.error('Error during rendering:', renderError);
        }
      });
    } catch (error) {
      console.error('Failed to render hit region:', error);
    }
  }

  /**
   * Clears the canvas context
   * 
   * Requirements: 5.5
   */
  clear() {
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  /**
   * Removes the canvas from the DOM and cleans up references
   * 
   * Requirements: 5.5
   */
  destroy() {
    if (this.canvas && this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.canvas = null;
    this.ctx = null;
  }

  /**
   * Checks if the canvas overlay currently exists
   * 
   * @returns {boolean} True if canvas exists
   */
  hasOverlay() {
    return this.canvas !== null && this.canvas.parentNode !== null;
  }

  /**
   * Updates canvas dimensions to match current viewport
   * Useful when viewport is resized
   */
  updateDimensions() {
    if (this.canvas) {
      this.canvas.width = window.innerWidth;
      this.canvas.height = window.innerHeight;
    }
  }
}

// Export for use in other modules
export default CanvasRenderer;
