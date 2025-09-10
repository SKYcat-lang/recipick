import { writable, derived } from "svelte/store";

// Viewport/device
export const isDesktop = writable(false);

// Recipe loading states
export const isLoadingRecipes = writable(false);
export const recipeError = writable<string | null>(null);

// AI panel states
export const aiWaiting = writable(false);
export const aiResponseMd = writable("");
export const savedRecipes = writable<{ recipe: string; keywords: string[] }[]>(
  []
);


// ==============================
// Selection state for fridge grid
// ==============================

// 선택된 카드 인덱스 집합(Set) — 인덱스 기준 선택 관리
export const selected = writable<Set<number>>(new Set());

// 선택 개수 파생
export const selectedCount = derived(selected, ($s) => $s.size);

// 단일/다중 토글 선택
export function toggleSelect(idx: number, multi = true) {
  selected.update((s) => {
    const n = new Set(s);
    if (n.has(idx)) {
      n.delete(idx);
    } else {
      if (!multi) n.clear();
      n.add(idx);
    }
    return n;
  });
}

// 전체 선택 해제
export function clearSelection() {
  selected.set(new Set());
}

// 지정 인덱스 배열로 선택 상태 설정
export function setSelection(indices: number[]) {
  selected.set(new Set(indices));
}

// Editing target index for external "편집" action (null = none)
export const editTarget = writable<number | null>(null);

// Selection mode: 활성화되면 카드 내 어디를 눌러도 선택 토글
export const selectionMode = derived(selectedCount, (c) => c > 0);
