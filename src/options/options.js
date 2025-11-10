// Options page script
// Handles loading and saving user configuration

console.log('Hit Region Highlighter: Options script loaded');

const resolutionInput = document.getElementById('resolution');
const colorInput = document.getElementById('color');
const opacityInput = document.getElementById('opacity');
const opacityValue = document.getElementById('opacityValue');
const autoRecalculateInput = document.getElementById('autoRecalculate');
const saveBtn = document.getElementById('saveBtn');
const message = document.getElementById('message');

// Load configuration on page load
async function loadConfiguration() {
  try {
    const result = await chrome.storage.sync.get('hitRegionConfig');
    const config = result.hitRegionConfig || {
      samplingResolution: 10,
      highlightColor: '#00ff00',
      highlightOpacity: 0.3,
      autoRecalculate: true
    };
    
    // Populate form inputs with current values
    resolutionInput.value = config.samplingResolution;
    colorInput.value = config.highlightColor;
    opacityInput.value = Math.round(config.highlightOpacity * 100);
    opacityValue.textContent = Math.round(config.highlightOpacity * 100) + '%';
    autoRecalculateInput.checked = config.autoRecalculate;
    
    console.log('Configuration loaded:', config);
  } catch (error) {
    console.error('Failed to load configuration:', error);
  }
}

// Update opacity display as user moves slider
opacityInput.addEventListener('input', () => {
  opacityValue.textContent = opacityInput.value + '%';
});

// Handle form submission to save configuration
saveBtn.addEventListener('click', async () => {
  try {
    const config = {
      samplingResolution: parseInt(resolutionInput.value, 10),
      highlightColor: colorInput.value,
      highlightOpacity: parseInt(opacityInput.value, 10) / 100,
      autoRecalculate: autoRecalculateInput.checked
    };
    
    // Validate configuration values
    if (config.samplingResolution < 1 || config.samplingResolution > 50) {
      alert('Sampling resolution must be between 1 and 50 pixels');
      return;
    }
    
    if (!/^#[0-9A-Fa-f]{6}$/.test(config.highlightColor)) {
      alert('Invalid color format');
      return;
    }
    
    if (config.highlightOpacity < 0 || config.highlightOpacity > 1) {
      alert('Opacity must be between 0 and 100%');
      return;
    }
    
    // Save configuration
    await chrome.storage.sync.set({ hitRegionConfig: config });
    console.log('Configuration saved:', config);
    
    // Show save confirmation message
    message.style.display = 'block';
    setTimeout(() => {
      message.style.display = 'none';
    }, 3000);
  } catch (error) {
    console.error('Failed to save configuration:', error);
    alert('Failed to save settings. Please try again.');
  }
});

// Load configuration when page loads
loadConfiguration();
