import { json } from '@sveltejs/kit';
import { lookupById } from '$lib/server/mealdb';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  const i = url.searchParams.get('i');
  if (!i) {
    return json({ meals: null });
  }

  try {
    const data = await lookupById(i);
    return json(data);
  } catch (e) {
    console.error(e);
    return json({ meals: null }, { status: 500 });
  }
};
