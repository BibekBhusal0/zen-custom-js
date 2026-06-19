let _searchService;

/**
 * Gets the search service instance, creating it if necessary.
 * Falls back to importing the ESM module directly when the XPCOM
 * component is unavailable (modern Firefox).
 * @returns {Promise<object>} The search service instance.
 */
async function getSearchService() {
  if (_searchService) return _searchService;
  const { SearchService } = ChromeUtils.importESModule(
    "moz-src:///toolkit/components/search/SearchService.sys.mjs"
  );
  _searchService = SearchService;
  return _searchService;
}

/**
 * Returns all visible search engines.
 * @returns {Promise<Array<object>>}
 */
export async function getVisibleEngines() {
  const ss = await getSearchService();
  return ss.getVisibleEngines();
}

/**
 * Finds a search engine by name.
 * @param {string} name
 * @returns {Promise<object|null>}
 */
export async function getEngineByName(name) {
  const ss = await getSearchService();
  return ss.getEngineByName(name);
}

/**
 * Returns the default search engine.
 * @returns {Promise<object>}
 */
export async function getDefaultEngine() {
  const ss = await getSearchService();
  return ss.getDefault();
}
