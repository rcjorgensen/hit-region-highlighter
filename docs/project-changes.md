# Project Changes Log

## Recent Implementation Changes

### Device Pixel Sampling Adjustment (HitRegionCalculator)
- Simplified device pixel coordinate calculation in `sampleCoordinate()` function
- Changed from `(Math.floor(x * dpr) + 0.5) / dpr` to `(Math.floor(x * dpr)) / dpr`
- Removes the pixel center offset (`+ 0.5`) to align with CSS pixel boundaries
- Maps CSS coordinates to device pixel indices and back without sub-pixel offsets
- Ensures consistent sampling behavior across different device pixel ratios

### Visualization Refinement (CanvasRenderer)
- Reduced hit region dot radius from 2 pixels to 1 pixel
- Makes visualization more precise and less visually intrusive
- Provides cleaner, more accurate representation of sampled coordinates

## Recent Structural Changes

### Test Files Organization
- Moved all test HTML files from root directory to `test/` directory
- Files moved:
  - `test-page.html` → `test/test-page.html`
  - `test-message-flow.html` → `test/test-message-flow.html`
  - `test-configuration.html` → `test/test-configuration.html`
  - `test-page-changes.html` → `test/test-page-changes.html`

### Content Script Loading Architecture
- Added `src/content-loader.js` as a new entry point for content scripts
- Implements two-stage loading approach:
  1. `content-loader.js` is registered in manifest.json as the content script
  2. Uses dynamic import to load `content.js` as an ES6 module
  3. All source modules listed in `web_accessible_resources` for dynamic import support
- This approach maintains full ES6 module support while working around Chrome's content script limitations

### Documentation Structure
- Created `docs/` directory for additional documentation
- Main README.md remains at project root
- Agent hook configured to auto-update documentation when source files change

### Kiro IDE Integration
- Added agent hook: `docs-sync-on-source-change.kiro.hook`
- Automatically triggers documentation updates when source files are modified
- Watches: `src/**/*.js`, `src/**/*.html`, `manifest.json`, `create-icons.html`

## Updated Documentation
All documentation has been updated to reflect these changes:
- `.kiro/steering/structure.md` - Updated directory structure and module responsibilities
- `.kiro/steering/tech.md` - Added content script loading explanation
- `README.md` - Updated project structure and module loading flow
