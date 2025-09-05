<script lang="ts">
  import type { InventoryItem } from "$lib/Item";
  import { incCount, decCount, updateMemo } from "$lib/stores/inventory";
  import { autoHeight } from "$lib/actions/autoHeight";
  import { focus } from "$lib/actions/focus";

  export let ing: InventoryItem;
  export let index: number;
  let editing = false;

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
  <div class="ingredient-card">
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
    background: #fafafa;
    border-radius: 16px;
    padding: 16px;
    min-height: 120px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.03);
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
    font-size: .875rem;
    line-height: 1.5;
    padding: .25rem .5rem;
    text-align: center;
    border: 1px solid;
    border-radius: .25rem;
    box-sizing: border-box;
    min-height: calc(1.5em + .5rem + 2px);
  }
  .memo-display { cursor: pointer; white-space: pre-line; word-break: break-all; border-color: transparent; background-color: transparent; }
  .memo-display.is-placeholder { color: #6c757d; }
  .memo-input { resize: none; overflow: hidden; border-color: #dee2e6; background-color: #fff; }
  .memo-input:focus {
    color:#212529; background:#fff; border-color:#86b7fe; outline:0;
    box-shadow:0 0 0 .25rem rgba(13,110,253,.25);
  }
</style>