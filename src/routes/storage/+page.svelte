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
  import { fetchRecipeMatches, demoProcess } from "$lib/services/foodsafety";
  import type { MatchedRecipe } from "$lib/types/recipe";

  const USE_DEMO = true; // 필요 시 false로
  const API_KEY = import.meta.env.VITE_FSK_API_KEY;

  let recipes: MatchedRecipe[] = [];
  let lastSig = "";
  // Masonry 재배치 호출을 위한 컴포넌트 참조
  let desktopGridRef: any;
  let mobileGridRef: any;

  async function loadRecipes() {
    isLoadingRecipes.set(true);
    recipeError.set(null);
    try {
      const myNames = $ingredients.map((i: InventoryItem) =>
        i.product.name.split("(")[0].trim()
      );
      recipes = USE_DEMO
        ? demoProcess(myNames)
        : await fetchRecipeMatches({ apiKey: API_KEY, myNames });
    } catch (e: any) {
      recipeError.set(e?.message || "레시피를 불러오지 못했습니다");
      recipes = [];
    } finally {
      isLoadingRecipes.set(false);
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
        new Date("2025-06-23"),
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
    const tabButtons = document.querySelectorAll<HTMLElement>('[data-bs-toggle="tab"]');
    tabButtons.forEach((btn) => {
      btn.addEventListener("shown.bs.tab", async () => {
        await Promise.resolve();
        desktopGridRef?.relayout?.();
        mobileGridRef?.relayout?.();
      });
    });
  });

  // 재고 구성 변할 때만 API 호출
  $: if ($inventorySignature && $inventorySignature !== lastSig) {
    lastSig = $inventorySignature;
    loadRecipes();
  }
</script>

<Header />

<main class="main">
  <div class="container-lg py-5">
    {#if $isDesktop}
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
            <RecipeList
              {recipes}
              loading={$isLoadingRecipes}
              error={$recipeError}
            />
          </div>
        </div>
      </div>
    {:else}
      <!-- 모바일 탭은 필요 시 동일 컴포넌트로 구성 -->
      <ul class="nav nav-tabs mb-3" id="mobileTabs" role="tablist">
        <li class="nav-item" role="presentation">
          <button
            class="nav-link active"
            id="tab-fridge-tab"
            data-bs-toggle="tab"
            data-bs-target="#tab-fridge"
            type="button"
            role="tab">냉장고</button
          >
        </li>
        <li class="nav-item" role="presentation">
          <button
            class="nav-link"
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
          <FridgeGrid items={$ingredients} mobileTwoCols={true} bind:this={mobileGridRef}>
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
          <RecipeList
            {recipes}
            loading={$isLoadingRecipes}
            error={$recipeError}
          />
        </div>
      </div>
    {/if}
  </div>
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
