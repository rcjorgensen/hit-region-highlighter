# Implementation Plan

- [x] 1. Set up browser extension project structure and manifest
  - Create directory structure for extension (src/, manifest.json, icons/)
  - Write manifest.json with required permissions (activeTab, storage, devtools)
  - Configure content scripts, background script, and devtools page entries
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Implement coordinate and data model utilities
  - [x] 2.1 Create Coordinate interface and utility functions ✓
    - ✓ Define Coordinate type with x, y properties
    - ✓ Implement coordToKey() function for map keys
    - ✓ Implement keyToCoord() function for reverse conversion
    - ✓ Implement coordEquals() for coordinate comparison
    - ✓ Implement isValidCoordinate() for validation
    - ✓ Implement createCoordinate() factory function
    - _Requirements: 2.1, 2.3_
  
  - [x] 2.2 Implement HitRegionMap class
    - Create class with elementToCoordinates and coordinateToElement maps
    - Implement addCoordinate(), getCoordinates(), getElement() methods
    - Implement clear() method for invalidation
    - Use WeakMap for element references to prevent memory leaks
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 3. Implement Interactive Element Finder
  - [x] 3.1 Create isInteractive() function
    - Check element role attribute (explicit and implicit ARIA roles)
    - Verify role is 'button' or 'link'
    - Check computed style pointer-events property
    - Return false if pointer-events is 'none'
    - _Requirements: 3.2, 3.3_
  
  - [x] 3.2 Create findInteractiveAncestor() function
    - Traverse DOM tree from element to document root
    - Check each ancestor with isInteractive()
    - Return first interactive ancestor found
    - Return null if no interactive ancestor exists
    - _Requirements: 3.1, 3.4, 3.5_

- [x] 4. Implement Hit Region Calculator
  - [x] 4.1 Create generateCoordinateGrid() function
    - ✓ Accept resolution parameter (pixels between samples)
    - ✓ Get viewport dimensions using window.innerWidth/innerHeight
    - ✓ Generate array of coordinates covering viewport with specified resolution
    - _Requirements: 2.1, 2.2_
  
  - [x] 4.2 Create sampleCoordinate() function
    - ✓ Call document.elementFromPoint(x, y)
    - ✓ Handle null returns gracefully
    - ✓ Call findInteractiveAncestor() on returned element
    - ✓ Return interactive element or null
    - _Requirements: 2.3, 3.1_
  
  - [x] 4.3 Create calculate() function
    - ✓ Generate coordinate grid using configured resolution
    - ✓ Loop through all coordinates and sample each one
    - ✓ Build coordinate-to-element mapping
    - ✓ Reverse mapping to create element-to-coordinates map
    - ✓ Return HitRegionMap instance
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 4.3_
  
  - [x] 4.4 Create getHitRegion() function
    - ✓ Accept element parameter
    - ✓ Look up element in HitRegionMap
    - ✓ Return array of coordinates for that element
    - _Requirements: 4.4_
  
  - [x] 4.5 Add performance monitoring
    - ✓ Track calculation start and end time
    - ✓ Log warning if calculation exceeds 500ms threshold
    - _Requirements: 2.4_

- [x] 5. Implement Canvas Renderer
  - [x] 5.1 Create createOverlay() function
    - ✓ Create canvas element with viewport dimensions
    - ✓ Set canvas position to fixed with top: 0, left: 0
    - ✓ Set high z-index (2147483647) to appear above page content
    - ✓ Set pointer-events: none to avoid blocking interactions
    - ✓ Append canvas to document.body
    - ✓ Return canvas element
    - _Requirements: 5.1, 5.2_
  
  - [x] 5.2 Create renderHitRegion() function
    - ✓ Accept coordinates array, color, and opacity parameters
    - ✓ Get 2D rendering context from canvas
    - ✓ Set fillStyle with color and globalAlpha with opacity
    - ✓ Loop through coordinates and draw small circles at each point
    - ✓ Use requestAnimationFrame for smooth rendering
    - _Requirements: 5.3, 5.4_
  
  - [x] 5.3 Create clear() and destroy() functions
    - ✓ Implement clear() to clear canvas context
    - ✓ Implement destroy() to remove canvas from DOM
    - ✓ Added hasOverlay() helper method
    - ✓ Added updateDimensions() for viewport resize handling
    - _Requirements: 5.5_

- [x] 6. Implement Configuration Manager
  - [x] 6.1 Create Configuration interface and default values
    - Define Configuration type with samplingResolution, highlightColor, highlightOpacity, autoRecalculate
    - Set default values (resolution: 10, color: '#00ff00', opacity: 0.3, autoRecalculate: true)
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 6.2 Implement configuration storage and retrieval
    - Create loadConfiguration() function using browser.storage.sync.get()
    - Create saveConfiguration() function using browser.storage.sync.set()
    - Merge loaded config with defaults for missing values
    - _Requirements: 7.4_
  
  - [x] 6.3 Create configuration change listener
    - Listen for browser.storage.onChanged events
    - Trigger recalculation when relevant settings change
    - Update visualization with new color/opacity in real-time
    - _Requirements: 7.5_

- [x] 7. Implement Content Script orchestration
  - [x] 7.1 Create initialize() function
    - Load configuration from storage
    - Create HitRegionCalculator instance
    - Trigger initial hit region calculation
    - Store HitRegionMap in memory
    - Set up message listeners for DevTools communication
    - _Requirements: 1.1, 1.3_
  
  - [x] 7.2 Create calculateHitRegions() function
    - Call calculator.calculate() with configured resolution
    - Store resulting HitRegionMap
    - Log calculation time and statistics
    - _Requirements: 1.1, 1.2_
  
  - [x] 7.3 Create visualizeHitRegion() function
    - Accept element parameter
    - Retrieve coordinates from HitRegionMap
    - Create canvas overlay if not exists
    - Call renderer.renderHitRegion() with coordinates and config
    - _Requirements: 1.1.3, 5.3, 5.4_
  
  - [x] 7.4 Create clearVisualization() function
    - Call renderer.clear() to remove visualization
    - _Requirements: 1.1.4, 5.5_
  
  - [x] 7.5 Implement message handlers
    - Handle 'elementSelected' message: call visualizeHitRegion()
    - Handle 'elementHovered' message: call visualizeHitRegion()
    - Handle 'elementDeselected' message: call clearVisualization()
    - Parse element identifier and find element in DOM
    - _Requirements: 1.1.1, 1.1.2, 1.1.4_

- [x] 8. Implement DOM and layout change detection
  - [x] 8.1 Set up MutationObserver
    - Create MutationObserver to watch for DOM changes
    - Configure to observe childList, subtree, and attributes
    - Debounce callback to avoid excessive recalculation (300ms)
    - _Requirements: 6.1, 6.3_
  
  - [x] 8.2 Set up ResizeObserver
    - Create ResizeObserver to watch for viewport size changes
    - Debounce callback to avoid excessive recalculation (200ms)
    - _Requirements: 2.5, 6.2_
  
  - [x] 8.3 Implement handlePageChanges() function
    - Invalidate current HitRegionMap
    - Check if autoRecalculate is enabled in config
    - Trigger recalculation if enabled
    - Re-visualize currently selected element if exists
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [x] 8.4 Add CSS change detection
    - Use MutationObserver to watch for style attribute changes
    - Monitor for changes to pointer-events and position-related properties
    - Trigger recalculation when relevant CSS changes detected
    - _Requirements: 6.5_

- [x] 9. Implement Background Script
  - [x] 9.1 Create message routing system
    - Set up chrome.runtime.onMessage listener
    - Route messages from DevTools to appropriate content script tab
    - Route messages from content scripts to DevTools
    - _Requirements: 1.1.1, 1.1.2_
  
  - [x] 9.2 Implement tab management
    - Track which tabs have the extension active
    - Handle tab close events to clean up state
    - Ensure messages are sent to correct tab
    - _Requirements: 1.1.1, 1.1.2_

- [x] 10. Implement DevTools Panel
  - [x] 10.1 Create devtools.html and devtools.js
    - Create HTML page for DevTools panel
    - Create script to initialize DevTools integration
    - Register panel with chrome.devtools.panels.create()
    - _Requirements: 1.1.1, 1.1.2_
  
  - [x] 10.2 Implement element selection detection
    - Use chrome.devtools.panels.elements.onSelectionChanged
    - Get selected element using chrome.devtools.inspectedWindow.eval('$0')
    - Generate element identifier (CSS selector or XPath)
    - Send 'elementSelected' message to background script
    - _Requirements: 1.1.1_
  
  - [x] 10.3 Implement element hover detection
    - Listen for hover events in Elements panel (if API available)
    - Generate element identifier for hovered element
    - Send 'elementHovered' message to background script
    - _Requirements: 1.1.2_
  
  - [x] 10.4 Implement deselection detection
    - Detect when element is deselected or DevTools loses focus
    - Send 'elementDeselected' message to background script
    - _Requirements: 1.1.4_

- [x] 11. Create element identifier utilities
  - [x] 11.1 Implement generateElementIdentifier() function
    - Generate unique CSS selector for element
    - Fallback to XPath if CSS selector is not unique
    - Return ElementIdentifier object with type and value
    - _Requirements: 1.1.1, 1.1.2_
  
  - [x] 11.2 Implement findElementByIdentifier() function
    - Accept ElementIdentifier parameter
    - Use document.querySelector() for CSS selectors
    - Use document.evaluate() for XPath
    - Return found element or null
    - _Requirements: 1.1.1, 1.1.2_

- [x] 12. Add error handling and edge cases
  - [x] 12.1 Handle calculation errors
    - Catch and log errors from elementFromPoint
    - Handle elements removed during calculation
    - Implement timeout for long-running calculations
    - _Requirements: 2.4_
  
  - [x] 12.2 Handle visualization errors
    - Check if element exists in HitRegionMap before visualizing
    - Handle canvas creation failures gracefully
    - Validate element identifiers from DevTools
    - _Requirements: 1.1.3_
  
  - [x] 12.3 Add performance safeguards
    - Limit maximum coordinates per element
    - Show progress indicator for long calculations
    - Allow calculation cancellation
    - _Requirements: 2.4_

- [x] 13. Create settings UI
  - [x] 13.1 Create options.html page
    - Design settings page with form inputs
    - Add inputs for sampling resolution (slider or number input)
    - Add color picker for highlight color
    - Add slider for highlight opacity
    - Add checkbox for auto-recalculate option
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 13.2 Implement options.js script
    - Load current configuration on page load
    - Populate form inputs with current values
    - Handle form submission to save configuration
    - Show save confirmation message
    - _Requirements: 7.4, 7.5_
  
  - [x] 13.3 Add settings link to DevTools panel
    - Add button or link in DevTools panel to open settings
    - Use chrome.runtime.openOptionsPage() to open settings
    - _Requirements: 7.1_

- [x] 14. Integration and end-to-end wiring
  - [x] 14.1 Wire up content script initialization
    - Ensure content script runs on page load
    - Verify calculation happens automatically
    - Test that HitRegionMap is populated correctly
    - _Requirements: 1.1, 1.2, 1.3_
  
  - [x] 14.2 Wire up DevTools to content script communication
    - Test element selection in DevTools triggers visualization
    - Test element hover in DevTools triggers visualization
    - Test deselection clears visualization
    - Verify messages flow through background script correctly
    - _Requirements: 1.1.1, 1.1.2, 1.1.3, 1.1.4_
  
  - [x] 14.3 Wire up configuration changes
    - Test that configuration changes trigger recalculation
    - Test that visualization updates with new color/opacity
    - Verify settings persist across browser sessions
    - _Requirements: 7.4, 7.5_
  
  - [x] 14.4 Wire up page change detection
    - Test that DOM changes trigger recalculation
    - Test that viewport resize triggers recalculation
    - Test that CSS changes trigger recalculation
    - Verify debouncing prevents excessive recalculation
    - _Requirements: 6.1, 6.2, 6.3, 6.5_
