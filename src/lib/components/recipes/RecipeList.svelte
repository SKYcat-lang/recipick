<script lang="ts">
  import type { MatchedRecipe } from "$lib/types/recipe";
  export let recipes: MatchedRecipe[] = [];
  export let loading = false;
  export let error: string | null = null;
  export let tried = false; // 첫 로드 완료 전 빈상태 문구 깜빡임 방지
  // 내부 페이지네이션 (더보기)
  export let pageSize = 10;
  let visible = 0;

  // 표시 리스트: 항상 '보유 > 0'인 카드만 노출(보유 없음 카드는 제외)
  $: base = recipes ?? [];
  $: list = base.filter((r) => (r?.have?.length ?? 0) > 0);

  // 레시피 변경 시 첫 페이지로 리셋 + 안전한 보정
  let lastSig = "";
  $: sig = list.map((r) => r.seq).join(",");
  $: {
    const len = list.length;

    // 데이터 변경 감지 시 첫 페이지로 리셋
    if (sig !== lastSig) {
      visible = Math.min(pageSize, len);
      lastSig = sig;
    }

    // 데이터 길이에 맞춰 보정
    if (len === 0) {
      visible = 0;
    } else if (visible > len) {
      visible = len;
    } else if (visible === 0) {
      visible = Math.min(pageSize, len);
    }
  }

  function handleImageError(e: Event) {
    (e.target as HTMLImageElement).src = "https://via.placeholder.com/150/EEEEEE/AAAAAA?text=No+Image";
  }
</script>

<div class="recipe-list">
  {#if loading}
    <div class="d-flex justify-content-center p-5"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></div>
  {:else if error}
    <div class="alert alert-danger" role="alert">{error}</div>
  {:else if list.length > 0}
    {#each list.slice(0, visible) as recipe (recipe.seq)}
      <div class="card recipe-card mb-3 shadow-sm">
        <div class="row g-0">
          <div class="col-4">
            <img src={recipe.image} class="img-fluid rounded-start" alt={recipe.name} on:error={handleImageError} />
          </div>
          <div class="col-8 d-flex flex-column">
            <div class="card-body">
              <h5 class="card-title mb-2">{recipe.name}</h5>
              {#if recipe.have.length > 0}
                <div class="ingredient-status small">
                  <div class="text-success">
                    <strong class="me-2">+ 보유</strong>
                    {#each recipe.have as ing}
                      <span class="badge bg-success-subtle text-success-emphasis rounded-pill">{ing}</span>
                    {/each}
                  </div>
                  <div class="text-warning-emphasis mt-1">
                    <strong class="me-2">+ 필요</strong>
                    {#if recipe.missing.length > 0}
                      {#each recipe.missing as ing}
                        <span class="badge bg-warning-subtle text-warning-emphasis rounded-pill">{ing}</span>
                      {/each}
                    {:else}
                      <span class="badge bg-info-subtle text-info-emphasis rounded-pill">모든 재료 보유!</span>
                    {/if}
                  </div>
                </div>
              {/if}
            </div>
            <div class="card-footer bg-transparent border-0 mt-auto text-end pb-2 pe-2">
              <a href={`/recipes/${recipe.seq}`} class="btn btn-primary btn-sm">레시피 보기</a>
            </div>
          </div>
        </div>
      </div>
    {/each}
    {#if list.length > visible}
      <div class="text-center my-2">
        <button
          class="btn btn-outline-secondary btn-sm"
          on:click={() => (visible = Math.min((visible || pageSize) + pageSize, list.length))}
        >
          더보기
        </button>
      </div>
    {/if}
  {:else if tried}
    <div class="text-center text-muted p-4 border rounded-3"><p class="mb-0">일치하는 레시피가 없습니다.</p></div>
  {:else}
    <!-- 첫 로드 전에는 빈상태 문구를 숨겨 깜빡임 방지 (가벼운 플레이스홀더) -->
    <div class="placeholder-wave p-4">
      <div class="placeholder col-12 mb-2" style="height: 16px;"></div>
      <div class="placeholder col-10" style="height: 16px;"></div>
    </div>
  {/if}
</div>
<style>
  /* 고정 높이 레이아웃: 제목이 2줄 이상이 되어도 카드의 총 높이는 이미지 높이와 일치 */
  .recipe-card .row {
    height: 140px; /* 고정 높이로 카드 전체 높이를 이미지와 동일하게 유지 */
    align-items: stretch; /* 좌/우 컬럼을 동일 높이로 강제 */
  }
  @media (min-width: 992px) {
    .recipe-card .row {
      height: 160px; /* 데스크톱 고정 높이 */
      align-items: stretch;
    }
  }

  /* 이미지 높이를 고정해 카드 높이 기준을 만든다 */
  .recipe-card .img-fluid {
    width: 100%;
    height: 140px;
    object-fit: cover;
  }
  @media (min-width: 992px) {
    .recipe-card .img-fluid {
      height: 160px;
    }
  }

  /* 우측(텍스트) 영역은 세로 플렉스에서 본문이 가변, 푸터(버튼)는 하단 고정 */
  .recipe-card .col-8 {
    display: flex;
    flex-direction: column;
    position: relative;         /* 버튼 절대 위치 기준 */
    overflow: visible;          /* 본문이 푸터 아래로 짤리지 않게 */
  }
  .recipe-card .card-body {
    flex: 1 1 auto; /* 본문이 상단 영역을 차지 */
    display: flex;
    flex-direction: column;
    padding: 0.8rem;
    min-height: 0;
  }

  /* 제목은 2줄로 고정하여 더 길어도 줄임 처리 */
  .recipe-card .card-title {
    display: -webkit-box;
    -webkit-line-clamp: 2; /* 최대 2줄 */
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 0.5rem;
  }

  /* 보유/필요 배지는 최대 높이 제한 후 넘치면 감춤 */
  .recipe-card .ingredient-status {
    overflow: hidden;
    max-height: 48px; /* 상황에 맞춰 조정 가능 (2줄 정도) */
  }

  /* 버튼 푸터는 하단 고정 */
  .recipe-card .card-footer {
    position: absolute;   /* 버튼을 하단 고정 */
    right: 0;
    left: 0;
    bottom: 0;
    height: 44px;                 /* 푸터 고정 높이 */
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin-top: 0 !important;
    background: transparent !important; /* Bootstrap 기본 흰 배경 제거 */
    border: 0 !important;               /* 상단 보더 제거 */
    text-align: end;
    padding-bottom: 0.5rem; /* 기존 여백 유지 */
    padding-right: 0.5rem;
    z-index: 1; /* 레이어 충돌 방지 */
  }

  /* 카드 전체는 넘침 표시 (푸터와 겹침 이슈 방지) */
  .recipe-card {
    overflow: visible;
  }

  /* 좌/우 컬럼 모두 높이 100%로 고정해 버튼 기준이 흔들리지 않게 */
  .recipe-card .col-4,
  .recipe-card .col-8 {
    height: 100%;
  }
</style>