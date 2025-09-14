export const svgToUrl = (iconSVG, invert = true) => {
  const marker = invert ? "#invert" : "";
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(iconSVG)}${marker}`;
};

export const textToSvgDataUrl = (text) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
    <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="10" fill="currentColor">${text}</text>
  </svg>`;
  return svgToUrl(svg, false);
};

export const icons = {
  // ICON CREDITS: Lucide Icons[ISC License]
  splitVz: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 19H5c-1 0-2-1-2-2V7c0-1 1-2 2-2h3m8 0h3c1 0 2 1 2 2v10c0 1-1 2-2 2h-3M12 4v16"/></svg>`,
  splitHz: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8V5c0-1 1-2 2-2h10c1 0 2 1 2 2v3m0 8v3c0 1-1 2-2 2H7c-1 0-2-1-2-2v-3m-1-4h16"/></svg>`,
  splitGrid: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 3v18m-9-9h18"/><rect width="18" height="18" x="3" y="3" rx="2"/></g></svg>`,
  zoomIn: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21l-4.35-4.35M11 8v6m-3-3h6"/></g></svg>`,
  zoomOut: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21l-4.35-4.35M8 11h6"/></g></svg>`,
  pin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4a1 1 0 0 1 1 1z"/></svg>`,
  unpin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 17v5m3-12.66V7a1 1 0 0 1 1-1a2 2 0 0 0 0-4H7.89M2 2l20 20M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h11"/></svg>`,
  swap: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-repeat-icon lucide-repeat"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>`,
  bug: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M12 20v-9m2-4a4 4 0 0 1 4 4v3a6 6 0 0 1-12 0v-3a4 4 0 0 1 4-4zm.12-3.12L16 2"/><path d="M21 21a4 4 0 0 0-3.81-4M21 5a4 4 0 0 1-3.55 3.97M22 13h-4M3 21a4 4 0 0 1 3.81-4M3 5a4 4 0 0 0 3.55 3.97M6 13H2M8 2l1.88 1.88M9 7.13V6a3 3 0 1 1 6 0v1.13"/></g></svg>`,
  book: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 7v14m-9-3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4a4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3a3 3 0 0 0-3-3z"/></svg>`,
  star: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.12 2.12 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.12 2.12 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.12 2.12 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.12 2.12 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.12 2.12 0 0 0 1.597-1.16z"/></svg>`,

  // ICON CREDITS: Lucide Labs[ISC License]
  broom: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m13 11l9-9m-7.4 10.6c.8.8.9 2.1.2 3L10 22l-8-8l6.4-4.8c.9-.7 2.2-.6 3 .2Zm-7.8-2.2l6.8 6.8M5 17l1.4-1.4"/></svg>`,

  // ICON CREDITS: Tabler Icons[MIT License]
  zoomReset: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="m21 21l-6-6M3.268 12.043A7.02 7.02 0 0 0 9.902 17a7.01 7.01 0 0 0 7.043-6.131a7 7 0 0 0-5.314-7.672A7.02 7.02 0 0 0 3.39 7.6"/><path d="M3 4v4h4"/></g></svg>`,

  // ICON CREDITS: Sine Github repo [GNU General Public License v3.0.]
  // https://github.com/CosmoCreeper/Sine/blob/main/engine/assets/images/saturn.svg
  sine: `<svg fill-opacity="context-fill-opacity" fill="currentColor" height="200px" width="200px" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 502.688 502.688" xml:space="preserve"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M491.401,12.059c-23.467-23.467-70.4-9.6-145.067,42.667c-30.933-16-65.067-25.6-101.333-25.6 c-57.6,0-112,22.4-152.533,62.933c-68.267,68.267-81.067,170.667-38.4,252.8c-69.333,99.2-57.6,131.2-42.667,145.067 c7.467,7.467,18.133,11.733,29.867,11.733c23.467,0,54.4-13.867,98.133-40.533c7.467-5.333,16-10.667,24.533-17.067 c25.6,10.667,53.333,16,81.067,16c57.6,0,112-22.4,152.533-62.933c62.933-62.933,78.933-155.733,46.933-233.6 c6.4-8.533,11.733-17.067,18.133-25.6C504.201,73.925,512.734,33.392,491.401,12.059z M41.267,458.992 c1.067-8.533,7.467-32,37.333-77.867c4.267,5.333,8.533,10.667,13.867,16c8.533,8.533,18.133,16,27.733,23.467 C81.801,446.192,53.001,458.992,41.267,458.992z M156.467,394.992c-11.733-7.467-23.467-16-34.133-26.667 c-68.267-68.267-68.267-178.133,0-246.4c32-33.067,75.733-51.2,122.667-51.2s90.667,18.133,123.733,50.133 c10.667,10.667,20.267,22.4,26.667,35.2c-27.733,36.267-66.133,80-113.067,126.933 C235.401,329.925,192.734,367.259,156.467,394.992z M368.734,367.259c-33.067,33.067-77.867,52.267-123.733,52.267 c-13.867,0-27.733-2.133-41.6-5.333c36.267-28.8,74.667-62.933,112-100.267c37.333-37.333,70.4-74.667,99.2-110.933 C428.467,260.592,413.534,322.459,368.734,367.259z M422.067,120.858c-7.467-10.667-14.933-20.267-24.533-28.8 c-4.267-4.267-9.6-8.533-13.867-12.8c44.8-29.867,68.267-37.333,76.8-37.333C460.467,53.659,448.734,81.392,422.067,120.858z"></path></g></g></g></svg>`,
};
