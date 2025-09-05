<script lang="ts">
  import { savedRecipes, aiResponseMd } from "$lib/stores/ui";
  function extractTitle(md: string) {
    const m = md.match(/^#+\s*(.+)$/m);
    return m
      ? m[1]
      : md
          .split("\n")[0]
          .replace(/^[-*#>\s]+/, "")
          .slice(0, 60);
  }
  function openSaved(i: number) {
    const { recipe } = $savedRecipes[i];
    // 상단 AI 응답 박스에 로드 + 스크롤 업
    aiResponseMd.set(recipe);
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {}
  }
</script>

{#if $savedRecipes.length > 0}
  <section class="mt-4 mb-4">
    <h5 class="fw-bold mb-2">저장된 레시피</h5>
    <div class="saved-outer d-flex">
      <div class="flex-grow-1 min-w-0">
        <div class="saved-hscroll" role="list">
          {#each $savedRecipes as saved, i}
            <article class="card saved-card" role="listitem">
              <div class="saved-card-inner">
                <h6 class="mb-2 saved-title">{extractTitle(saved.recipe)}</h6>
                <p class="text-muted small mb-2 saved-subtitle">
                  키워드: {saved.keywords.join(", ")}
                </p>
                <button
                  class="btn btn-sm btn-primary saved-btn"
                  on:click={() => openSaved(i)}>상세보기</button
                >
              </div>
            </article>
          {/each}
        </div>
      </div>
    </div>
  </section>
{/if}

<style>
  /* 가로 스크롤 영역 전체를 이 컴포넌트로 이전 */
  .saved-outer {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;          /* 가로 스크롤은 여기에서 처리 */
    overflow-y: hidden;
    padding-bottom: 0.5rem;    /* 스크롤바가 카드와 겹치지 않게 여백 */
    padding-inline-end: 0.75rem;   /* 맨 끝 카드가 잘리지 않도록 우측 여백 */
    scroll-padding-inline: 0 0.75rem; /* 스냅/스크롤 시 우측 여백 고려 */
    scroll-snap-type: x mandatory;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior-inline: contain;
    scrollbar-gutter: stable both-edges;
    isolation: isolate;
  }
  .saved-hscroll {
    display: flex;
    flex-flow: row nowrap;
    gap: 0.75rem;

    /* 내용이 필요만큼 가로로 확장되도록 */
    inline-size: max-content;
    min-inline-size: 100%;
  }
  /* 맨 끝 카드가 컨테이너 우측에 닿아 잘리는 현상 방지용 트레일 스페이서 */
  .saved-hscroll::after {
    content: "";
    flex: 0 0 0.75rem; /* gap과 동일한 폭 */
    pointer-events: none;
  }
  .saved-card {
    flex: 0 0 11rem;
    max-width: 11rem;
    aspect-ratio: 1 / 1;
    overflow: hidden;
    scroll-snap-align: start;
    position: relative; /* 내부 absolute를 위해 */
  }
  .saved-card-inner {
    position: absolute;
    inset: 0;
    padding: 0.5rem 0.6rem;
    display: grid;
    grid-template-rows: auto auto 1fr auto;
    min-height: 0;
  }
  .saved-title {
    font-weight: 700;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0;
  }
  .saved-subtitle {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0;
  }
  .saved-title,
  .saved-subtitle,
  .saved-card-inner {
    word-break: break-word;
  }
  .saved-btn {
    align-self: end;
  }
  .saved-hscroll::-webkit-scrollbar {
    height: 8px;
  }
</style>
