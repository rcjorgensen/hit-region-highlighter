// Panel UI script
// Handles user interactions in the DevTools panel

console.log('Hit Region Highlighter: Panel script loaded');

const statusElement = document.getElementById('status');
const settingsBtn = document.getElementById('settingsBtn');

// Open settings page
settingsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// Update status display
function updateStatus(message) {
  if (statusElement) {
    statusElement.textContent = message;
  }
}

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'statusUpdate') {
    updateStatus(message.status);
  }
});

updateStatus('Ready - Select an element to begin');
