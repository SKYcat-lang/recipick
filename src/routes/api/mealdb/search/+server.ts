import { json } from '@sveltejs/kit';
import { searchByFirstLetter } from '$lib/server/mealdb';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const f = url.searchParams.get('f');
  if (!f) {
    return json({ meals: [] });
  }

  try {
    const data = await searchByFirstLetter(f);
    return json(data);
  } catch (e) {
    console.error(e);
    return json({ meals: null }, { status: 500 });
  }
};
