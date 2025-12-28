import { error } from '@sveltejs/kit';

// Simple in-memory cache
// Key: URL or ID, Value: { data: any, expiry: number }
const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

const BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

async function fetchWithCache(url: string) {
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
    if (!res.ok) {
      throw new Error(`MealDB HTTP ${res.status}`);
    }
    const data = await res.json();
    
    // Cache the result
    cache.set(url, { data, expiry: now + CACHE_TTL });
    return data;
  } catch (e) {
    console.error(`Fetch error for ${url}:`, e);
    throw e;
  }
}

export async function searchByFirstLetter(letter: string) {
  const url = `${BASE_URL}/search.php?f=${encodeURIComponent(letter)}`;
  return fetchWithCache(url);
}

export async function lookupById(id: string) {
  const url = `${BASE_URL}/lookup.php?i=${encodeURIComponent(id)}`;
  return fetchWithCache(url);
}
