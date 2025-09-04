<script lang="ts">
  import { onMount, onDestroy, tick, createEventDispatcher } from "svelte";
  import { initMasonry, type MasonryHandle } from "$lib/utils/masonry";

  export let items: any[] = [];
  export let mobileTwoCols = false; // 모바일 탭에서 2열 고정 지원
  const dispatch = createEventDispatcher();

  let host: HTMLElement;
  let handle: MasonryHandle | null = null;

  // 부모에서 강제 레이아웃 갱신을 호출할 수 있도록 공개 API 제공
  export function relayout() {
    handle?.update();
  }

  onMount(async () => {
    // 슬롯(자식) DOM이 모두 렌더된 뒤 Masonry 초기화
    await tick();
    handle = await initMasonry(host);
    // 초기 렌더 직후에도 한 번 강제 레이아웃 (이미지 없는 카드 대비)
    await tick();
    handle?.update();
  });

  onDestroy(() => handle?.destroy());

  // 아이템 변경 시: DOM 반영 후 Masonry 갱신
  $: (async () => {
    // 의존성 명시: 배열 길이 + 첫 아이템 참조 해시로 변화 감지 강화
    const _len = items.length;
    const _sig = _len ? JSON.stringify([items[0]?.product?.productId, items[_len-1]?.product?.productId]) : "";
    if (!handle) return;
    await tick();
    handle.update(); // 👈 핵심
    dispatch("layout");
  })();
</script>

<div class="ingredient-grid" class:three-up-mobile={mobileTwoCols} bind:this={host}>
  <div class="grid-sizer"></div>
  <slot></slot>
</div>

<!-- src/lib/components/fridge/FridgeGrid.svelte -->
<style>
  .ingredient-grid {
    position: relative;
  }

  /* 슬롯으로 들어오는 .grid-item/.grid-sizer는 부모 컴포넌트에서 생성되므로
     이 컴포넌트의 스타일 스코프를 우회하기 위해 :global을 사용한다. */
  :global(.grid-sizer),
  :global(.grid-item) {
    /* Masonry gutter(16px)를 포함해 정확히 3열이 맞도록 계산 */
    width: calc((100% - (2 * 16px)) / 3);
    box-sizing: border-box; /* padding/border 포함 */
  }

  @media (max-width: 1200px) {
    :global(.grid-sizer),
    :global(.grid-item) {
      /* 2열일 때: 사이에 16px 한 칸 */
      width: calc((100% - 16px) / 2);
    }
  }

  @media (max-width: 767px) {
    :global(.grid-sizer),
    :global(.grid-item) {
      width: 100%;
    }
  }

  :global(.grid-item) {
    padding: 0;
    margin-bottom: 16px; /* 세로 간격만 유지 (가로 간격은 Masonry gutter 사용) */
  }

  /* 모바일 탭 전용 2열 강제 (상위 prop: mobileTwoCols)
     왼쪽은 로컬 컨테이너(.ingredient-grid), 오른쪽 자식 선택자는 글로벌 */
  .ingredient-grid.three-up-mobile :global(.grid-sizer),
  .ingredient-grid.three-up-mobile :global(.grid-item) {
    /* 모바일 탭 전용 2열 고정: Masonry gutter 16px 반영 */
    width: calc((100% - 16px) / 2) !important;
    box-sizing: border-box;
  }
</style>
