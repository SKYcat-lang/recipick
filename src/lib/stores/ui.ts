import { writable } from "svelte/store";

export const isDesktop = writable(false);

export const isLoadingRecipes = writable(false);
export const recipeError = writable<string | null>(null);

export const aiWaiting = writable(false);
export const aiResponseMd = writable("");
export const savedRecipes = writable<{ recipe: string; keywords: string[] }[]>(
  []
);
