/**
 * Configuration type for the Hit Region Highlighter extension
 * @typedef {Object} Configuration
 * @property {number} samplingResolution - Pixels between sample points (default: 10)
 * @property {string} highlightColor - Hex color code for visualization (default: '#00ff00')
 * @property {number} highlightOpacity - Opacity value from 0.0 to 1.0 (default: 0.3)
 * @property {boolean} autoRecalculate - Whether to recalculate on DOM changes (default: true)
 */

/**
 * Default configuration values
 * @type {Configuration}
 */
export const DEFAULT_CONFIG = {
  samplingResolution: 10,
  highlightColor: '#00ff00',
  highlightOpacity: 0.3,
  autoRecalculate: true
};

/**
 * Configuration Manager handles loading, saving, and monitoring configuration changes
 */
export class ConfigurationManager {
  constructor() {
    this.currentConfig = { ...DEFAULT_CONFIG };
    this.changeListeners = new Set();
  }

  /**
   * Loads configuration from browser storage
   * @returns {Promise<Configuration>} The loaded configuration merged with defaults
   */
  async loadConfiguration() {
    try {
      const result = await chrome.storage.sync.get('hitRegionConfig');
      const storedConfig = result.hitRegionConfig || {};
      
      // Merge stored config with defaults for any missing values
      this.currentConfig = {
        ...DEFAULT_CONFIG,
        ...storedConfig
      };
      
      return this.currentConfig;
    } catch (error) {
      console.error('Failed to load configuration:', error);
      // Return defaults on error
      this.currentConfig = { ...DEFAULT_CONFIG };
      return this.currentConfig;
    }
  }

  /**
   * Saves configuration to browser storage
   * @param {Partial<Configuration>} config - Configuration values to save
   * @returns {Promise<void>}
   */
  async saveConfiguration(config) {
    try {
      // Merge with current config
      this.currentConfig = {
        ...this.currentConfig,
        ...config
      };
      
      await chrome.storage.sync.set({
        hitRegionConfig: this.currentConfig
      });
      
      return this.currentConfig;
    } catch (error) {
      console.error('Failed to save configuration:', error);
      throw error;
    }
  }

  /**
   * Gets the current configuration
   * @returns {Configuration} The current configuration
   */
  getConfiguration() {
    return { ...this.currentConfig };
  }

  /**
   * Registers a listener for configuration changes
   * @param {Function} listener - Callback function that receives (changes, areaName)
   */
  addChangeListener(listener) {
    this.changeListeners.add(listener);
  }

  /**
   * Removes a configuration change listener
   * @param {Function} listener - The listener to remove
   */
  removeChangeListener(listener) {
    this.changeListeners.delete(listener);
  }

  /**
   * Starts listening for storage changes
   * This should be called once during initialization
   */
  startListening() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName === 'sync' && changes.hitRegionConfig) {
        const oldConfig = changes.hitRegionConfig.oldValue || {};
        const newConfig = changes.hitRegionConfig.newValue || {};
        
        // Update current config
        this.currentConfig = {
          ...DEFAULT_CONFIG,
          ...newConfig
        };
        
        // Notify all listeners
        this.changeListeners.forEach(listener => {
          try {
            listener(oldConfig, newConfig);
          } catch (error) {
            console.error('Error in configuration change listener:', error);
          }
        });
      }
    });
  }

  /**
   * Validates a configuration object
   * @param {Partial<Configuration>} config - Configuration to validate
   * @returns {boolean} True if valid
   */
  validateConfiguration(config) {
    if (config.samplingResolution !== undefined) {
      if (typeof config.samplingResolution !== 'number' || 
          config.samplingResolution < 1 || 
          config.samplingResolution > 100) {
        return false;
      }
    }
    
    if (config.highlightColor !== undefined) {
      if (typeof config.highlightColor !== 'string' || 
          !/^#[0-9A-Fa-f]{6}$/.test(config.highlightColor)) {
        return false;
      }
    }
    
    if (config.highlightOpacity !== undefined) {
      if (typeof config.highlightOpacity !== 'number' || 
          config.highlightOpacity < 0 || 
          config.highlightOpacity > 1) {
        return false;
      }
    }
    
    if (config.autoRecalculate !== undefined) {
      if (typeof config.autoRecalculate !== 'boolean') {
        return false;
      }
    }
    
    return true;
  }
}
