---
inclusion: always
---

# Project Structure

## Directory Organization

```
/
├── manifest.json              # Extension manifest (Manifest V3)
├── README.md                  # Main project documentation
├── create-icons.html          # Icon generation utility
├── icons/                     # Extension icons (16, 48, 128px)
├── docs/                      # Additional documentation (markdown files)
├── src/                       # All source code
│   ├── background.js          # Background service worker
│   ├── content-loader.js      # Content script loader (dynamic import wrapper)
│   ├── content.js             # Main content script (orchestrator)
│   ├── ConfigurationManager.js
│   ├── CanvasRenderer.js
│   ├── HitRegionCalculator.js
│   ├── InteractiveElementFinder.js
│   ├── ElementIdentifier.js
│   ├── models/                # Data models
│   │   ├── Coordinate.js
│   │   └── HitRegionMap.js
│   ├── devtools/              # DevTools integration
│   │   ├── devtools.html
│   │   ├── devtools.js
│   │   ├── panel.html
│   │   └── panel.js
│   └── options/               # Settings page
│       ├── options.html
│       └── options.js
├── test/                      # Manual test pages
│   ├── test-page.html
│   ├── test-message-flow.html
│   ├── test-configuration.html
│   └── test-page-changes.html
└── .kiro/                     # Kiro IDE configuration
    ├── hooks/                 # Agent hooks
    │   └── docs-sync-on-source-change.kiro.hook
    ├── specs/                 # Feature specifications
    └── steering/              # Agent steering rules
        ├── product.md
        ├── structure.md
        └── tech.md
```

## Documentation Location

All markdown documentation files should be created in the `docs/` directory. This includes:
- Feature documentation
- Architecture diagrams
- Design decisions
- API documentation
- Any other markdown files created during development

Exceptions:
- README.md at the root is the main project documentation
- README.md files can exist in specific directories (like `icons/README.md`) when they describe that specific directory's contents

## Agent Hooks

The project uses Kiro agent hooks for automation:
- **docs-sync-on-source-change.kiro.hook**: Automatically triggers documentation updates when source files are modified. Watches src/**/*.js, src/**/*.html, manifest.json, and create-icons.html.

## Module Responsibilities

### Core Orchestration

- **content-loader.js**: Entry point content script that uses dynamic import to load content.js as an ES6 module
- **content.js**: Main orchestrator - initializes all components, handles messages from DevTools, manages state, coordinates calculation and visualization

### Calculation & Detection

- **HitRegionCalculator.js**: Samples viewport coordinates, builds hit region mappings
- **InteractiveElementFinder.js**: Identifies interactive elements (buttons, links, ARIA roles)
- **ElementIdentifier.js**: Converts DevTools element references to DOM elements

### Rendering & Configuration

- **CanvasRenderer.js**: Creates canvas overlay, renders hit region visualizations
- **ConfigurationManager.js**: Loads/saves settings from chrome.storage.sync, notifies listeners of changes

### Data Models

- **Coordinate.js**: Coordinate utilities (coordToKey, keyToCoord, validation)
- **HitRegionMap.js**: Bidirectional mapping between elements and coordinates using WeakMap

### Extension Integration

- **background.js**: Service worker for extension lifecycle
- **devtools/**: DevTools panel integration
- **options/**: Settings UI

### Testing

- **test/**: Manual test pages for different functionality
  - test-page.html: Basic functionality
  - test-message-flow.html: Message routing
  - test-configuration.html: Configuration changes
  - test-page-changes.html: Page change detection

## File Naming Conventions

- PascalCase for classes and modules: `ConfigurationManager.js`, `HitRegionMap.js`
- camelCase for utility modules: `content.js`, `background.js`
- Lowercase with hyphens for HTML: `test-page.html`, `panel.html`

## Import Patterns

All imports use relative paths with `.js` extension:

```javascript
import { ConfigurationManager } from "./ConfigurationManager.js";
import { HitRegionMap } from "./models/HitRegionMap.js";
```

## State Management

Global state lives in `content.js`:

- `hitRegionMap`: Current hit region mappings
- `currentConfig`: Current configuration
- `currentlySelectedElement`: Element being visualized
- `renderer`: CanvasRenderer instance
- Observers: `mutationObserver`, `resizeObserver`
