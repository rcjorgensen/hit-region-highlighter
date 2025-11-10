---
inclusion: always
---

# Technical Stack

## Core Technologies

- **JavaScript ES6 Modules**: All source files use ES6 module syntax with import/export
- **Chrome Extension API**: Manifest V3 with service workers
- **Web APIs**: Canvas API, MutationObserver, ResizeObserver, chrome.storage.sync

## No Build System

This project has no build step, bundler, or transpilation. All JavaScript runs directly in the browser as ES6 modules.

## Content Script Loading

The extension uses a two-stage loading approach for ES6 modules in content scripts:
1. **content-loader.js**: Registered as the content script in manifest.json, uses dynamic import to load content.js
2. **content.js**: Main ES6 module that imports all other modules
3. All source modules are listed in manifest.json's web_accessible_resources to enable dynamic imports

This approach works around Chrome's content script module loading limitations while maintaining full ES6 module support.

## Key Libraries & Frameworks

None. This is a vanilla JavaScript project with no external dependencies.

## Architecture Patterns

- **Module-based architecture**: Each component is a separate ES6 module
- **Singleton pattern**: ConfigurationManager, CanvasRenderer are instantiated once
- **Observer pattern**: MutationObserver and ResizeObserver for change detection
- **WeakMap for memory management**: HitRegionMap uses WeakMap to prevent memory leaks

## Common Commands

### Load Extension

```bash
# No build needed - load directly in Chrome
# 1. Navigate to chrome://extensions/
# 2. Enable "Developer mode"
# 3. Click "Load unpacked"
# 4. Select the project directory
```

### Testing

Open test pages in browser with extension loaded (all located in `test/` directory):

- `test/test-page.html` - Basic functionality
- `test/test-message-flow.html` - Message routing
- `test/test-configuration.html` - Configuration changes
- `test/test-page-changes.html` - Page change detection

No automated test runner. All testing is manual via browser.

## Performance Considerations

- Hit region calculation should complete in < 500ms
- Debounced DOM change detection (300ms for mutations, 200ms for resize)
- Progress indicators shown for calculations exceeding 500ms
- Maximum 10,000 coordinates per element as safeguard
