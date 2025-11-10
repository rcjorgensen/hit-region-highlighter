# Hit Region Highlighter Browser Extension

A browser extension that visualizes the hit regions of interactive elements when they are selected or hovered over in the browser's developer tools.

## Features

- Pre-calculates hit regions for all interactive elements on page load
- Instantly visualizes hit regions when elements are selected in DevTools
- Configurable sampling resolution, highlight color, and opacity
- Automatic recalculation on DOM and layout changes
- Works with buttons, links, and other interactive elements

## Project Structure

```
hit-region-highlighter/
├── manifest.json                      # Extension manifest (Manifest V3)
├── create-icons.html                  # Icon generation utility
├── src/
│   ├── background.js                  # Background service worker
│   ├── content-loader.js              # Content script loader (dynamic import wrapper)
│   ├── content.js                     # Main content script (runs on web pages)
│   ├── ConfigurationManager.js        # Configuration management
│   ├── CanvasRenderer.js              # Canvas overlay rendering
│   ├── HitRegionCalculator.js         # Hit region calculation
│   ├── InteractiveElementFinder.js    # Interactive element detection
│   ├── ElementIdentifier.js           # DevTools element identification
│   ├── models/
│   │   ├── Coordinate.js              # Coordinate utilities
│   │   └── HitRegionMap.js            # Element-to-coordinate mapping
│   ├── devtools/
│   │   ├── devtools.html              # DevTools page entry point
│   │   ├── devtools.js                # DevTools initialization
│   │   ├── panel.html                 # DevTools panel UI
│   │   └── panel.js                   # DevTools panel logic
│   └── options/
│       ├── options.html               # Settings page UI
│       └── options.js                 # Settings page logic
├── test/
│   ├── test-page.html                 # Basic functionality test
│   ├── test-message-flow.html         # Message routing test
│   ├── test-configuration.html        # Configuration changes test
│   └── test-page-changes.html         # Page change detection test
└── icons/
    ├── icon16.png                     # 16x16 toolbar icon
    ├── icon48.png                     # 48x48 management icon
    └── icon128.png                    # 128x128 store icon
```

## Installation

### Development Mode

1. Clone or download this repository
2. Add placeholder icons to the `icons/` directory (see icons/README.md)
3. Open Chrome/Edge and navigate to `chrome://extensions/`
4. Enable "Developer mode" (toggle in top right)
5. Click "Load unpacked"
6. Select the extension directory

### Testing

1. Navigate to any webpage
2. Open DevTools (F12 or right-click → Inspect)
3. Look for the "Hit Regions" panel in DevTools
4. Select an interactive element (button, link) in the Elements panel
5. The hit region will be visualized on the page

## Configuration

Access settings by:
- Clicking the "Open Settings" button in the DevTools panel
- Right-clicking the extension icon → Options
- Going to `chrome://extensions/` and clicking "Details" → "Extension options"

Available settings:
- **Sampling Resolution**: Distance between sample points (1-50 pixels)
- **Highlight Color**: Color used for visualization
- **Highlight Opacity**: Transparency level (0-100%)
- **Auto-recalculate**: Automatically update on page changes

## Technical Architecture

### ES6 Module Support

This extension uses ES6 modules throughout the codebase with native browser support:

- Uses a two-stage loading approach for content scripts:
  1. `content-loader.js` is registered as the content script in manifest.json
  2. It uses dynamic import to load `content.js` as an ES6 module
  3. All source modules are listed in `web_accessible_resources` to enable dynamic imports
- All source files use standard ES6 module syntax (import/export)
- No build step, bundler, or transpilation required

### Module Loading Flow

```
manifest.json → content-loader.js → (dynamic import) → content.js → [all other modules via import statements]
```

This approach works around Chrome's content script module loading limitations while maintaining full ES6 module support.

## Requirements

- Chrome/Edge (Chromium) version 88 or higher (Manifest V3 support)
- Firefox support planned for future releases

## Development Status

### Implemented Features

#### Coordinate Utilities (`src/models/Coordinate.js`)
The coordinate system provides utilities for working with viewport points:
- `coordToKey(coord)` - Converts coordinates to string keys for Map storage
- `keyToCoord(key)` - Converts string keys back to coordinate objects
- `coordEquals(coord1, coord2)` - Compares two coordinates for equality
- `isValidCoordinate(coord)` - Validates coordinate objects
- `createCoordinate(x, y)` - Factory function for creating coordinates

#### HitRegionMap Data Structure (`src/models/HitRegionMap.js`)
Manages bidirectional mapping between elements and their hit region coordinates:
- `addCoordinate(element, coord)` - Adds a coordinate to an element's hit region
- `getCoordinates(element)` - Returns all coordinates for a given element
- `getElement(coord)` - Returns the element at a given coordinate
- `hasElement(element)` - Checks if an element exists in the map
- `getCoordinateCount(element)` - Returns the number of coordinates for an element
- `getElements()` - Returns all elements in the map
- `clear()` - Clears all mappings for invalidation
- `getStats()` - Returns statistics about element and coordinate counts
- Uses WeakMap to prevent memory leaks

#### Interactive Element Finder (`src/InteractiveElementFinder.js`)
Identifies interactive elements that should handle click events:
- `isInteractive(element)` - Checks if an element is interactive based on ARIA roles and pointer-events
  - Supports explicit role attributes (role="button" or role="link")
  - Detects implicit roles from HTML semantics (button, input[type=button/submit/reset/image], a[href], area[href])
  - Validates pointer-events CSS property (returns false if 'none')
- `findInteractiveAncestor(element)` - Traverses DOM tree to find the first interactive ancestor
  - Handles event delegation scenarios where clicks occur on child elements

#### Hit Region Calculator (`src/HitRegionCalculator.js`)
Samples the viewport and builds element-to-coordinates mappings:
- `generateCoordinateGrid(resolution)` - Generates a grid of coordinates covering the viewport at specified resolution
- `sampleCoordinate(x, y)` - Samples a single coordinate to find the interactive element at that position
- `calculate(resolution)` - Calculates hit regions for all interactive elements in the viewport
  - Returns a HitRegionMap instance with all mappings
  - Tracks performance and logs warnings if calculation exceeds 500ms
  - Logs statistics about elements and coordinates found
- `getHitRegion(hitRegionMap, element)` - Gets the hit region (array of coordinates) for a specific element

#### Canvas Renderer (`src/CanvasRenderer.js`)
Manages canvas overlay and renders hit region visualizations:
- `createOverlay()` - Creates a full-viewport canvas overlay with fixed positioning and maximum z-index
  - Canvas is non-interactive (pointer-events: none) to avoid blocking page interactions
  - Automatically removes any existing overlay before creating a new one
- `renderHitRegion(coordinates, color, opacity)` - Renders hit regions as visual overlays
  - Draws small circles at each coordinate point
  - Uses requestAnimationFrame for smooth rendering
  - Default color: '#00ff00' (green), default opacity: 0.3
- `clear()` - Clears the canvas context without removing the overlay
- `destroy()` - Removes the canvas from DOM and cleans up references
- `hasOverlay()` - Checks if canvas overlay currently exists
- `updateDimensions()` - Updates canvas dimensions to match current viewport (useful after resize)

#### Configuration Manager (`src/ConfigurationManager.js`)
Handles loading, saving, and monitoring configuration changes:
- **Configuration Properties**:
  - `samplingResolution` - Pixels between sample points (1-100, default: 10)
  - `highlightColor` - Hex color code for visualization (default: '#00ff00')
  - `highlightOpacity` - Opacity value from 0.0 to 1.0 (default: 0.3)
  - `autoRecalculate` - Whether to recalculate on DOM changes (default: true)
- **Methods**:
  - `loadConfiguration()` - Loads configuration from chrome.storage.sync, merges with defaults
  - `saveConfiguration(config)` - Saves partial or full configuration to storage
  - `getConfiguration()` - Returns current configuration object
  - `validateConfiguration(config)` - Validates configuration values
  - `addChangeListener(listener)` - Registers callback for configuration changes
  - `removeChangeListener(listener)` - Unregisters change listener
  - `startListening()` - Begins monitoring storage changes (call once during initialization)
- Uses chrome.storage.sync for cross-device synchronization
- Notifies registered listeners when configuration changes occur

#### Content Script Orchestration (`src/content.js`)
Coordinates all components and handles communication with DevTools:
- **Initialization**: Loads configuration, creates renderer, calculates initial hit regions
- **Message Handling**: Responds to element selection/hover/deselection from DevTools
- **DOM Change Detection**: MutationObserver watches for DOM changes (debounced 300ms)
- **Layout Change Detection**: ResizeObserver watches for viewport resizes (debounced 200ms)
- **Auto-recalculation**: Automatically recalculates hit regions when page changes (if enabled)
- **Progress Indicators**: Shows progress for calculations exceeding 500ms
- **Calculation Cancellation**: Supports aborting long-running calculations
- **Error Handling**: Validates elements, handles removed elements, gracefully handles failures
- **Element Tracking**: Maintains reference to currently selected element for re-visualization

## License

MIT
