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
      if (a?.type === "free") return `${pid}:free`;
      return `${pid}:none`;
    })
    .sort()
    .join("|");
}
export const inventorySignature = derived(ingredients, ($ings) =>
  makeSignature($ings)
);

function isItemExpired(it: InventoryItem): boolean {
  const d = it.expirationDate as Date | undefined;
  if (!d) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dl = new Date(d);
  dl.setHours(0, 0, 0, 0);
  return dl.getTime() < today.getTime();
}

export const availableIngredients = derived(ingredients, ($ings) =>
  $ings.filter((i) => !isItemExpired(i))
);

export const availableInventorySignature = derived(availableIngredients, ($ings) =>
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

/**
 * 선택된 인덱스들의 아이템을 삭제한다.
 * - 인덱스 기준으로 삭제하며, 한 번의 update로 처리한다.
 */
export function removeItemsAtIndices(indices: number[]) {
  if (!Array.isArray(indices) || indices.length === 0) return;
  const set = new Set(indices);
  ingredients.update((arr) => arr.filter((_, i) => !set.has(i)));
}
