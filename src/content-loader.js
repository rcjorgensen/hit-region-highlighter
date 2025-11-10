// Content script injector for Hit Region Highlighter
// Uses dynamic import to load ES6 modules in content script context

(async () => {
  try {
    // Get the extension URL for the content script module
    const contentScriptUrl = chrome.runtime.getURL("src/content.js");

    // Use dynamic import to load the module in content script context
    await import(contentScriptUrl);
  } catch (error) {
    console.error(
      "Failed to load Hit Region Highlighter content script:",
      error,
    );
  }
})();
