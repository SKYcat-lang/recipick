<script lang="ts">
  import Header from "$lib/components/header.svelte";
  import Footer from "$lib/components/footer.svelte";
  import FridgeGrid from "$lib/components/fridge/FridgeGrid.svelte";
  import IngredientCard from "$lib/components/fridge/IngredientCard.svelte";
  import AddItemModal from "$lib/components/fridge/AddItemModal.svelte";
  import AiRecipePanel from "$lib/components/ai/AiRecipePanel.svelte";
  import SavedRecipesCarousel from "$lib/components/ai/SavedRecipesCarousel.svelte";
  import RecipeList from "$lib/components/recipes/RecipeList.svelte";

  import { onMount } from "svelte";
  import { InventoryItem } from "$lib/Item";
  import {
    ingredients,
    inventorySignature,
    setIngredients,
  } from "$lib/stores/inventory";
  import { isDesktop, isLoadingRecipes, recipeError } from "$lib/stores/ui";
  import { findProductInfo } from "$lib/data/products";
  import { fetchRecipeMatches } from "$lib/services/foodsafety";
  import { fetchMealDbMatches } from "$lib/services/mealdb";
  import type { MatchedRecipe } from "$lib/types/recipe";

  const API_KEY = import.meta.env.VITE_FSK_API_KEY;
  const CACHE_VER = "v4";
  // MealDB 전용 캐시 버전 (MealDB 결과 캐시 무효화를 분리 관리)
  const MEAL_CACHE_VER = "m2";

  let recipes: MatchedRecipe[] = [];
  let lastRecipesCache: MatchedRecipe[] = [];
  let lastSig = "";
  let tried = false; // 첫 로드 완료 여부(빈 문구 깜빡임/비일관성 방지)
  let bootReady = false; // onMount 초기 세팅(재료 주입) 완료 후에만 호출
  // Masonry 재배치 호출을 위한 컴포넌트 참조
  let desktopGridRef: any;
  let mobileGridRef: any;

  // MealDB 별도 상태
  let recipesMealDb: MatchedRecipe[] = [];
  let mealLoading = false;
  let mealError: string | null = null;
  let mealTried = false;
  let lastRecipesMealCache: MatchedRecipe[] = [];

  // 내 재료명 + aliases를 모두 포함한 검색 키 생성
  function deriveMyNames(cur: InventoryItem[]): string[] {
    const out: string[] = [];
    for (const it of cur) {
      // 기본 이름에서 괄호 설명 제거
      const base = (it?.product?.name || "").split("(")[0].trim();
      if (base) out.push(base);
      // aliases 포함
      const aliases = (it?.product as any)?.aliases as string[] | undefined;
      if (aliases && Array.isArray(aliases)) {
        for (const al of aliases) {
          const s = (al || "").split("(")[0].trim();
          if (s) out.push(s);
        }
      }
    }
    // 중복 제거
    return Array.from(new Set(out));
  }

  async function loadRecipes() {
    isLoadingRecipes.set(true);
    recipeError.set(null);
    tried = false;

    // 초기 부트 완료 전에는 호출하지 않음(재료가 없는 상태로 호출되는 레이스 방지)
    if (!bootReady) {
      isLoadingRecipes.set(false);
      return;
    }

    // 식약처 OPEN-API 키 미설정 시 안내 후 종료
    if (!API_KEY || API_KEY === "YOUR_API_KEY") {
      recipeError.set(
        "식약처 OPEN-API 키(VITE_FSK_API_KEY)가 설정되지 않았습니다. .env에 설정 후 다시 시도하세요."
      );
      recipes = [];
      isLoadingRecipes.set(false);
      tried = true;
      return;
    }

    // 재료가 비어 있으면 호출하지 않음(초기 마운트 시 '보유 없음' 목록 노출 방지)
    const cur = $ingredients ?? [];
    if (!cur.length) {
      // 재료가 아직 준비되지 않은 타이밍이면 기존 목록/상태를 유지하고 반환
      isLoadingRecipes.set(false);
      return;
    }

    const myNames = deriveMyNames(cur);

    // 캐시 키 (구성 서명 기반)
    const sigLocal = $inventorySignature || "";
    const cacheKey = `recipesCache:${CACHE_VER}:${sigLocal}`;

    // 캐시 선반영(SWR) — 화면 깜빡임 최소화
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        const list = parsed?.recipes ?? [];
        const ok =
          Array.isArray(list) &&
          list.some((r: any) => Array.isArray(r?.have) && r.have.length > 0);
        if (ok) {
          recipes = list;
          tried = true;
        }
      }
    } catch {}

    // 일시적 오류 대비: 1회 재시도 + 캐시 폴백
    let attempt = 0;
    let success = false;
    let lastErr: any = null;

    while (attempt < 2 && !success) {
      try {
        const res = await fetchRecipeMatches({ apiKey: API_KEY, myNames });
        recipes = res;
        lastRecipesCache = res;
        recipeError.set(null);
        success = true;
        tried = true;
        // 최신 결과 캐시 저장
        try {
          localStorage.setItem(
            cacheKey,
            JSON.stringify({ time: Date.now(), recipes: res })
          );
        } catch {}
      } catch (e: any) {
        lastErr = e;
        attempt += 1;
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 300));
        }
      }
    }

    if (!success) {
      if (lastRecipesCache.length > 0) {
        // 네트워크/API 일시 오류 시 이전 성공 결과로 폴백해 일관성 유지
        recipes = lastRecipesCache;
        recipeError.set(null);
        tried = true;
      } else {
        recipeError.set(lastErr?.message || "레시피를 불러오지 못했습니다");
        recipes = [];
        tried = true;
      }
    }

    isLoadingRecipes.set(false);
  }

  // MealDB 로더
  async function loadRecipesMealDb() {
    mealLoading = true;
    mealError = null;
    mealTried = false;

    if (!bootReady) {
      mealLoading = false;
      return;
    }
    const cur = $ingredients ?? [];
    if (!cur.length) {
      mealLoading = false;
      return;
    }
    const myNames = deriveMyNames(cur);

    const sigLocal = $inventorySignature || "";
    const cacheKey = `recipesCacheMealDB:${MEAL_CACHE_VER}:${sigLocal}`;

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        const list = parsed?.recipes ?? [];
        if (Array.isArray(list) && list.length > 0) {
          recipesMealDb = list;
          mealTried = true;
        }
      }
    } catch {}

    try {
      const res = await fetchMealDbMatches({ myNames, letter: "a", limit: 60 });
      recipesMealDb = res;
      mealError = null;
      mealTried = true;
      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ time: Date.now(), recipes: res })
        );
      } catch {}
    } catch (e: any) {
      console.error(e);
      mealError = e?.message || "MealDB 레시피를 불러오지 못했습니다";
    } finally {
      mealLoading = false;
    }
  }

  onMount(() => {
    // 데모용 초기 재료
    setIngredients([
      new InventoryItem(
        findProductInfo("USER002") as any,
        { type: "step", level: "full" } as any,
        new Date("2025-06-20"),
        "",
        new Date("2025-06-23"),
        "http://t0.gstatic.com/licensed-image?q=tbn:ANd9GcTh6zUJ2mXogKhNgMZyIqMBBHeZB7BiKTKHtl51ejFlvIQmvAYZ9inzxRcym57p6o5_04S6JHz71bC_Z4962q4"
      ),
      new InventoryItem(
        findProductInfo("USER001") as any,
        { type: "step", level: "half" } as any,
        new Date("2025-06-20"),
        "오늘 저녁 메뉴!",
        new Date("2026-06-23"),
        "https://oasisprodproduct.edge.naverncp.com/101939/detail/0_c43f2071-7994-4b16-87fc-aae0712174bc.jpg"
      ),
      new InventoryItem(
        findProductInfo("P006") as any,
        { type: "count", value: 12 } as any,
        new Date("2025-06-11")
      ),
      new InventoryItem(
        findProductInfo("P008") as any,
        { type: "exact", value: 120, unit: "kg" } as any,
        new Date("2025-06-17")
      ),
      new InventoryItem(
        findProductInfo("P011") as any,
        { type: "exact", value: 1000, unit: "g" } as any,
        new Date("2025-06-17")
      ),
    ]);

    // 반응형 상태
    const mql = window.matchMedia("(min-width: 992px)");
    const apply = () => isDesktop.set(mql.matches);
    apply();
    mql.addEventListener("change", apply);

    // 탭 전환 시 Masonry 재배치
    const tabButtons = document.querySelectorAll<HTMLElement>(
      '[data-bs-toggle="tab"]'
    );
    tabButtons.forEach((btn) => {
      btn.addEventListener("shown.bs.tab", async () => {
        await Promise.resolve();
        desktopGridRef?.relayout?.();
        mobileGridRef?.relayout?.();
      });
    });

    // 초기 재료 준비 완료 감지 후 부트 플래그 설정과 첫 로드 트리거
    let unsub: () => void;
    unsub = ingredients.subscribe(($ings) => {
      if (!bootReady && $ings && $ings.length > 0) {
        bootReady = true;
        lastSig = $inventorySignature || "";
        loadRecipes();
        loadRecipesMealDb();
        // subscribe 콜백은 동기 호출되므로, 반환된 unsubscribe가 초기화된 이후에 실행되도록 지연
        Promise.resolve().then(() => unsub && unsub());
      }
    });
  });

  // 재고 구성 변할 때만 API 호출 (초기 세팅 완료 후에만)
  $: if (bootReady && $inventorySignature && $inventorySignature !== lastSig) {
    lastSig = $inventorySignature;
    loadRecipes();
    loadRecipesMealDb();
  }
</script>

<Header />

<main class="main">
  {#if $isDesktop}
    <div class="container-lg py-5">
      <div
        class="bg-body rounded-3 bg-opacity-75 p-4 p-md-5 shadow-lg d-none d-lg-block desktop-split w-100"
      >
        <div class="row w-100 mx-0">
          <div class="col-12 col-lg-6 left">
            <div class="title">냉장고</div>
            <FridgeGrid items={$ingredients} bind:this={desktopGridRef}>
              {#each $ingredients as ing, i}
                <IngredientCard {ing} index={i} />
              {/each}
              <AddItemModal />
            </FridgeGrid>
          </div>
          <div class="col-12 col-lg-6 right">
            <div class="recommend-header">
              <span class="recommend-title">재료&레시피 추천</span>
              <select class="gemini-25-flash-select"
                ><option>Gemini 2.5 Flash</option></select
              >
            </div>
            <AiRecipePanel />
            <SavedRecipesCarousel />

            <h6 class="mt-2 mb-2">식약처 추천</h6>
            <RecipeList
              {recipes}
              loading={$isLoadingRecipes}
              error={$recipeError}
              {tried}
            />

            <h6 class="mt-3 mb-2">MealDB 추천</h6>
            <RecipeList
              recipes={recipesMealDb}
              loading={mealLoading}
              error={mealError}
              tried={mealTried}
            />
          </div>
        </div>
      </div>
    </div>
  {:else}
    <div class="container-lg py-3">
      <!-- 모바일 탭은 필요 시 동일 컴포넌트로 구성 -->
      <ul class="nav nav-tabs mb-3" id="mobileTabs" role="tablist">
        <li class="nav-item bg-black bg-opacity-10 rounded-top-3" role="presentation">
          <button
            class="nav-link link-dark active"
            id="tab-fridge-tab"
            data-bs-toggle="tab"
            data-bs-target="#tab-fridge"
            type="button"
            role="tab">냉장고</button
          >
        </li>
        <li class="nav-item bg-black bg-opacity-10 rounded-top-3" role="presentation">
          <button
            class="nav-link link-dark"
            id="tab-panels-tab"
            data-bs-toggle="tab"
            data-bs-target="#tab-panels"
            type="button"
            role="tab">추천·AI</button
          >
        </li>
      </ul>
      <div
        class="bg-body rounded-3 bg-opacity-75 p-4 p-md-5 shadow-lg tab-content d-lg-none"
      >
        <div
          class="tab-pane fade show active"
          id="tab-fridge"
          role="tabpanel"
          aria-labelledby="tab-fridge-tab"
        >
          <div class="title">냉장고</div>
          <FridgeGrid
            items={$ingredients}
            mobileTwoCols={true}
            bind:this={mobileGridRef}
          >
            {#each $ingredients as ing, i}
              <IngredientCard {ing} index={i} />
            {/each}
            <AddItemModal />
          </FridgeGrid>
        </div>
        <div
          class="tab-pane fade"
          id="tab-panels"
          role="tabpanel"
          aria-labelledby="tab-panels-tab"
        >
          <div class="recommend-header">
            <span class="recommend-title">재료&레시피 추천</span>
            <select class="gemini-25-flash-select"
              ><option>Gemini 2.5 Flash</option></select
            >
          </div>
          <AiRecipePanel />
          <SavedRecipesCarousel />

          <h6 class="mt-2 mb-2">식약처 추천</h6>
          <RecipeList
            {recipes}
            loading={$isLoadingRecipes}
            error={$recipeError}
            {tried}
          />

          <h6 class="mt-3 mb-2">MealDB 추천</h6>
          <RecipeList
            recipes={recipesMealDb}
            loading={mealLoading}
            error={mealError}
            tried={mealTried}
          />
        </div>
      </div>
    </div>
  {/if}
</main>

<Footer />

<style>
  /* 페이지 배경 등 페이지 고유 스타일만 유지 */
  main {
    background-image: url("/background.png");
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

  /* 레이아웃 안전 장치 */
  .min-w-0 {
    min-width: 0 !important;
  }
  .desktop-split .col.left,
  .desktop-split .col.right {
    min-width: 0;
  }
</style>
