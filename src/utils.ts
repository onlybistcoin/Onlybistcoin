export const isSandboxed = () => {
  if (typeof window === 'undefined') return false;
  const { hostname, protocol, ancestorOrigins } = window.location;
  
  // Standard AI Studio / Cloud Run preview indicators
  if (protocol === 'about:') return true;
  if (hostname.includes('run.app') || hostname.includes('aistudio') || hostname.includes('makersuite')) return true;
  
  // Chrome/Safari specific safe check
  if (ancestorOrigins && ancestorOrigins.length > 0) return true;
  
  try {
    // Only as a last resort, check if we are in an iframe.
    // We compare self to parent, which is slightly safer than top.
    return window.self !== window.parent;
  } catch (e) {
    // If we catch a SecurityError, we are definitely in a cross-origin iframe
    return true;
  }
};

export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`[Storage] Failed to get item ${key}:`, e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[Storage] Failed to set item ${key}:`, e);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`[Storage] Failed to remove item ${key}:`, e);
    }
  }
};

export const safeJsonParse = (str: string | null, fallback: any = null) => {
  if (!str || str === "undefined" || str === "null") return fallback;
  try {
    const parsed = JSON.parse(str);
    return parsed === null ? fallback : parsed;
  } catch (e) {
    console.warn("[JSON] Failed to parse:", str);
    return fallback;
  }
};
