// Background script for Hit Region Highlighter extension
// Handles message routing between DevTools and content scripts

console.log('Hit Region Highlighter: Background script loaded');

// Message routing system
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message, 'from:', sender);
  
  // Route messages from DevTools to content script
  if (message.source === 'devtools') {
    const tabId = message.tabId;
    
    // Validate tabId
    if (!tabId) {
      console.error('No tabId provided in DevTools message');
      sendResponse({ error: 'No tabId provided' });
      return true;
    }
    
    // Forward message to content script
    // Include elementId if present (for elementSelected/elementHovered messages)
    const forwardedMessage = {
      type: message.type,
      source: 'devtools'
    };
    
    // Add elementId if present
    if (message.elementId) {
      forwardedMessage.elementId = message.elementId;
    }
    
    // Add any additional data
    if (message.data) {
      forwardedMessage.data = message.data;
    }
    
    chrome.tabs.sendMessage(tabId, forwardedMessage, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending message to content script:', chrome.runtime.lastError);
        sendResponse({ error: chrome.runtime.lastError.message });
      } else {
        sendResponse(response || { success: true });
      }
    });
    return true; // Keep channel open for async response
  }
  
  // Route messages from content script to DevTools
  if (message.source === 'content') {
    // Content scripts can send status updates or responses
    console.log('Content script message:', message.type);
    
    // If there's a specific DevTools connection for this tab, forward the message
    // For now, just acknowledge receipt
    sendResponse({ received: true });
    return true;
  }
  
  // Unknown message source
  console.warn('Unknown message source:', message.source);
  sendResponse({ error: 'Unknown message source' });
  return true;
});

// Tab management - track active tabs with extension loaded
const activeTabs = new Set();

// Initialize: get all existing tabs
chrome.tabs.query({}, (tabs) => {
  tabs.forEach(tab => {
    if (tab.id) {
      activeTabs.add(tab.id);
    }
  });
  console.log('Initialized with tabs:', Array.from(activeTabs));
});

// Handle tab removal - clean up state
chrome.tabs.onRemoved.addListener((tabId) => {
  if (activeTabs.has(tabId)) {
    activeTabs.delete(tabId);
    console.log('Tab closed and removed from active tabs:', tabId);
  }
});

// Handle tab updates - track when content script is ready
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  // Add tab when it completes loading
  if (changeInfo.status === 'complete') {
    activeTabs.add(tabId);
    console.log('Tab loaded and added to active tabs:', tabId);
  }
  
  // Remove tab if URL changes to a non-http(s) page
  if (changeInfo.url && !changeInfo.url.startsWith('http')) {
    activeTabs.delete(tabId);
    console.log('Tab navigated to non-http URL, removed from active tabs:', tabId);
  }
});

// Handle tab activation - ensure we track the active tab
chrome.tabs.onActivated.addListener((activeInfo) => {
  const tabId = activeInfo.tabId;
  // Verify tab is valid before adding
  chrome.tabs.get(tabId, (tab) => {
    if (!chrome.runtime.lastError && tab.url && tab.url.startsWith('http')) {
      activeTabs.add(tabId);
      console.log('Tab activated:', tabId);
    }
  });
});

// Helper function to check if a tab is active
function isTabActive(tabId) {
  return activeTabs.has(tabId);
}

// Helper function to get active tabs
function getActiveTabs() {
  return Array.from(activeTabs);
}
