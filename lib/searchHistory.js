const STORAGE_KEY = 'quicklyway_search_history';
const MAX_ITEMS = 10;

export function getSearchHistory() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.slice(0, MAX_ITEMS) : [];
  } catch {
    return [];
  }
}

export function addSearchHistory(term) {
  const normalized = (term || '').toLowerCase().trim();
  if (!normalized) return;
  let history = getSearchHistory();
  history = [normalized, ...history.filter((t) => t !== normalized)].slice(0, MAX_ITEMS);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // ignore
  }
}

export function clearSearchHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
