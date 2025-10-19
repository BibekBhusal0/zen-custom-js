/**
 * @param {string} domainOrUrl
 * @param {number} size
 * @returns {string}
 */
export function googleFaviconAPI(domainOrUrl, size = 32) {
  let domain;
  try {
    domain = new URL(domainOrUrl).hostname;
  } catch (e) {
    domain = domainOrUrl;
  }
  return `https://s2.googleusercontent.com/s2/favicons?domain_url=https://${domain}&sz=${size}`;
}
