export function calculateFuzzyScore(target, query) {
  if (!target || !query) return 0;

  const targetLower = target.toLowerCase();
  const queryLower = query.toLowerCase();
  const targetLen = target.length;
  const queryLen = query.length;

  if (queryLen > targetLen) return 0;
  if (queryLen === 0) return 0;

  if (targetLower === queryLower) {
    return 200;
  }

  if (targetLower.startsWith(queryLower)) {
    return 100 + queryLen;
  }

  const initials = targetLower
    .split(/[\s-_]+/)
    .map((word) => word[0])
    .join("");
  if (initials === queryLower) {
    return 90 + queryLen;
  }

  let score = 0;
  let queryIndex = 0;
  let lastMatchIndex = -1;
  let consecutiveMatches = 0;

  for (let targetIndex = 0; targetIndex < targetLen; targetIndex++) {
    if (queryIndex < queryLen && targetLower[targetIndex] === queryLower[queryIndex]) {
      let bonus = 10;
      if (targetIndex === 0 || [" ", "-", "_"].includes(targetLower[targetIndex - 1])) {
        bonus += 15;
      }
      if (lastMatchIndex === targetIndex - 1) {
        consecutiveMatches++;
        bonus += 20 * consecutiveMatches;
      } else {
        consecutiveMatches = 0;
      }
      if (lastMatchIndex !== -1) {
        const distance = targetIndex - lastMatchIndex;
        bonus -= Math.min(distance - 1, 10);
      }
      score += bonus;
      lastMatchIndex = targetIndex;
      queryIndex++;
    }
  }
  return queryIndex === queryLen ? score : 0;
}

export function fuzzyScore(target, query) {
  const cleanQuery = (query || "").trim();
  if (!cleanQuery) return 1;
  return calculateFuzzyScore(target || "", cleanQuery);
}

export function bestFuzzyScore(targets, query) {
  const cleanQuery = (query || "").trim();
  if (!cleanQuery) return 1;
  let best = 0;
  for (const target of targets || []) {
    if (!target) continue;
    const score = calculateFuzzyScore(target, cleanQuery);
    if (score > best) best = score;
    if (best >= 200) break;
  }
  return best;
}

export function fuzzyFilterSort(items, query, getTexts) {
  const cleanQuery = (query || "").trim();
  if (!cleanQuery) return [...items];
  return items
    .map((item) => {
      const texts = getTexts(item);
      const list = Array.isArray(texts) ? texts : [texts];
      return { item, score: bestFuzzyScore(list, cleanQuery) };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.item);
}
