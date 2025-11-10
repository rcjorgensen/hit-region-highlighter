// DevTools integration script
// Initializes the DevTools panel and sets up element selection detection
// Requirements: 1.1.1, 1.1.2

console.log('Hit Region Highlighter: DevTools script loaded');

// Create the DevTools panel
// Requirement: Register panel with chrome.devtools.panels.create()
chrome.devtools.panels.create(
  'Hit Regions',
  '', // No icon for now
  'src/devtools/panel.html',
  (panel) => {
    console.log('Hit Region panel created');
    
    panel.onShown.addListener(() => {
      console.log('Hit Region panel shown');
    });
    
    // Requirement 1.1.4: Detect when element is deselected or DevTools loses focus
    panel.onHidden.addListener(() => {
      console.log('Hit Region panel hidden - clearing visualization');
      // When panel is hidden, clear any active visualization
      // Send 'elementDeselected' message to background script
      chrome.runtime.sendMessage({
        source: 'devtools',
        type: 'elementDeselected',
        tabId: chrome.devtools.inspectedWindow.tabId
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('Error sending elementDeselected message:', chrome.runtime.lastError);
        }
      });
    });
  }
);

// Listen for element selection changes in the Elements panel
// Requirement: Use chrome.devtools.panels.elements.onSelectionChanged
chrome.devtools.panels.elements.onSelectionChanged.addListener(() => {
  console.log('Element selection changed');
  
  // Get the currently selected element using chrome.devtools.inspectedWindow.eval('$0')
  chrome.devtools.inspectedWindow.eval(
    '$0',
    (result, isException) => {
      if (isException) {
        console.error('Error getting selected element:', isException);
        return;
      }
      
      if (result) {
        // Generate element identifier (CSS selector or XPath)
        chrome.devtools.inspectedWindow.eval(
          `(function() {
            const el = $0;
            if (!el) return null;
            
            // Generate unique CSS selector
            function generateSelector(element) {
              // Try ID first (most specific)
              if (element.id) {
                const idSelector = '#' + CSS.escape(element.id);
                // Verify it's unique
                if (document.querySelectorAll(idSelector).length === 1) {
                  return idSelector;
                }
              }
              
              // Build path from element to root
              const path = [];
              let current = element;
              
              while (current && current.nodeType === Node.ELEMENT_NODE) {
                let selector = current.nodeName.toLowerCase();
                
                // Add nth-child if needed for uniqueness
                if (current.parentElement) {
                  const siblings = Array.from(current.parentElement.children);
                  const sameTagSiblings = siblings.filter(s => s.nodeName === current.nodeName);
                  
                  if (sameTagSiblings.length > 1) {
                    const index = sameTagSiblings.indexOf(current) + 1;
                    selector += ':nth-of-type(' + index + ')';
                  }
                }
                
                path.unshift(selector);
                current = current.parentElement;
                
                // Stop at body to keep selector reasonable
                if (current && current.nodeName.toLowerCase() === 'body') {
                  path.unshift('body');
                  break;
                }
              }
              
              return path.join(' > ');
            }
            
            const cssSelector = generateSelector(el);
            
            // Verify selector works
            try {
              const found = document.querySelector(cssSelector);
              if (found === el) {
                return { type: 'css', value: cssSelector };
              }
            } catch (e) {
              console.error('Generated invalid CSS selector:', e);
            }
            
            // Fallback to XPath if CSS selector fails
            function generateXPath(element) {
              if (element.id) {
                return '//*[@id="' + element.id + '"]';
              }
              
              const parts = [];
              let current = element;
              
              while (current && current.nodeType === Node.ELEMENT_NODE) {
                let index = 0;
                let sibling = current.previousSibling;
                
                while (sibling) {
                  if (sibling.nodeType === Node.ELEMENT_NODE && 
                      sibling.nodeName === current.nodeName) {
                    index++;
                  }
                  sibling = sibling.previousSibling;
                }
                
                const tagName = current.nodeName.toLowerCase();
                const pathIndex = index > 0 ? '[' + (index + 1) + ']' : '';
                parts.unshift(tagName + pathIndex);
                
                current = current.parentElement;
              }
              
              return '/' + parts.join('/');
            }
            
            return { type: 'xpath', value: generateXPath(el) };
          })()`,
          (elementId, isException) => {
            if (!isException && elementId) {
              console.log('Generated element identifier:', elementId);
              
              // Send 'elementSelected' message to background script
              chrome.runtime.sendMessage({
                source: 'devtools',
                type: 'elementSelected',
                elementId: elementId,
                tabId: chrome.devtools.inspectedWindow.tabId
              }, (response) => {
                if (chrome.runtime.lastError) {
                  console.error('Error sending elementSelected message:', chrome.runtime.lastError);
                } else {
                  console.log('elementSelected message sent successfully:', response);
                }
              });
            } else {
              console.error('Failed to generate element identifier:', isException);
            }
          }
        );
      } else {
        // Requirement 1.1.4: Detect when element is deselected
        // No element selected - send deselection message
        console.log('No element selected, sending deselection message');
        chrome.runtime.sendMessage({
          source: 'devtools',
          type: 'elementDeselected',
          tabId: chrome.devtools.inspectedWindow.tabId
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('Error sending elementDeselected message:', chrome.runtime.lastError);
          }
        });
      }
    }
  );
});

// Element hover detection
// Requirement: 1.1.2 - Listen for hover events in Elements panel (if API available)
// Note: Chrome DevTools API does not provide a native hover event for elements in the Elements panel
// The requirement specifies "if API available" - since this API is not available in Chrome DevTools,
// we rely on element selection as the primary interaction method.
// 
// Alternative approaches considered:
// - Polling $0 to detect changes (significant performance impact)
// - Custom UI in the panel for hover-like interactions
// - Using the Elements panel selection as the primary interaction method (current approach)
//
// The current implementation provides immediate visualization when an element is selected,
// which provides a similar user experience to hover-based visualization.

console.log('DevTools integration initialized - element selection detection active');
