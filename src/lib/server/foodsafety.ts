// Simple in-memory cache for FoodSafety API
const cache = new Map<string, { data: string; expiry: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export async function fetchFoodSafetyRecipes(apiKey: string) {
  const url = `https://openapi.foodsafetykorea.go.kr/api/${apiKey}/COOKRCP01/xml/1/100`;
  
  const now = Date.now();
  if (cache.has(url)) {
    const cached = cache.get(url)!;
    if (cached.expiry > now) {
      return cached.data;
    }
    cache.delete(url);
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    
    cache.set(url, { data: text, expiry: now + CACHE_TTL });
    return text;
  } catch (e) {
    console.error('FoodSafety API error:', e);
    throw e;
  }
}
