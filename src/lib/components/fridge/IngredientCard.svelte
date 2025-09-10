<script lang="ts">
  import type { InventoryItem } from "$lib/Item";
  import { incCount, decCount, updateMemo } from "$lib/stores/inventory";
  import { autoHeight } from "$lib/actions/autoHeight";
  import { focus } from "$lib/actions/focus";
  import { onMount, onDestroy } from "svelte";

  export let ing: InventoryItem;
  export let index: number;
  let editing = false;

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
  <div class="ingredient-card" class:expired>
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
      <div>{ing.product.name}</div>
      {#if ing.expirationDate}
        <small
          >{ing.expirationDate?.getUTCFullYear()}년 {ing.expirationDate?.getMonth() +
            1}월 {ing.expirationDate?.getDate()}일 까지</small
        >
      {:else}
        <small>기한 없음</small>
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
    border-radius: 16px;
    padding: 16px;
    min-height: 120px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
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
