import { fetchFoodSafetyRecipes } from '$lib/server/foodsafety';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const apiKey = import.meta.env.VITE_FSK_API_KEY;
  
  if (!apiKey) {
    return new Response('Server configuration error: Missing API Key', { status: 500 });
  }

  try {
    const xml = await fetchFoodSafetyRecipes(apiKey);
    return new Response(xml, {
      headers: { 'Content-Type': 'text/xml' }
    });
  } catch (e) {
    console.error(e);
    return new Response('Error fetching data', { status: 500 });
  }
};
