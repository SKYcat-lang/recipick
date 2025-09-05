import { writable, derived } from "svelte/store";
import { InventoryItem } from "$lib/Item";

export const ingredients = writable<InventoryItem[]>([]);

function makeSignature(items: InventoryItem[]) {
  return items
    .map((i) => {
      const pid = i.product.productId;
      const a: any = i.amount as any;
      if (a?.type === "count") return `${pid}:count:${a.value}`;
      if (a?.type === "exact") return `${pid}:exact:${a.value}${a.unit || ""}`;
      if (a?.type === "step") return `${pid}:step:${a.level}`;
      return `${pid}:none`;
    })
    .sort()
    .join("|");
}
export const inventorySignature = derived(ingredients, ($ings) =>
  makeSignature($ings)
);

export function setIngredients(list: InventoryItem[]) {
  ingredients.set(list);
}
export function addItem(newItem: InventoryItem) {
  ingredients.update((arr) => [newItem, ...arr]);
}

export function incCount(idx: number) {
  ingredients.update((arr) => {
    const it = arr[idx];
    if (it?.amount?.type === "count") it.amount.value++;
    return [...arr];
  });
}
export function decCount(idx: number) {
  ingredients.update((arr) => {
    const it = arr[idx];
    if (it?.amount?.type === "count") it.amount.value--;
    return [...arr];
  });
}
export function updateMemo(idx: number, memo: string) {
  ingredients.update((arr) => {
    const it = arr[idx];
    if (it) it.memo = memo;
    return [...arr];
  });
}
