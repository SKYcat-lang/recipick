<script lang="ts">
  import type { InventoryItem } from "$lib/Item";
  import { incCount, decCount, updateMemo } from "$lib/stores/inventory";
  import { autoHeight } from "$lib/actions/autoHeight";
  import { focus } from "$lib/actions/focus";
  import { onMount, onDestroy } from "svelte";
  import { selected, toggleSelect, selectionMode } from "$lib/stores/ui";

  export let ing: InventoryItem;
  export let index: number;
  let editing = false;

  // Long-press to enter selection (PC/Mobile)
  let longPressActive = false;
  let longPressTimer: any;
  let suppressClickOnce = false;

  function onCardClickCapture(e: MouseEvent) {
    if ($selectionMode) {
      if (suppressClickOnce) {
        suppressClickOnce = false;
        e.stopPropagation();
        e.preventDefault();
        return;
      }
      e.stopPropagation();
      e.preventDefault();
      toggleSelect(index, true);
    }
  }

  function handlePointerDown(e: PointerEvent) {
    // ignore right-click
    if ((e as any).button === 2) return;
    longPressActive = true;
    clearTimeout(longPressTimer);
    longPressTimer = setTimeout(() => {
      if (longPressActive) {
        // Long-press ensures selection without toggling off if already selected
        if (!$selected.has(index)) {
          toggleSelect(index, true);
        }
        suppressClickOnce = true; // prevent subsequent click from toggling again
      }
    }, 350);
  }
  function cancelLongPress() {
    longPressActive = false;
    clearTimeout(longPressTimer);
  }
  const handlePointerUp = cancelLongPress;
  const handlePointerLeave = cancelLongPress;
  const handlePointerCancel = cancelLongPress;

  // 선택 상태 반응
  $: isSelected = $selected.has(index);

  // 유통기한 경과 여부(당일 포함 '까지'이므로, 오늘 00:00 이전이면 경과로 판단)
  $: expired = (() => {
    const d = ing.expirationDate;
    if (!d) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dLocal = new Date(d);
    dLocal.setHours(0, 0, 0, 0);
    return dLocal.getTime() < today.getTime();
  })();

  let badgeEl: HTMLElement | null = null;
  let TooltipCtor: any;

  onMount(async () => {
    const m = await import("bootstrap/dist/js/bootstrap.bundle");
    TooltipCtor = m.Tooltip;
    if (badgeEl && expired) {
      TooltipCtor.getOrCreateInstance(badgeEl, {
        trigger: "hover focus click",
        placement: "left",
      });
    }
  });

  $: if (TooltipCtor && badgeEl) {
    if (expired) {
      TooltipCtor.getOrCreateInstance(badgeEl, {
        trigger: "hover focus click",
        placement: "left",
      });
    } else {
      TooltipCtor.getInstance(badgeEl)?.dispose();
    }
  }

  onDestroy(() => {
    if (TooltipCtor && badgeEl) {
      TooltipCtor.getInstance(badgeEl)?.dispose();
    }
  });

  function handleImageError(e: Event) {
    (e.target as HTMLImageElement).src =
      "https://via.placeholder.com/150/EEEEEE/AAAAAA?text=No+Image";
  }

  function saveMemo(val: string) {
    updateMemo(index, val);
    editing = false;
  }
</script>

<div class="grid-item bg-white rounded-3">
  <div
    class="ingredient-card"
    class:expired
    class:selected={isSelected}
    on:click|capture={onCardClickCapture}
    on:pointerdown={handlePointerDown}
    on:pointerup={handlePointerUp}
    on:pointerleave={handlePointerLeave}
    on:pointercancel={handlePointerCancel}
  >
    <!-- 좌상단 선택 토글 버튼 -->
    <button
      class="select-toggle {isSelected ? 'active' : ''}"
      type="button"
      aria-label="선택 토글"
      on:click={(e) => {
        e.stopPropagation();
        toggleSelect(index, true);
        (e.currentTarget as HTMLButtonElement).blur();
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="currentColor"
      >
        <path
          d="M13.485 1.929a.75.75 0 0 1 .086 1.057l-7 8a.75.75 0 0 1-1.1.03l-3-3a.75.75 0 0 1 1.06-1.06l2.41 2.41 6.47-7.4a.75.75 0 0 1 1.074-.037z"
        />
      </svg>
    </button>

    {#if expired}
      <button
        class="expired-badge"
        bind:this={badgeEl}
        aria-label="유통기한 경고"
        data-bs-toggle="tooltip"
        data-bs-placement="left"
        title="유통기한이 지난 재료는 레시피 추천에 사용되지 않습니다!"
        >!</button
      >
    {/if}
    {#if ing.displayImage}
      <img
        src={ing.displayImage}
        alt={ing.product.name}
        class="ingredient-img rounded-3 m-2"
        on:error={handleImageError}
      />
    {:else}
      <div class="ingredient-img rounded-3 m-2"></div>
    {/if}

    <div class="text-center mb-2">
      <div><strong>{ing.product.name}</strong></div>
      {#if ing.expirationDate}
        <small
          >{ing.expirationDate?.getUTCFullYear()}년 {ing.expirationDate?.getMonth() +
            1}월 {ing.expirationDate?.getDate()}일 까지</small
        >
      {:else}
      {/if}
    </div>

    <div class="counter">
      {#if ing.amount.type === "count"}
        <button
          class="btn btn-secondary btn-sm"
          on:click={() => decCount(index)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            class="bi bi-dash"
            viewBox="0 2 16 16"
            ><path
              d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8"
            /></svg
          >
        </button>
        <span>{ing.getDisplayAmount()}</span>
        <button
          class="btn btn-secondary btn-sm"
          on:click={() => incCount(index)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            class="bi bi-plus"
            viewBox="0 2 16 16"
            ><path
              d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"
            /></svg
          >
        </button>
      {:else}
        <span>{ing.getDisplayAmount()}</span>
      {/if}
    </div>

    {#if !editing}
      <button
        type="button"
        class="memo-box memo-display {ing.memo ? '' : 'is-placeholder'}"
        on:click={() => (editing = true)}
      >
        {ing.memo ? ing.memo : "메모 추가"}
      </button>
    {:else}
      <textarea
        rows="1"
        class="memo-box memo-input"
        placeholder="메모 입력"
        bind:value={ing.memo}
        on:keydown={(ev) => {
          if (ev.key === "Enter" && (ev.ctrlKey || ev.shiftKey))
            saveMemo(ing.memo || "");
        }}
        on:blur={() => saveMemo(ing.memo || "")}
        use:focus
        use:autoHeight
        on:heightChange={() => {
          /* Masonry는 ResizeObserver로 처리 */
        }}
      />
    {/if}
  </div>
</div>

<!-- src/lib/components/fridge/IngredientCard.svelte -->
<style>
  .ingredient-card {
    break-inside: avoid;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: #fff;
    border-radius: 6px;
    padding: 16px;
    min-height: 120px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
    border: 2px solid #fafafa; /* 기본 회색 테두리로 두께 고정: 선택 시 유격 방지 */
    box-sizing: border-box;
  }
  .ingredient-img {
    width: 64px;
    height: 64px;
    object-fit: cover;
    background: #e0e0e0;
  }
  .memo-box {
    width: 100%;
    margin-top: 12px;
    font-size: 0.875rem;
    line-height: 1.5;
    padding: 0.5rem 0.75rem;
    text-align: center;
    border: 1px solid #eee;
    border-radius: 8px;
    box-sizing: border-box;
    background: #fafafa;
    min-height: calc(1.5em + 0.5rem + 2px);
  }
  .memo-display {
    cursor: pointer;
    white-space: pre-line;
    word-break: break-all;
    border-color: #eee;
    background-color: #fafafa;
  }
  .memo-display.is-placeholder {
    color: #6c757d;
  }
  .memo-input {
    resize: none;
    overflow: hidden;
    border-color: #eee;
    background-color: #fafafa;
  }
  .memo-input:focus {
    color: #212529;
    background: #fff;
    border-color: #86b7fe;
    outline: 0;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  }

  /* ensure positioned ancestor for badge */
  .ingredient-card {
    position: relative;
  }

  .ingredient-card.expired {
    border-radius: 6px;
    border: 2px solid #dc3545; /* Bootstrap danger color */
  }

  /* 선택 상태 파란 테두리 (기본 회색 테두리와 같은 두께) */
  .ingredient-card.selected {
    border: 2px solid #0d6efd !important; /* Bootstrap primary */
    border-radius: 6px;
  }

  /* 좌상단 선택 토글 버튼 */
  .select-toggle {
    position: absolute;
    top: -8px;
    left: -8px;
    z-index: 2;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #fff;
    color: #0d6efd;
    border: 2px solid #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    line-height: 1;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    cursor: pointer;
    padding: 0;

    /* 초기에는 숨김 — 구글 킵 느낌의 페이드 인 */
    opacity: 0;
    pointer-events: none;
    transform: scale(0.95);
    transition: opacity 120ms ease, transform 120ms ease;
  }
  .select-toggle.active {
    border: 2px solid #0d6efd;
    background: #0d6efd;
    color: #fff;
  }
  /* 호버/선택 시 체크버튼 페이드 인 */
  .ingredient-card:hover .select-toggle,
  .ingredient-card.selected .select-toggle {
    opacity: 1;
    pointer-events: auto;
    transform: scale(1);
  }

  .expired-badge {
    position: absolute;
    top: -8px;
    right: -8px;
    z-index: 2;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: #dc3545;
    color: #fff;
    border: 2px solid #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    line-height: 1;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    cursor: pointer;
  }
</style>
