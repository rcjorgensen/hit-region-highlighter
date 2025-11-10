# Design Document: Hit Region Highlighter Extension

## Overview

The Hit Region Highlighter is a browser extension that visualizes the clickable areas (hit regions) of interactive elements on a webpage. The extension works by pre-calculating a mapping between viewport coordinates and interactive elements, then displaying this mapping as a visual overlay when developers inspect elements in DevTools.

The system operates in two distinct phases:
1. **Calculation Phase**: Proactively samples the viewport and builds element-to-coordinates mappings
2. **Visualization Phase**: Instantly displays pre-calculated hit regions when elements are selected in DevTools

## Architecture

### High-Level Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                     Browser Extension                         │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐      ┌─────────────┐  │
│  │   Content    │◄────►│   Background │◄────►│   DevTools  │  │
│  │   Script     │      │    Script    │      │    Panel    │  │
│  └──────────────┘      └──────────────┘      └─────────────┘  │
│         │                                                     │
│         │                                                     │
│         ▼                                                     │
│  ┌────────────────────────────────────────────────────────┐   │
│  │           Hit Region Calculator                        │   │
│  │  - Coordinate Grid Generator                           │   │
│  │  - Element Sampler (elementFromPoint)                  │   │
│  │  - Interactive Element Finder                          │   │
│  │  - Coordinate-to-Element Mapper                        │   │
│  └────────────────────────────────────────────────────────┘   │
│         │                                                     │
│         ▼                                                     │
│  ┌────────────────────────────────────────────────────────┐   │
│  │           Canvas Renderer                              │   │
│  │  - Canvas Overlay Manager                              │   │
│  │  - Hit Region Visualizer                               │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                               │
└───────────────────────────────────────────────────────────────┘
                            │
                            ▼
                   ┌────────────────┐
                   │   Web Page     │
                   │   (DOM)        │
                   └────────────────┘
```

### Component Interaction Flow

1. **Initialization**: Content script loads → Calculator samples viewport → Builds hit region map
2. **DevTools Interaction**: User selects element → DevTools panel notifies background script → Background script sends message to content script
3. **Visualization**: Content script retrieves pre-calculated coordinates → Canvas renderer draws overlay
4. **Updates**: DOM/Layout changes detected → Calculator rebuilds hit region map

## Components and Interfaces

### 1. Content Script

**Responsibility**: Orchestrates hit region calculation and visualization within the webpage context

**Key Functions**:
- `initialize()`: Sets up the extension when the page loads
- `calculateHitRegions()`: Triggers the calculation phase
- `visualizeHitRegion(element)`: Displays the hit region for a given element
- `clearVisualization()`: Removes the canvas overlay
- `handlePageChanges()`: Responds to DOM mutations and layout changes

**Message Handlers**:
- `onElementSelected(elementId)`: Receives element selection from DevTools
- `onElementHovered(elementId)`: Receives element hover from DevTools
- `onElementDeselected()`: Receives deselection notification

### 2. Hit Region Calculator

**Responsibility**: Samples the viewport and builds the element-to-coordinates mapping

**Interface**:
```typescript
interface HitRegionCalculator {
  calculate(resolution: number): HitRegionMap;
  getHitRegion(element: Element): Coordinate[];
  invalidate(): void;
}

interface HitRegionMap {
  elementToCoordinates: Map<Element, Set<Coordinate>>;
  coordinateToElement: Map<string, Element>;
}

interface Coordinate {
  x: number;
  y: number;
}
```

**Key Functions**:
- `generateCoordinateGrid(resolution)`: Creates sampling points across viewport
- `sampleCoordinate(x, y)`: Uses elementFromPoint to find element at coordinate
- `findInteractiveAncestor(element)`: Traverses DOM to find clickable ancestor
- `buildReverseMapping()`: Creates element → coordinates map from coordinate → element data
- `isInteractiveElement(element)`: Checks if element has role=button/link and valid pointer-events

**Algorithm**:
```
1. Get viewport dimensions (width, height)
2. Generate grid: for x in [0, width] step resolution
                  for y in [0, height] step resolution
3. For each coordinate (x, y):
   a. element = document.elementFromPoint(x, y)
   b. interactive = findInteractiveAncestor(element)
   c. if interactive exists:
      - Add (x, y) to coordinateToElement map
4. Reverse the mapping:
   For each (coordinate, element) in coordinateToElement:
      - Add coordinate to elementToCoordinates[element]
5. Return HitRegionMap
```

### 3. Interactive Element Finder

**Responsibility**: Identifies which element should handle clicks at a given coordinate

**Interface**:
```typescript
interface InteractiveElementFinder {
  findInteractiveAncestor(element: Element): Element | null;
  isInteractive(element: Element): boolean;
}
```

**Key Functions**:
- `isInteractive(element)`: Returns true if element has role=button or role=link AND pointer-events is not "none"
- `findInteractiveAncestor(element)`: Walks up DOM tree until finding interactive element or reaching document root

**Algorithm**:
```
function findInteractiveAncestor(element):
  current = element
  while current != null and current != document:
    if isInteractive(current):
      return current
    current = current.parentElement
  return null

function isInteractive(element):
  role = element.getAttribute('role') or element.implicit role
  pointerEvents = getComputedStyle(element).pointerEvents
  return (role == 'button' or role == 'link') and pointerEvents != 'none'
```

### 4. Canvas Renderer

**Responsibility**: Manages the canvas overlay and renders hit region visualizations

**Interface**:
```typescript
interface CanvasRenderer {
  createOverlay(): HTMLCanvasElement;
  renderHitRegion(coordinates: Coordinate[], color: string, opacity: number): void;
  clear(): void;
  destroy(): void;
}
```

**Key Functions**:
- `createOverlay()`: Creates and positions canvas element over the page
- `renderHitRegion(coordinates, color, opacity)`: Draws pixels/shapes at each coordinate
- `clear()`: Clears the canvas
- `destroy()`: Removes canvas from DOM

**Rendering Strategy**:
- Create canvas with same dimensions as viewport
- Position: fixed, top: 0, left: 0, z-index: high value
- Pointer-events: none (to avoid interfering with page interaction)
- Use fillRect or arc to draw at each coordinate
- Apply color and opacity from configuration

### 5. Background Script

**Responsibility**: Coordinates communication between DevTools and content scripts

**Key Functions**:
- `onDevToolsMessage(message)`: Receives messages from DevTools panel
- `forwardToContentScript(tabId, message)`: Sends messages to appropriate tab's content script
- `onContentScriptMessage(message)`: Receives status updates from content scripts

### 6. DevTools Panel

**Responsibility**: Detects element selection/hover in DevTools and communicates with background script

**Key Functions**:
- `onElementSelected()`: Triggered when user selects element in Elements panel
- `onElementHovered()`: Triggered when user hovers over element in Elements panel
- `sendElementInfo(element)`: Sends element identifier to background script

**Element Identification**:
- Use `$0` (currently selected element in DevTools)
- Generate unique identifier (e.g., XPath or CSS selector)
- Send identifier to content script for lookup

### 7. Configuration Manager

**Responsibility**: Manages user settings and preferences

**Interface**:
```typescript
interface Configuration {
  samplingResolution: number; // pixels between sample points
  highlightColor: string;     // hex color code
  highlightOpacity: number;   // 0.0 to 1.0
  autoRecalculate: boolean;   // recalculate on DOM changes
}
```

**Storage**: Use browser.storage.sync for cross-device persistence

## Data Models

### HitRegionMap

```typescript
class HitRegionMap {
  private elementToCoordinates: Map<Element, Set<Coordinate>>;
  private coordinateToElement: Map<string, Element>;
  
  addCoordinate(element: Element, coord: Coordinate): void;
  getCoordinates(element: Element): Coordinate[];
  getElement(coord: Coordinate): Element | null;
  clear(): void;
}
```

### Coordinate

```typescript
interface Coordinate {
  x: number;
  y: number;
}

// Helper function for map keys
function coordToKey(coord: Coordinate): string {
  return `${coord.x},${coord.y}`;
}
```

### ElementIdentifier

```typescript
interface ElementIdentifier {
  type: 'xpath' | 'css' | 'id';
  value: string;
}

// Used to communicate element references between DevTools and content script
```

## Error Handling

### Calculation Errors

1. **elementFromPoint returns null**: Skip coordinate and continue
2. **Element removed during calculation**: Invalidate and restart calculation
3. **Calculation timeout**: Use partial results or reduce resolution automatically

### Visualization Errors

1. **Element not found in map**: Log warning, show message to user
2. **Canvas creation fails**: Fallback to console logging or disable visualization
3. **Invalid element identifier from DevTools**: Request re-selection

### Performance Issues

1. **Calculation takes too long**: 
   - Show progress indicator
   - Allow cancellation
   - Suggest reducing resolution
2. **Memory constraints**: 
   - Limit maximum number of coordinates stored
   - Use coordinate compression for dense regions

## Testing Strategy

### Unit Tests

1. **HitRegionCalculator**:
   - Test coordinate grid generation with various resolutions
   - Test findInteractiveAncestor with different DOM structures
   - Test isInteractive with various element types and styles
   - Test reverse mapping logic

2. **InteractiveElementFinder**:
   - Test role detection (explicit and implicit)
   - Test pointer-events detection
   - Test ancestor traversal

3. **CanvasRenderer**:
   - Test canvas creation and positioning
   - Test rendering with different coordinate sets
   - Test clear and destroy operations

### Integration Tests

1. **End-to-End Flow**:
   - Load page → Calculate regions → Select element → Verify visualization
   - Test with various page layouts (buttons, links, nested elements)
   - Test with dynamic content (SPAs, lazy-loaded elements)

2. **DevTools Integration**:
   - Test element selection detection
   - Test element hover detection
   - Test message passing between components

3. **Performance Tests**:
   - Measure calculation time for various viewport sizes
   - Measure memory usage with large numbers of interactive elements
   - Test responsiveness during calculation

### Manual Testing Scenarios

1. Complex layouts (overlapping elements, z-index variations)
2. Elements with CSS transforms
3. Scrollable containers
4. Iframes
5. Shadow DOM
6. Different browsers (Chrome, Firefox, Edge)

## Performance Considerations

### Calculation Optimization

1. **Resolution Selection**:
   - Default: 10px (good balance)
   - Low: 20px (faster, less accurate)
   - High: 5px (slower, more accurate)

2. **Caching**:
   - Cache computed styles for elements
   - Cache role lookups
   - Reuse elementFromPoint results when possible

3. **Debouncing**:
   - Debounce DOM mutation observers (300ms)
   - Debounce resize events (200ms)
   - Throttle scroll events if needed

### Rendering Optimization

1. **Canvas Techniques**:
   - Use requestAnimationFrame for smooth rendering
   - Batch coordinate drawing operations
   - Consider using OffscreenCanvas for background rendering

2. **Memory Management**:
   - Clear old visualizations promptly
   - Limit coordinate set size per element
   - Use WeakMap for element references where possible

## Browser Compatibility

### Target Browsers
- Chrome/Edge (Chromium): Primary target
- Firefox: Secondary target

### Extension APIs Used
- `chrome.devtools.*`: DevTools integration
- `chrome.runtime.*`: Message passing
- `chrome.storage.*`: Configuration persistence
- `chrome.tabs.*`: Tab management

### Web APIs Used
- `document.elementFromPoint()`: Core sampling mechanism
- `getComputedStyle()`: Style inspection
- `MutationObserver`: DOM change detection
- `ResizeObserver`: Layout change detection
- Canvas API: Visualization rendering

## Security Considerations

1. **Content Security Policy**: Ensure canvas rendering complies with page CSP
2. **XSS Prevention**: Sanitize any user-provided configuration values
3. **Permission Scope**: Request minimal necessary permissions
4. **Data Privacy**: Don't transmit page content or user interactions externally

## Future Enhancements

1. **Advanced Visualization**:
   - Heat maps showing click probability
   - Boundary outlines instead of filled regions
   - Animation effects

2. **Analysis Features**:
   - Detect overlapping hit regions
   - Identify elements with no hit region
   - Calculate hit region coverage percentage

3. **Performance**:
   - Web Worker for calculation
   - Incremental calculation for large pages
   - Smart sampling (focus on interactive areas)

4. **DevTools Integration**:
   - Custom DevTools panel
   - Inline hit region metrics
   - Comparison mode for before/after changes
