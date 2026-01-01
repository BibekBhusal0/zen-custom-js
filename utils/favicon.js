/**
 * @param {string} domainOrUrl
 * @param {number} size
 * @returns {string}
 */
export function googleFaviconAPI(domainOrUrl, size = 32) {
  let domain;
  try {
    domain = new URL(domainOrUrl).hostname;
  } catch {
    domain = domainOrUrl;
  }
  return `https://s2.googleusercontent.com/s2/favicons?domain_url=https://${domain}&sz=${size}`;
}

/**
 * Gets a favicon for a search engine, with fallbacks.
 * @param {object} engine - The search engine object.
 * @returns {string} The URL of the favicon.
 */
export function getSearchEngineFavicon(engine) {
  const fallbackIcon = "chrome://browser/skin/search-glass.svg";
  if (engine?.iconURI?.spec) {
    return engine.iconURI.spec;
  }
  try {
    const submissionUrl = engine.getSubmission("test_query")?.uri.spec;
    if (submissionUrl) {
      return googleFaviconAPI(submissionUrl);
    }
  } catch {
    return fallbackIcon;
  }
    return fallbackIcon;
}
