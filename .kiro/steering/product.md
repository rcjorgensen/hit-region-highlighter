---
inclusion: always
---

# Product Overview

Hit Region Highlighter is a browser extension that visualizes the clickable hit regions of interactive elements when they are selected or hovered in DevTools.

## Core Functionality

- Pre-calculates hit regions for all interactive elements on page load
- Instantly visualizes hit regions as green dots when elements are selected in DevTools
- Configurable sampling resolution, highlight color, and opacity
- Automatic recalculation on DOM and layout changes
- Works with buttons, links, and other interactive elements (role="button", role="link", etc.)

## Target Platform

Chrome/Edge browser extension using Manifest V3. Firefox support is planned but not yet implemented.

## Key User Flows

1. Developer opens DevTools on any webpage
2. Navigates to the "Hit Regions" panel
3. Selects an interactive element in the Elements panel
4. Hit region visualization appears as colored dots on the page
5. Can configure visualization settings via Options page
