// https://github.com/sineorg/store/blob/main/mods/53cfe9d6-9079-46f8-b42f-453c46ebf0fa/mod.uc.js#L424

const TAB_EXPLODE_ANIMATION_ID = "tab-explode-animation-styles";
const BUBBLE_COUNT = 25; // Number of bubbles
const ANIMATION_DURATION = 600; // Milliseconds

function injectStyles() {
  if (document.getElementById(TAB_EXPLODE_ANIMATION_ID)) {
    return;
  }

  const css = `
      .tab-explosion-container {
          position: absolute;
          top: 0; /* Will be set by JS */
          left: 0; /* Will be set by JS */
          width: 0; /* Will be set by JS */
          height: 0; /* Will be set by JS */
          pointer-events: none; /* Don't interfere with mouse events */
          z-index: 99999; /* Above other tab elements */
      }

      .bubble-particle {
          position: absolute;
          /* background-color: var(--toolbarbutton-icon-fill-attention, dodgerblue); */ /* Use a theme-aware color or a fixed one */
          background-color: light-dark( #cac2b6, #808080) !important;
          border-radius: 50%;
          opacity: 0.8;
          animation-name: bubbleExplode;
          animation-duration: ${ANIMATION_DURATION}ms;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards; /* Stay at the end state (invisible) */
          will-change: transform, opacity; /* Hint for browser optimization */
      }

      @keyframes bubbleExplode {
          0% {
              transform: scale(0.2);
              opacity: 0.8;
          }
          100% {
              transform: translate(var(--tx, 0px), var(--ty, 0px)) scale(var(--s, 1));
              opacity: 0;
          }
      }
  `;

  const styleElement = document.createElement("style");
  styleElement.id = TAB_EXPLODE_ANIMATION_ID;
  styleElement.textContent = css;
  document.head.appendChild(styleElement);
}

function animateElementClose(element) {
  if (!element || !element.isConnected) return;

  const elementRect = element.getBoundingClientRect(); // Viewport-relative
  const explosionContainer = document.createElement("div");
  explosionContainer.className = "tab-explosion-container"; // Has position: absolute

  // Determine the parent for the animation.
  // #browser is a high-level container for the browser content area.
  let parentForAnimation = document.getElementById("browser");
  if (!parentForAnimation || !parentForAnimation.isConnected) {
    // Fallback to main-window or even documentElement if #browser is not suitable
    parentForAnimation = document.getElementById("main-window") || document.documentElement;
  }

  const parentRect = parentForAnimation.getBoundingClientRect();

  // Calculate position of explosionContainer relative to parentForAnimation,
  // such that it aligns with the element's viewport position.
  explosionContainer.style.left = `${elementRect.left - parentRect.left}px`;
  explosionContainer.style.top = `${elementRect.top - parentRect.top}px`;
  explosionContainer.style.width = `${elementRect.width}px`;
  explosionContainer.style.height = `${elementRect.height}px`;

  parentForAnimation.appendChild(explosionContainer);

  for (let i = 0; i < BUBBLE_COUNT; i++) {
    const bubble = document.createElement("div");
    bubble.className = "bubble-particle";

    let initialX, initialY;
    let edge;
    if (i < 4) {
      // Assign the first four bubbles to distinct edges (0, 1, 2, 3)
      edge = i;
    } else {
      // For subsequent bubbles, assign to a random edge
      edge = Math.floor(Math.random() * 4);
    }

    const bubbleSizeOffset = 5; // Half of average bubble size, to keep them visually on edge

    switch (edge) {
      case 0: // Top edge
        initialX = Math.random() * elementRect.width;
        initialY = -bubbleSizeOffset;
        break;
      case 1: // Right edge
        initialX = elementRect.width + bubbleSizeOffset;
        initialY = Math.random() * elementRect.height;
        break;
      case 2: // Bottom edge
        initialX = Math.random() * elementRect.width;
        initialY = elementRect.height + bubbleSizeOffset;
        break;
      case 3: // Left edge
        initialX = -bubbleSizeOffset;
        initialY = Math.random() * elementRect.height;
        break;
    }

    bubble.style.left = `${initialX}px`;
    bubble.style.top = `${initialY}px`;
    bubble.style.width = `${Math.random() * 4 + 4}px`; // Random size (4px to 8px)
    bubble.style.height = bubble.style.width;

    // Random final translation and scale for each bubble
    const angle = Math.random() * Math.PI * 2;
    let distance = Math.random() * 1 + 1; // Explosion radius, even further reduced spread
    let finalTranslateX = Math.cos(angle) * distance;
    let finalTranslateY = Math.sin(angle) * distance;

    // Bias explosion outwards from the edge
    const outwardBias = 10; // Reduced outward bias
    if (edge === 0) finalTranslateY -= outwardBias; // Upwards from top
    if (edge === 1) finalTranslateX += outwardBias; // Rightwards from right
    if (edge === 2) finalTranslateY += outwardBias; // Downwards from bottom
    if (edge === 3) finalTranslateX -= outwardBias; // Leftwards from left

    const finalScale = Math.random() * 0.4 + 0.7; // Scale up a bit

    bubble.style.setProperty("--tx", `${finalTranslateX}px`);
    bubble.style.setProperty("--ty", `${finalTranslateY}px`);
    bubble.style.setProperty("--s", finalScale);

    // Stagger animation start slightly
    bubble.style.animationDelay = `${Math.random() * 120}ms`;

    explosionContainer.appendChild(bubble);
  }

  // Make the original element content invisible immediately
  element.style.opacity = "0";
  element.style.transition = "opacity 0.1s linear";

  // Remove the explosion container after the animation
  setTimeout(() => {
    if (explosionContainer.parentNode) {
      explosionContainer.parentNode.removeChild(explosionContainer);
    }
  }, ANIMATION_DURATION + 100); // Add slight buffer for animation delay
}

function onTabClose(event) {
  const tab = event.target;
  // Ensure it's a normal tab and not something else
  if (tab.localName === "tab" && !tab.pinned && tab.isConnected) {
    // Check if the tab is part of a group
    const groupParent = tab.closest("tab-group");
    if (!groupParent) {
      animateElementClose(tab);
    }
  }
}

function onTabGroupRemove(event) {
  const group = event.target;
  if (group && group.localName === "tab-group" && group.isConnected) {
    animateElementClose(group);
  }
}

function init() {
  injectStyles();
  if (typeof gBrowser !== "undefined" && gBrowser.tabContainer) {
    gBrowser.tabContainer.addEventListener("TabClose", onTabClose, false);

    // Add multiple event listeners to catch tab group removal
    gBrowser.tabContainer.addEventListener("TabGroupRemove", onTabGroupRemove, false);
    gBrowser.tabContainer.addEventListener("TabGroupClosed", onTabGroupRemove, false);
    gBrowser.tabContainer.addEventListener("TabGroupRemoved", onTabGroupRemove, false);

    // Also listen for the custom event that might be used
    document.addEventListener("TabGroupRemoved", onTabGroupRemove, false);
  } else {
    setTimeout(init, 1000);
  }
}

// Wait for the browser to be fully loaded
if (document.readyState === "complete") {
  init();
} else {
  window.addEventListener("load", init, { once: true });
}
