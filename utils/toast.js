// Toast API based on sine toast

const DEBUG_MODE = false;

function debugLog(...args) {
  if (DEBUG_MODE) {
    console.log("[Toast API]", ...args);
  }
}

/**
 * Shows a toast notification with custom text and optional button.
 * @param {Object} options - Toast options
 * @param {string} options.title - Main toast message
 * @param {string} [options.description] - Optional description text
 * @param {number} [options.preset=0] - Button preset (0=no button, 1=restart, 2=custom action)
 * @param {Function} [options.onClick] - Custom click handler for preset 2
 * @param {string} [options.buttonText] - Custom button text (overrides preset)
 * @param {number} [options.timeout=3000] - Auto-dismiss timeout in milliseconds
 * @param {string} [options.id] - Unique toast ID for duplicate prevention
 */
function showToast(options = {}) {
  debugLog("showToast called with options:", options);

  const { title, description, preset = 0, onClick, buttonText, timeout = 3000, id } = options;
  debugLog("Parsed options:", { title, description, preset, buttonText, timeout, id });

  if (!title) {
    console.error("Toast: title is required");
    return;
  }

  // Generate unique ID if not provided
  const toastId = id || `custom-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  debugLog("Generated toast ID:", toastId);

  try {
    // Import the uc_api module
    debugLog("Importing uc_api module...");
    const ucAPI = ChromeUtils.importESModule(
      "chrome://userscripts/content/engine/utils/uc_api.sys.mjs"
    ).default;
    debugLog("uc_api module imported successfully:", !!ucAPI);

    // Call the existing showToast function
    const showToastOptions = {
      id: toastId,
      preset,
      clickEvent: onClick,
      name: description ? description.replace(/\s+/g, " ").trim() : undefined,
      timeout,
    };
    debugLog("Calling ucAPI.showToast with:", showToastOptions);

    ucAPI.showToast(showToastOptions);
    debugLog("ucAPI.showToast called successfully");

    let retryCount = 0;
    const maxRetries = 10;
    const retryInterval = 50;

    const tryReplaceText = () => {
      debugLog(`Starting text replacement attempt ${retryCount + 1}/${maxRetries}...`);

      // Get all browser windows
      const windows = Services.wm.getEnumerator("navigator:browser");
      let windowCount = 0;
      let foundToast = false;

      while (windows.hasMoreElements()) {
        const win = windows.getNext();
        windowCount++;
        debugLog(`Checking window ${windowCount}:`, !!win);

        const toast = win.document.querySelector(`.sineToast[data-id="${toastId}"]`);
        debugLog(`Toast found in window ${windowCount}:`, !!toast);

        if (toast) {
          foundToast = true;
          debugLog("Toast element found, starting text replacement...");

          // Replace title text
          const titleElement = toast.querySelector("span[data-l10n-id]");
          debugLog("Title element found:", !!titleElement);
          if (titleElement) {
            titleElement.removeAttribute("data-l10n-id");
            titleElement.removeAttribute("data-l10n-args");
            titleElement.textContent = title;
            debugLog("Title text replaced with:", title);
          } else {
            debugLog("Title element not found, trying alternative selectors...");
            const altTitleElement = toast.querySelector("span");
            if (altTitleElement) {
              altTitleElement.textContent = title;
              debugLog("Title text replaced using alternative selector");
            }
          }

          // Replace description text if provided
          if (description) {
            const descElement = toast.querySelector(".description");
            debugLog("Description element found:", !!descElement);
            if (descElement) {
              descElement.removeAttribute("data-l10n-id");
              descElement.textContent = description;
              debugLog("Description text replaced with:", description);
            } else {
              debugLog("Description element not found");
            }
          }

          // Replace button text if custom text provided
          if (buttonText) {
            const button = toast.querySelector("button");
            debugLog("Button element found:", !!button);
            if (button) {
              button.removeAttribute("data-l10n-id");
              button.textContent = buttonText;
              debugLog("Button text replaced with:", buttonText);
            } else {
              debugLog("Button element not found");
            }
          }

          // Hide button if preset is 0
          if (preset === 0) {
            const button = toast.querySelector("button");
            debugLog("Button element for hiding found:", !!button);
            if (button) {
              button.style.display = "none";
              debugLog("Button hidden due to preset=0");
            } else {
              debugLog("No button found to hide");
            }
          }

          debugLog("Text replacement completed for this toast");
          return; // Success, exit function
        }
      }

      debugLog(`Checked ${windowCount} windows, found toast: ${foundToast}`);

      if (!foundToast && retryCount < maxRetries) {
        retryCount++;
        debugLog("Toast not found, retrying...");
        // Get most recent browser window for retry
        const browserWindow = Services.wm.getMostRecentWindow("navigator:browser");
        if (browserWindow) {
          browserWindow.setTimeout(tryReplaceText, retryInterval);
        } else {
          debugLog("No browser window found for retry");
        }
      } else if (!foundToast) {
        debugLog("Max retries reached or no toast found with ID:", toastId);
      }
    };

    const browserWindow = Services.wm.getMostRecentWindow("navigator:browser");
    if (browserWindow) {
      browserWindow.setTimeout(tryReplaceText, 50);
    } else {
      debugLog("No browser window found for setTimeout");
    }
  } catch (error) {
    debugLog("Error in showToast:", error);
    console.error("Toast API error:", error);
  }
}

export { showToast };
