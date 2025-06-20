<script lang="ts">
import Header from '$lib/components/header.svelte';
import Footer from '$lib/components/footer.svelte';
import { InventoryItem, type ProductInfo } from '$lib/Item'
import { onMount, onDestroy } from 'svelte';
  // 식자재 목록 예시
  //기본으로 식자재 세팅하고
  const SYSTEM_PRODUCTS: ProductInfo[] = [
    { productId: 'P001', name: '계란', category: '계란/유제품', source: 'database' },
    { productId: 'P002', name: '닭고기', category: '육류', source: 'database' },
    { productId: 'P004', name: '사과', category: '과일', source: 'database' },
    { productId: 'P005', name: '대파', category: '채소', source: 'database' },
    { productId: 'P006', name: '고추', category: '채소', source: 'database' },
    { productId: 'P007', name: '당근', category: '채소', source: 'database' },
    { productId: 'P008', name: '감자', category: '채소', source: 'database' },
    { productId: 'P009', name: '애호박', category: '채소', source: 'database' },
    { productId: 'P010', name: '두부', category: '두부/콩 가공품', source: 'database' },
    { productId: 'P011', name: '된장', category: '소스/장류', source: 'database' },
    { productId: 'P013', name: '스파게티 면', category: '면류/파스타', source: 'database' },
  ]
  //유저가 직접 식자재 등록도 가능하게
  const USER_CUSTOM_PRODUCTS: ProductInfo[] = [
    { productId: 'USER001', name: '찌개용 돼지고기 (500g)', category: '육류', source: 'barcode' },
    { productId: 'USER002', name: '또띠아(10개입)', category: '면류/파스타', source: 'barcode' },
  ]
  function findProductInfo(productId: string): ProductInfo | undefined {
    let product = SYSTEM_PRODUCTS.find(p => p.productId === productId);
    if (product) return product;
    return USER_CUSTOM_PRODUCTS.find(p => p.productId === productId);
  }
  let ingredients = [
    new InventoryItem(
      findProductInfo("USER002")!,
      { type: 'step', level: 'full' },
      new Date('2025-06-20'),
      '',
      new Date('2025-06-23')
    ),
    new InventoryItem(
      findProductInfo("USER001")!,
      { type: 'step', level: 'half' },
      new Date('2025-06-20'),
      '오늘 저녁 메뉴!',
      new Date('2025-06-23')
    ),
    new InventoryItem(
      findProductInfo("P006")!,
      { type: 'count', value: 12 },
      new Date('2025-06-11'),
      '',
      new Date('2025-06-24')
    ),
    new InventoryItem(
      findProductInfo("P008")!,
      { type: 'exact', value: 120, unit: 'kg' },
      new Date('2025-06-17'),
      '',
      new Date('2025-06-30')
    ),
    new InventoryItem(
      findProductInfo("P011")!,
      { type: 'exact', value: 1000, unit: 'g' },
      new Date('2025-06-17'),
      '',
      new Date('2025-06-30')
    ),
  ];

  // 레시피 추천 예시
  let recipeResults = [
    {
      name: '닭볶음탕',
      match: '식자재 8개 일치',
      color: '#ffb6c1',
      link: '#',
    },
    {
      name: '된장찌개',
      match: '식자재 5개 일치',
      color: '#d2b48c',
      link: '#',
    },
  ];

  // ★★★ Masonry를 위한 코드 추가 시작 ★★★
  let masonryContainer: HTMLElement;
  let masonryInstance: Masonry | null = null;

  onMount(async () => {
    // SvelteKit의 SSR 환경을 고려한 동적 import
    // (일반 Svelte 환경에서도 이 코드는 안전하게 동작합니다)
    const MasonryModule = await import('masonry-layout');
    const Masonry = MasonryModule.default;

    if (masonryContainer) {
      masonryInstance = new Masonry(masonryContainer, {
        itemSelector: '.grid-item', // 각 아이템을 가리키는 클래스
        percentPosition: true,
        gutter: 16 // 아이템 사이의 간격 (px)
      });
    }
  });

  // ingredients 배열이 바뀔 때마다 레이아웃을 다시 계산
  $: if (masonryInstance && ingredients) {
    setTimeout(() => {
      masonryInstance?.reloadItems();
      masonryInstance?.layout();
    }, 0);
  }

  onDestroy(() => {
    if (masonryInstance) {
      masonryInstance.destroy();
    }
  });
</script>

<Header />

<main class="main">
  <div class="container-lg py-5">
    <div class="bg-body rounded-3 bg-opacity-75 p-4 p-md-5 shadow-lg">
      <div class="row">
      <div class="col">
        <div class="title">식자재</div>
        <div class="ingredient-grid" bind:this={masonryContainer}>
            {#each ingredients as ing}
              <div class="grid-item bg-white rounded-3"> 
                <div class="ingredient-card">
                  <div class="ingredient-img"><!-- 이미지 자리 --></div>
                  <div class="ingredient-name">{ing.product.name}</div>
                  <div class="counter">
                    {#if ing.amount.type == "count"}
                      <!-- svelte-ignore a11y_consider_explicit_label -->
                      <button class="btn btn-secondary btn-sm" on:click={() => ing.amount.value--}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-dash" viewBox="0 2 16 16">
                          <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8"/>
                        </svg>
                      </button>
                      <span>{ing.getDisplayAmount()}</span>
                      <!-- svelte-ignore a11y_consider_explicit_label -->
                      <button class="btn btn-secondary btn-sm" on:click={() => ing.amount.value++}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus" viewBox="0 2 16 16">
                          <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"/>
                        </svg>
                      </button>
                    {/if}
                    {#if ing.amount.type == "exact"}
                      <span>{ing.getDisplayAmount()}</span>
                    {/if}
                    {#if ing.amount.type == "step"}
                      <span>{ing.getDisplayAmount()}</span>
                    {/if}
                  {#if ing.amount.type == "step"}
                    <!-- svelte-ignore a11y_consider_explicit_label -->
                    <button class="btn btn-light col position-relative" on:click={() => 0}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sliders2" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M10.5 1a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4H1.5a.5.5 0 0 1 0-1H10V1.5a.5.5 0 0 1 .5-.5M12 3.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m-6.5 2A.5.5 0 0 1 6 6v1.5h8.5a.5.5 0 0 1 0 1H6V10a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5M1 8a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2A.5.5 0 0 1 1 8m9.5 2a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V13H1.5a.5.5 0 0 1 0-1H10v-1.5a.5.5 0 0 1 .5-.5m1.5 2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5"/>
                      </svg>
                    </button>
                  {/if}
                  {#if ing.amount.type == "exact"}
                    <!-- svelte-ignore a11y_consider_explicit_label -->
                    <button class="btn btn-light col position-relative" on:click={() => 0}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-sliders2" viewBox="0 0 16 16">
                        <path fill-rule="evenodd" d="M10.5 1a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4H1.5a.5.5 0 0 1 0-1H10V1.5a.5.5 0 0 1 .5-.5M12 3.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m-6.5 2A.5.5 0 0 1 6 6v1.5h8.5a.5.5 0 0 1 0 1H6V10a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5M1 8a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2A.5.5 0 0 1 1 8m9.5 2a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V13H1.5a.5.5 0 0 1 0-1H10v-1.5a.5.5 0 0 1 .5-.5m1.5 2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5"/>
                      </svg>
                    </button>
                  {/if}
                  </div>
{#if !ing.memouse}
  <a 
    class="pt-2 text-center small position-relative link-underline-opacity-0 link-dark" 
    href="#" 
    on:click|preventDefault={() => {ing.memouse = true}}
  >
    {ing.memo ? ing.memo : "메모 추가"}
  </a>
{:else}
  <input 
    type="text" 
    class="form-control form-control-sm text-center"
    placeholder="메모 입력 후 Enter"
    bind:value={ing.memo}
    on:keydown={handleKeydown}
    on:blur={() => {ing.memouse = false}}
    use:focusInput
  >
{/if}
                </div>
              </div>
            {/each}
        </div>
      </div>
      <div class="col">
        <div class="recommend-header">
          <span class="recommend-title">재료&레시피 추천</span>
          <select class="gpt-select">
            <option>GPT-4</option>
          </select>
        </div>
        <div class="ai-box">
          <div style="font-size:1.1rem;font-weight:bold;margin-bottom:12px;">메뉴 & 레시피<br/>추천 받기</div>
          <div style="display:flex;gap:16px;justify-content:center;margin-bottom:12px;">
            <div style="width:48px;height:48px;background:#eee;border-radius:12px;"></div>
            <div style="width:48px;height:48px;background:#eee;border-radius:12px;"></div>
          </div>
          <button class="ai-btn">AI 메뉴 추천 - 일치 재료 기반</button>
        </div>
        <div class="recipe-list">
          {#each recipeResults as recipe}
            <div class="recipe-item" style={`--color: ${recipe.color}`}> 
              <span>{recipe.name} - {recipe.match}</span>
              <a class="recipe-link" href={recipe.link}>레시피 확인 하러 가기</a>
            </div>
          {/each}
        </div>
      </div>
      </div>
    </div>
  </div>
</main>

<Footer />

<style>
  main {
    background-image: url('/background.png');
    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
    background-attachment: fixed;
    min-height: 100vh;
  }
  .title {
    font-size: 1.6rem;
    font-weight: bold;
    margin-bottom: 16px;
    text-align: center;
  }

  .grid-item {
    width: calc(33.3333% - 10.66px); /* 3열 기준: 16px(gutter) * 2 / 3 의 값을 빼줍니다. */
    padding: 0;
    margin-bottom: 16px;
  }

  /* 반응형 예시 */
  @media (max-width: 1200px) {
    .grid-item {
      width: calc(50% - 10.66px); /* 화면이 줄어들면 2열 */
    }
  }
  @media (max-width: 767px) {
    .grid-item {
      width: calc(100% - 10.66px); /* 화면이 더 줄어들면 1열 */
    }
  }

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
    background: #e0e0e0;
    border-radius: 8px;
    margin-bottom: 8px;
  }
  .ingredient-name {
    font-size: 1rem;
    margin-bottom: 8px;
    text-align: center;
  }
  .recommend-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    width: 100%;
    justify-content: space-between;
  }
  .recommend-title {
    font-size: 1.2rem;
    font-weight: bold;
  }
  .gpt-select {
    background: #eee;
    border: none;
    border-radius: 8px;
    padding: 4px 12px;
    font-size: 1rem;
  }
  .ai-box {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    padding: 24px;
    margin-bottom: 24px;
    width: 100%;
    text-align: center;
  }
  .ai-btn {
    background: #f5f5f5;
    border: none;
    border-radius: 8px;
    padding: 12px 24px;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
    margin-bottom: 16px;
  }
  .ai-btn:hover {
    background: #e0e0e0;
  }
  .recipe-list {
    width: 100%;
    margin-top: 16px;
  }
  .recipe-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--color, #eee);
    border-radius: 12px;
    padding: 16px 24px;
    margin-bottom: 16px;
    font-size: 1.1rem;
  }
  .recipe-link {
    background: rgba(255,255,255,0.7);
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    color: #333;
    font-weight: bold;
    text-decoration: none;
    transition: background 0.2s;
  }
  .recipe-link:hover {
    background: #fff;
  }
</style> 