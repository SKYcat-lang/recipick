<script lang="ts">
  // --- IMPORTS ---
  import Header from "$lib/components/header.svelte";
  import Footer from "$lib/components/footer.svelte";
  import {
    InventoryItem,
    type ProductInfo,
    type Amount,
    type StepLevel,
    type Unit,
  } from "$lib/Item";
  import { onMount, onDestroy, tick } from "svelte";
  import type Masonry from "masonry-layout";
  import { marked } from "marked"; // ★ 1. marked 라이브러리 임포트

  // --- 1. COMPONENT STATE ---
  // 이 페이지의 핵심 데이터입니다.
  let ingredients: InventoryItem[] = []; // 초기값은 onMount에서 설정

  // ★★★ AI 레시피 추천 기능 관련 상태 변수들 ★★★
  let aiRecommendationType: "current" | "desired" = "current";
  let desiredMenuInput = "";
  let aiResponse = "";
  let isWaitingForAI = false;

  // ★★★ handleImageError 함수 아래에 AI 추천 요청 함수 추가 ★★★
  async function getAiRecipe() {
    isWaitingForAI = true;
    aiResponse = ""; // 이전 응답 지우기

    let prompt = "";
    const myIngredientsList = ingredients
      .map((ing) => ing.product.name.split("(")[0].trim())
      .join(", ");

    if (aiRecommendationType === "current") {
      prompt = `현재 가지고 있는 재료는 ${myIngredientsList} 입니다. 이 재료들을 활용한 멋진 레시피를 하나 창작해주세요.`;
    } else {
      if (!desiredMenuInput.trim()) {
        alert("메뉴나 키워드를 입력해주세요.");
        isWaitingForAI = false;
        return;
      }
      prompt = `"${desiredMenuInput}" 컨셉의 레시피를 창작해줘. 현재 가진 재료는 ${myIngredientsList} 이니, 이 재료들을 활용하면 더 좋아.`;
    }

    console.log("AI에게 보낼 프롬프트:", prompt);

    // ★★★★★ 현재 재료 기반의 새로운 데모 응답으로 교체 ★★★★★
    setTimeout(() => {
      aiResponse = `### 🌮 AI 창작! 구수한 된장 포크 타코

또띠아와 된장의 의외의 만남! 든든하고 특별한 한 끼 식사로 도전해보세요.

**✅ 필요 재료**
* **보유 재료:** 또띠아, 찌개용 돼지고기, 감자, 된장, 고추
* **추가하면 좋은 재료:** 양파, 다진 마늘

**📋 조리법**
1.  감자는 얇게 채 썰어 물에 잠시 담가 전분기를 빼줍니다.
2.  돼지고기는 잘게 다지고, 고추는 송송 썰어주세요.
3.  팬에 기름을 두르고 돼지고기와 다진 마늘을 볶다가, 고기가 익으면 감자채와 고추를 넣고 함께 볶습니다.
4.  된장 1큰술에 물 2큰술, 설탕 1작은술을 섞어 '특제 된장 소스'를 만듭니다.
5.  또띠아를 살짝 구운 뒤, 그 위에 볶은 재료를 올리고 된장 소스를 뿌려주면 완성!

> **✨ 꿀팁!**
> 돼지고기에 후추로 밑간을 살짝 해주면 풍미가 더욱 살아납니다. 모짜렐라 치즈가 있다면 살짝 녹여 올려도 환상적인 맛을 자랑합니다.`;

      isWaitingForAI = false;
    }, 2000);
  }

  // 데모 시연을 위한 임시 데이터
  const useDemoData = true;
  const demoRecipes = [
    {
      name: "시금치 우유 소스와 그린매쉬드포테이토",
      seq: "DEMO001",
      image: "http://www.foodsafetykorea.go.kr/uploadimg/cook/10_00089_2.png",
      ingredients: [
        "감자",
        "시금치우유 소스",
        "아몬드",
        "설탕",
        "크랜베리",
        "치커리 약간",
        "시금치",
        "우유",
      ],
    },
    {
      name: "된장국",
      seq: "DEMO002",
      image: "http://www.foodsafetykorea.go.kr/uploadimg/cook/10_00037_2.png",
      ingredients: ["된장", "두부", "애호박", "양파", "대파", "고추"],
    },
  ];

  // API 응답 데이터 타입 (이제 이미지 URL도 포함)
  let recipeResults: {
    name: string;
    link: string;
    image: string;
    have: string[]; // 보유 재료 목록
    missing: string[]; // 필요한 재료 목록
    color: string;
  }[] = [];

  let isLoadingRecipes = false;
  let apiError: string | null = null;
  let showUrlInput = false;

  // --- 2. ADD ITEM MODAL: Logic & State ---
  // '새 식자재 추가' 모달과 관련된 모든 로직과 상태입니다.
  let addModal: Modal;
  let modalElement: HTMLElement;

  const defaultFormState = {
    selectedProduct: null as ProductInfo | null,
    amountType: "count" as "count" | "step" | "exact",
    countValue: undefined as number | undefined,
    stepLevel: "half" as StepLevel,
    exactValue: undefined as number | undefined,
    exactUnit: "g" as Unit,
    purchaseDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
    memo: "",
    selectedImage: "",
  };
  let formState = { ...defaultFormState };

  function handleProductSelect(product: ProductInfo) {
    formState.selectedProduct = product;
  }

  function resetForm() {
    formState = { ...defaultFormState };
  }

  function handleSubmit() {
    if (!formState.selectedProduct) {
      alert("제품을 선택해주세요.");
      return;
    }

    let amount: Amount;
    switch (formState.amountType) {
      case "count":
        if (!formState.countValue || formState.countValue <= 0) {
          alert("개수를 올바르게 입력해주세요.");
          return;
        }
        amount = { type: "count", value: formState.countValue };
        break;
      case "step":
        amount = { type: "step", level: formState.stepLevel };
        break;
      case "exact":
        if (!formState.exactValue || formState.exactValue <= 0) {
          alert("용량을 올바르게 입력해주세요.");
          return;
        }
        amount = {
          type: "exact",
          value: formState.exactValue,
          unit: formState.exactUnit,
        };
        break;
    }

    const newItem = new InventoryItem(
      formState.selectedProduct,
      amount,
      new Date(formState.purchaseDate),
      formState.memo,
      formState.expiryDate ? new Date(formState.expiryDate) : undefined,
      formState.selectedImage ?? undefined
    );

    ingredients = [newItem, ...ingredients];
    addModal.hide();
  }

  // --- 3. MASONRY GRID: Logic ---
  // Masonry 벽돌 레이아웃과 관련된 로직입니다.
  let masonryInstance: Masonry | null = null;
  let masonryContainer: HTMLElement;

  // --- ★★★ Food Safety Korea API (XML) 연동 로직 시작 ★★★ ---

  const API_KEY = "YOUR_API_KEY"; // ◀◀◀ [중요] 실제 API 키로 반드시 교체!

  async function fetchRecipes() {
    // ★★★★★ 데모 데이터 사용 로직 ★★★★★
    if (useDemoData) {
      isLoadingRecipes = true;
      apiError = null;
      const myIngredientNames = ingredients.map((ing) =>
        ing.product.name.split("(")[0].trim()
      );

      const processedRecipes = demoRecipes
        .map((recipe) => {
          const have: string[] = [];
          const missing: string[] = [];

          recipe.ingredients.forEach((recipeIng) => {
            // ★★★ 수정된 매칭 로직 시작 ★★★
            // 내가 가진 재료 이름이 레시피 재료를 포함하거나, 그 반대인 경우 true로 판단합니다.
            const isMatch = myIngredientNames.some(
              (myIng) => myIng.includes(recipeIng) || recipeIng.includes(myIng)
            );
            // ★★★ 수정된 매칭 로직 끝 ★★★

            if (isMatch) {
              have.push(recipeIng);
            } else {
              missing.push(recipeIng);
            }
          });

          return { ...recipe, have, missing };
        })
        .filter((r) => r.have.length > 0);

      processedRecipes.sort((a, b) => {
        if (a.missing.length !== b.missing.length)
          return a.missing.length - b.missing.length;
        return b.have.length - a.have.length;
      });

      setTimeout(() => {
        recipeResults = processedRecipes.slice(0, 5).map((item, index) => ({
          seq: item.seq,
          name: item.name,
          link: `https://www.10000recipe.com/recipe/${item.seq}`,
          image: item.image,
          have: item.have,
          missing: item.missing,
          color: ["#ffb6c1", "#d2b48c", "#add8e6", "#90ee90", "#dda0dd"][
            index % 5
          ],
        }));
        isLoadingRecipes = false;
      }, 500);
      return;
    }
    // ★★★★★ 데모 로직 끝 ★★★★★

    if (!API_KEY || API_KEY === "YOUR_API_KEY") {
      apiError =
        "API 키를 입력해주세요. 코드의 API_KEY 변수를 수정해야 합니다.";
      return;
    }
    if (ingredients.length === 0) {
      recipeResults = [];
      return;
    }

    isLoadingRecipes = true;
    apiError = null;
    const url = `https://openapi.foodsafetykorea.go.kr/api/${API_KEY}/COOKRCP01/xml/1/100`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP 오류! 상태: ${response.status}`);
      const xmlText = await response.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");

      const resultCode = xmlDoc.querySelector("CODE")?.textContent;
      if (resultCode !== "INFO-000") {
        const resultMsg = xmlDoc.querySelector("MSG")?.textContent;
        throw new Error(`API 오류: ${resultMsg} (코드: ${resultCode})`);
      }

      const recipeRows = xmlDoc.querySelectorAll("row");
      const myIngredientNames = new Set(
        ingredients.map((ing) => ing.product.name.split("(")[0].trim())
      );

      const matchedRecipes = Array.from(recipeRows)
        .map((row) => {
          const name = row.querySelector("RCP_NM")?.textContent || "";
          const seq = row.querySelector("RCP_SEQ")?.textContent || "";
          const image = row.querySelector("ATT_FILE_NO_MK")?.textContent || "";
          const ingredientsText =
            row.querySelector("RCP_PARTS_DTLS")?.textContent || "";

          // ★★ 재료 파싱 로직 강화 ★★
          const recipeIngredients = ingredientsText
            .replace(/\[.*?\]|●.*?:/g, ",") // [재료], ●양념: 등 섹션 구분자를 콤마로 변경
            .split(",") // 콤마로 재료 덩어리를 분리
            .map((part) => part.trim().split(" ")[0].trim()) // 각 덩어리에서 첫 단어(재료명)만 추출
            .filter((ingName) => ingName && ingName.length > 1); // 빈 문자열과 짧은 단어 제거

          const uniqueRecipeIngredients = [...new Set(recipeIngredients)]; // 레시피의 중복 재료 제거

          const have = [];
          const missing = [];

          uniqueRecipeIngredients.forEach((recipeIng) => {
            // 나의 재료 목록과 비교
            if (myIngredientNames.has(recipeIng)) {
              have.push(recipeIng);
            } else {
              missing.push(recipeIng);
            }
          });

          return { name, seq, image, have, missing };
        })
        .filter((r) => r.have.length > 0) // 내가 가진 재료가 하나라도 있는 레시피만
        .sort((a, b) => {
          // ★★ 정렬 로직 ★★
          if (a.missing.length !== b.missing.length) {
            return a.missing.length - b.missing.length;
          }
          return b.have.length - a.have.length;
        });

      // 최종 UI 데이터로 변환
      recipeResults = matchedRecipes.slice(0, 5).map((item, index) => ({
        name: item.name,
        link: `https://www.10000recipe.com/recipe/${item.seq}`,
        image: item.image,
        have: item.have,
        missing: item.missing,
        color: ["#ffb6c1", "#d2b48c", "#add8e6", "#90ee90", "#dda0dd"][
          index % 5
        ],
      }));

      if (recipeResults.length === 0) {
        apiError = "현재 재료와 일치하는 레시피를 찾지 못했습니다.";
      }
    } catch (error: any) {
      console.error("레시피 처리 중 오류:", error);
      apiError = error.message || "레시피를 처리하는 중 오류가 발생했습니다.";
      recipeResults = [];
    } finally {
      isLoadingRecipes = false;
    }
  }
  // --- ★★★ XML 연동 로직 끝 ★★★ ---

  // ★★★ 이미지 에러 처리를 위한 함수 ★★★
  function handleImageError(event: Event) {
    const target = event.target as HTMLImageElement;
    target.src = "https://via.placeholder.com/150/EEEEEE/AAAAAA?text=No+Image"; // 이미지가 없을 때 표시할 대체 이미지
  }

  async function refreshMasonryLayout() {
    await tick();
    masonryInstance?.layout();
  }

  // --- 4. LIFECYCLE & REACTIVITY ---
  // 컴포넌트의 생명주기(생성, 파괴) 및 반응성 로직입니다.
  onMount(async () => {
    // 예시 데이터로 ingredients 배열 초기화
    ingredients = [
      new InventoryItem(
        findProductInfo("USER002")!,
        { type: "step", level: "full" },
        new Date("2025-06-20"),
        "",
        new Date("2025-06-23"),
        "http://t0.gstatic.com/licensed-image?q=tbn:ANd9GcTh6zUJ2mXogKhNgMZyIqMBBHeZB7BiKTKHtl51ejFlvIQmvAYZ9inzxRcym57p6o5_04S6JHz71bC_Z4962q4"
      ),
      new InventoryItem(
        findProductInfo("USER001")!,
        { type: "step", level: "half" },
        new Date("2025-06-20"),
        "오늘 저녁 메뉴!",
        new Date("2025-06-23"),
        "https://oasisprodproduct.edge.naverncp.com/101939/detail/0_c43f2071-7994-4b16-87fc-aae0712174bc.jpg"
      ),
      new InventoryItem(
        findProductInfo("P006")!,
        { type: "count", value: 12 },
        new Date("2025-06-11"),
        "",
        new Date("2025-06-24")
      ),
      new InventoryItem(
        findProductInfo("P008")!,
        { type: "exact", value: 120, unit: "kg" },
        new Date("2025-06-17"),
        "",
        new Date("2025-06-30")
      ),
      new InventoryItem(
        findProductInfo("P011")!,
        { type: "exact", value: 1000, unit: "g" },
        new Date("2025-06-17"),
        "",
        undefined
      ),
    ];

    // 1. Bootstrap 동적 import
    const { Modal } = await import("bootstrap");

    // 모달 인스턴스 생성 및 이벤트 리스너 연결
    if (modalElement) {
      addModal = new Modal(modalElement);
      modalElement.addEventListener("hidden.bs.modal", resetForm);
    }

    // Masonry 인스턴스 생성
    (async () => {
      const MasonryModule = await import("masonry-layout");
      const Masonry = MasonryModule.default;
      if (masonryContainer) {
        masonryInstance = new Masonry(masonryContainer, {
          itemSelector: ".grid-item",
          percentPosition: true,
          gutter: 16,
        });
      }
    })();
  });

  onDestroy(() => {
    if (masonryInstance) {
      masonryInstance.destroy();
    }
    if (modalElement) {
      modalElement.removeEventListener("hidden.bs.modal", resetForm);
    }
  });

  // ★★★★★ 3. 반응형 로직 통합 및 개선 ★★★★★
  $: if (ingredients && ingredients.length > 0) {
    // ingredients 배열이 존재하고, 비어있지 않을 때만 레시피를 불러옵니다.
    fetchRecipes();

    // Masonry 레이아웃 업데이트는 그대로 유지합니다.
    if (masonryInstance) {
      setTimeout(() => {
        masonryInstance?.reloadItems();
        masonryInstance?.layout();
      }, 100);
    }
  }

  // --- 5. SVELTE ACTIONS ---
  // 템플릿에서 use: 지시어로 사용되는 헬퍼 함수입니다.
  function focusInput(node: HTMLElement) {
    node.focus();
  }

  function autoHeight(node: HTMLTextAreaElement) {
    function updateHeight() {
      node.style.height = "auto";
      const borderWidth = 2;
      node.style.height = `${node.scrollHeight + borderWidth}px`;
      node.dispatchEvent(new CustomEvent("heightChange"));
    }
    node.addEventListener("input", updateHeight);
    Promise.resolve().then(updateHeight);
    return {
      destroy() {
        node.removeEventListener("input", updateHeight);
      },
    };
  }

  // --- 6. STATIC DATA & HELPERS ---
  // 바뀌지 않는 정적 데이터와 순수 함수입니다.
  const SYSTEM_PRODUCTS: ProductInfo[] = [
    {
      productId: "P001",
      name: "계란",
      category: "계란/유제품",
      source: "database",
      image: "/ingredients/계란.png",
    },
    {
      productId: "P002",
      name: "닭고기",
      category: "육류",
      source: "database",
      image: "/ingredients/닭.png",
    },
    {
      productId: "P004",
      name: "사과",
      category: "과일",
      source: "database",
      image: "/ingredients/사과.png",
    },
    {
      productId: "P005",
      name: "대파",
      category: "채소",
      source: "database",
      image: "/ingredients/대파.png",
    },
    {
      productId: "P006",
      name: "고추",
      category: "채소",
      source: "database",
      image: "/ingredients/고추.png",
    },
    {
      productId: "P007",
      name: "당근",
      category: "채소",
      source: "database",
      image: "/ingredients/당근.png",
    },
    {
      productId: "P008",
      name: "감자",
      category: "채소",
      source: "database",
      image: "/ingredients/감자.png",
    },
    {
      productId: "P009",
      name: "애호박",
      category: "채소",
      source: "database",
      image: "/ingredients/애호박.png",
    },
    {
      productId: "P010",
      name: "두부",
      category: "두부/콩 가공품",
      source: "database",
      image: "/ingredients/두부.png",
    },
    {
      productId: "P011",
      name: "된장",
      category: "소스/장류",
      source: "database",
      image: "/ingredients/된장.png",
    },
    {
      productId: "P013",
      name: "스파게티 면",
      category: "면류/파스타",
      source: "database",
      image: "/ingredients/파스타.png",
    },
  ];
  const USER_CUSTOM_PRODUCTS: ProductInfo[] = [
    {
      productId: "USER001",
      name: "찌개용 돼지고기 (500g)",
      category: "육류",
      source: "barcode",
    },
    {
      productId: "USER002",
      name: "또띠아(10개입)",
      category: "면류/파스타",
      source: "barcode",
    },
  ];
  function findProductInfo(productId: string): ProductInfo | undefined {
    let product = SYSTEM_PRODUCTS.find((p) => p.productId === productId);
    if (product) return product;
    return USER_CUSTOM_PRODUCTS.find((p) => p.productId === productId);
  }
</script>

<div
  class="modal fade"
  bind:this={modalElement}
  id="exampleModal"
  tabindex="-1"
  aria-labelledby="exampleModalLabel"
  aria-hidden="true"
>
  <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="exampleModalLabel">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="currentColor"
            class="bi bi-basket-fill me-2"
            viewBox="0 0 16 16"
          >
            <path
              d="M5.071 1.243a.5.5 0 0 1 .858.514L3.383 6h9.234L10.07 1.757a.5.5 0 1 1 .858-.514L13.783 6H15.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-.623l-1.844 6.456a.75.75 0 0 1-.722.544H3.69a.75.75 0 0 1-.722-.544L1.123 8H.5a.5.5 0 0 1-.5-.5v-1A.5.5 0 0 1 .5 6h1.717L5.07 1.243zM3.5 10.5a.5.5 0 1 0-1 0v3a.5.5 0 1 0 1 0zm2.5 0a.5.5 0 1 0-1 0v3a.5.5 0 1 0 1 0zm2.5 0a.5.5 0 1 0-1 0v3a.5.5 0 1 0 1 0zm2.5 0a.5.5 0 1 0-1 0v3a.5.5 0 1 0 1 0zm2.5 0a.5.5 0 1 0-1 0v3a.5.5 0 1 0 1 0z"
            />
          </svg>
          새 식자재 추가
        </h5>
        <button
          type="button"
          class="btn-close"
          data-bs-dismiss="modal"
          aria-label="Close"
        ></button>
      </div>

      <div class="modal-body">
        <div class="mb-3">
          <label for="product-list" class="form-label fw-bold">제품 선택</label>
          <div
            id="product-list"
            class="border rounded p-2"
            style="max-height: 150px; overflow-y: auto;"
          >
            <h6 class="text-muted small px-1 mt-1">기본 식자재</h6>
            {#each SYSTEM_PRODUCTS as product}
              <button
                type="button"
                class="btn btn-outline-secondary btn-sm m-1"
                class:active={formState.selectedProduct?.productId ===
                  product.productId}
                on:click={() => handleProductSelect(product)}
              >
                {product.name}
              </button>
            {/each}

            <hr class="my-2" />

            <h6 class="text-muted small px-1">내가 등록한 식자재</h6>
            {#each USER_CUSTOM_PRODUCTS as product}
              <button
                type="button"
                class="btn btn-outline-info btn-sm m-1"
                class:active={formState.selectedProduct?.productId ===
                  product.productId}
                on:click={() => handleProductSelect(product)}
              >
                {product.name}
              </button>
            {/each}

            <button
              type="button"
              class="btn btn-outline-success btn-sm m-1"
              disabled
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                fill="currentColor"
                class="bi bi-plus-lg"
                viewBox="0 0 16 16"
              >
                <path
                  fill-rule="evenodd"
                  d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"
                />
              </svg>
              직접 추가
            </button>
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label fw-bold">이미지</label>
          <div>
            <div class="btn-group" role="group">
              <button type="button" class="btn btn-outline-primary">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  class="bi bi-emoji-smile-fill"
                  viewBox="0 0 16 16"
                >
                  <path
                    d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16M7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5M4.285 9.567a.5.5 0 0 1 .683.183A3.5 3.5 0 0 0 8 11.5a3.5 3.5 0 0 0 3.032-1.75.5.5 0 1 1 .866.5A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1-3.898-2.25.5.5 0 0 1 .183-.683M10 8c.552 0 1-.672 1-1.5S10.552 5 10 5s-1 .672-1 1.5S9.448 8 10 8"
                  />
                </svg>
                아이콘 선택
              </button>
              <button
                type="button"
                class="btn btn btn-outline-primary"
                on:click={() => (showUrlInput = !showUrlInput)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  class="bi bi-link-45deg"
                  viewBox="0 0 16 16"
                  ><path
                    d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1 1 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4 4 0 0 1-.128-1.287z"
                  /><path
                    d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243z"
                  /></svg
                >
                URL 입력
              </button>
              <button type="button" class="btn btn-outline-primary" disabled>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  class="bi bi-camera-fill"
                  viewBox="0 0 16 16"
                >
                  <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0" />
                  <path
                    d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4zM8 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"
                  />
                </svg>
                사진 촬영
              </button>
            </div>
          </div>
          {#if showUrlInput}
            <div class="input-group input-group-sm">
              <span class="input-group-text">URL</span>
              <input
                type="text"
                class="form-control"
                placeholder="이미지 주소를 여기에 붙여넣으세요"
                bind:value={formState.selectedImage}
              />
            </div>
          {/if}
        </div>

        <div class="mb-3">
          <label class="form-label fw-bold">수량</label>

          <div class="btn-group w-100 mb-2" role="group">
            <input
              type="radio"
              class="btn-check"
              name="amountType"
              id="type-count"
              autocomplete="off"
              checked
              on:change={() => (formState.amountType = "count")}
            />
            <label class="btn btn-outline-primary" for="type-count">개수</label>

            <input
              type="radio"
              class="btn-check"
              name="amountType"
              id="type-step"
              autocomplete="off"
              on:change={() => (formState.amountType = "step")}
            />
            <label class="btn btn-outline-primary" for="type-step">단계</label>

            <input
              type="radio"
              class="btn-check"
              name="amountType"
              id="type-exact"
              autocomplete="off"
              on:change={() => (formState.amountType = "exact")}
            />
            <label class="btn btn-outline-primary" for="type-exact">용량</label>
          </div>

          {#if formState.amountType === "count"}
            <div class="input-group">
              <input
                type="number"
                class="form-control"
                placeholder="예: 12"
                bind:value={formState.countValue}
              />
              <span class="input-group-text">개</span>
            </div>
          {:else if formState.amountType === "step"}
            <div class="btn-group w-100" role="group">
              <button
                type="button"
                class="btn {formState.stepLevel === 'empty'
                  ? 'btn-danger'
                  : 'btn-outline-danger'}"
                on:click={() => (formState.stepLevel = "empty")}>없음</button
              >
              <button
                type="button"
                class="btn {formState.stepLevel === 'low'
                  ? 'btn-warning'
                  : 'btn-outline-warning'}"
                on:click={() => (formState.stepLevel = "low")}>조금</button
              >
              <button
                type="button"
                class="btn {formState.stepLevel === 'half'
                  ? 'btn-info'
                  : 'btn-outline-info'}"
                on:click={() => (formState.stepLevel = "half")}>절반</button
              >
              <button
                type="button"
                class="btn {formState.stepLevel === 'high'
                  ? 'btn-primary'
                  : 'btn-outline-primary'}"
                on:click={() => (formState.stepLevel = "high")}>넉넉</button
              >
              <button
                type="button"
                class="btn {formState.stepLevel === 'full'
                  ? 'btn-success'
                  : 'btn-outline-success'}"
                on:click={() => (formState.stepLevel = "full")}>가득</button
              >
            </div>
          {:else if formState.amountType === "exact"}
            <div class="input-group">
              <input
                type="number"
                class="form-control"
                placeholder="예: 500"
                bind:value={formState.exactValue}
              />
              <div class="dropdown">
                <button
                  class="btn btn-outline-secondary dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  {formState.exactUnit}
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li>
                    <a
                      class="dropdown-item"
                      href="#"
                      on:click|preventDefault={() =>
                        (formState.exactUnit = "g")}>g (그램)</a
                    >
                  </li>
                  <li>
                    <a
                      class="dropdown-item"
                      href="#"
                      on:click|preventDefault={() =>
                        (formState.exactUnit = "kg")}>kg (킬로그램)</a
                    >
                  </li>
                  <li>
                    <a
                      class="dropdown-item"
                      href="#"
                      on:click|preventDefault={() =>
                        (formState.exactUnit = "ml")}>ml (미리리터)</a
                    >
                  </li>
                  <li>
                    <a
                      class="dropdown-item"
                      href="#"
                      on:click|preventDefault={() =>
                        (formState.exactUnit = "l")}>l (리터)</a
                    >
                  </li>
                </ul>
              </div>
            </div>
          {/if}
        </div>

        <div class="row">
          <div class="col">
            <label for="purchase-date" class="form-label fw-bold">구매일</label>
            <input
              type="date"
              class="form-control"
              id="purchase-date"
              bind:value={formState.purchaseDate}
            />
          </div>
          <div class="col">
            <label for="expiry-date" class="form-label fw-bold">소비기한</label>
            <input
              type="date"
              class="form-control"
              id="expiry-date"
              bind:value={formState.expiryDate}
            />
          </div>
        </div>

        <div class="mt-3">
          <label for="item-memo" class="form-label fw-bold">메모</label>
          <textarea
            class="form-control"
            id="item-memo"
            rows="2"
            placeholder="메모를 남겨보세요..."
            bind:value={formState.memo}
          ></textarea>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal"
          >취소</button
        >
        <button type="button" class="btn btn-primary" on:click={handleSubmit}>
          추가하기
        </button>
      </div>
    </div>
  </div>
</div>

<Header />

<main class="main">
  <div class="container-lg py-5">
    <div class="bg-body rounded-3 bg-opacity-75 p-4 p-md-5 shadow-lg">
      <div class="row">
        <div class="col">
          <div class="title">냉장고</div>
          <div class="ingredient-grid" bind:this={masonryContainer}>
            {#each ingredients as ing}
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
                    {#if ing.amount.type == "count"}
                      <!-- svelte-ignore a11y_consider_explicit_label -->
                      <button
                        class="btn btn-secondary btn-sm"
                        on:click={() => ing.amount.value--}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          class="bi bi-dash"
                          viewBox="0 2 16 16"
                        >
                          <path
                            d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8"
                          />
                        </svg>
                      </button>
                      <span>{ing.getDisplayAmount()}</span>
                      <!-- svelte-ignore a11y_consider_explicit_label -->
                      <button
                        class="btn btn-secondary btn-sm"
                        on:click={() => ing.amount.value++}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          class="bi bi-plus"
                          viewBox="0 2 16 16"
                        >
                          <path
                            d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4"
                          />
                        </svg>
                      </button>
                    {:else if ing.amount.type == "exact"}
                      <span>{ing.getDisplayAmount()}</span>
                    {:else if ing.amount.type == "step"}
                      <span>{ing.getDisplayAmount()}</span>
                    {/if}
                    {#if ing.amount.type == "step"}
                      <!-- svelte-ignore a11y_consider_explicit_label -->
                      <button
                        class="btn btn-light col position-relative"
                        on:click={() => 0}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          class="bi bi-sliders2"
                          viewBox="0 0 16 16"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M10.5 1a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4H1.5a.5.5 0 0 1 0-1H10V1.5a.5.5 0 0 1 .5-.5M12 3.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m-6.5 2A.5.5 0 0 1 6 6v1.5h8.5a.5.5 0 0 1 0 1H6V10a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5M1 8a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2A.5.5 0 0 1 1 8m9.5 2a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V13H1.5a.5.5 0 0 1 0-1H10v-1.5a.5.5 0 0 1 .5-.5m1.5 2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5"
                          />
                        </svg>
                      </button>
                    {/if}
                    {#if ing.amount.type == "exact"}
                      <!-- svelte-ignore a11y_consider_explicit_label -->
                      <button
                        class="btn btn-light col position-relative"
                        on:click={() => 0}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          class="bi bi-sliders2"
                          viewBox="0 0 16 16"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M10.5 1a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V4H1.5a.5.5 0 0 1 0-1H10V1.5a.5.5 0 0 1 .5-.5M12 3.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5m-6.5 2A.5.5 0 0 1 6 6v1.5h8.5a.5.5 0 0 1 0 1H6V10a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5M1 8a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2A.5.5 0 0 1 1 8m9.5 2a.5.5 0 0 1 .5.5v4a.5.5 0 0 1-1 0V13H1.5a.5.5 0 0 1 0-1H10v-1.5a.5.5 0 0 1 .5-.5m1.5 2.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5"
                          />
                        </svg>
                      </button>
                    {/if}
                  </div>
                  {#if !ing.memouse}
                    <button
                      type="button"
                      class="memo-box memo-display {!ing.memo
                        ? 'is-placeholder'
                        : ''}"
                      on:click={() => {
                        ing.memouse = true;
                      }}
                    >
                      {ing.memo ? ing.memo : "메모 추가"}
                    </button>
                  {:else}
                    <textarea
                      rows="1"
                      class="memo-box memo-input"
                      placeholder="메모 입력"
                      bind:value={ing.memo}
                      on:keydown={(event) => {
                        if (
                          event.key === "Enter" &&
                          (event.ctrlKey || event.shiftKey)
                        ) {
                          ing.memouse = false;
                          refreshMasonryLayout(); // ★★★ 저장 시에도 레이아웃 업데이트 ★★★
                        }
                      }}
                      on:blur={() => {
                        ing.memouse = false;
                        refreshMasonryLayout(); // ★★★ 편집 완료 시에도 레이아웃 업데이트 ★★★
                      }}
                      use:focusInput
                      use:autoHeight
                      on:heightChange={refreshMasonryLayout}
                    ></textarea>
                  {/if}
                </div>
              </div>
            {/each}
            <button
              class="grid-item rounded-3 p-3 border-dashed position-relative bg-transparent"
              data-bs-toggle="modal"
              data-bs-target="#exampleModal"
            >
              <div class="text-muted">새 제품 추가하기</div>
              <div class="m-4 p-4"></div>
              <div class="position-absolute top-50 start-50 translate-middle">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  class="bi bi-plus-lg"
                  viewBox="0 0 16 16"
                >
                  <path
                    fill-rule="evenodd"
                    d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"
                  />
                </svg>
              </div>
              <small class="text-muted"
                >버튼을 눌러 새로운 식품을 추가하세요!</small
              >
            </button>
          </div>
        </div>
        <div class="col">
          <div class="recommend-header">
            <span class="recommend-title">재료&레시피 추천</span>
            <select class="gpt-select">
              <option>GPT-4</option>
            </select>
          </div>
          <div class="ai-box rounded-2 p-4">
            <div class="text-center mb-3">
              <span class="fw-bold fs-5">AI 레시피 추천</span>
            </div>

            <div class="btn-group w-100 mb-3" role="group">
              <input
                type="radio"
                class="btn-check"
                name="ai-type"
                id="ai-current"
                autocomplete="off"
                checked
                bind:group={aiRecommendationType}
                value={"current"}
              />
              <label class="btn btn-outline-primary" for="ai-current"
                >보유 재료 기반</label
              >

              <input
                type="radio"
                class="btn-check"
                name="ai-type"
                id="ai-desired"
                autocomplete="off"
                bind:group={aiRecommendationType}
                value={"desired"}
              />
              <label class="btn btn-outline-primary" for="ai-desired"
                >메뉴/키워드 기반</label
              >
            </div>

            {#if aiRecommendationType === "desired"}
              <div class="form-floating mb-3">
                <input
                  type="text"
                  class="form-control"
                  id="desiredMenu"
                  placeholder="예: 간단한 야식"
                  bind:value={desiredMenuInput}
                />
                <label for="desiredMenu"
                  >원하는 메뉴나 키워드를 입력하세요</label
                >
              </div>
            {/if}

            <div class="d-grid">
              <button
                class="btn btn-success"
                on:click={getAiRecipe}
                disabled={isWaitingForAI}
              >
                {#if isWaitingForAI}
                  <span
                    class="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  ></span>
                  AI가 레시피를 만들고 있어요...
                {:else}
                  AI에게 레시피 추천받기
                {/if}
              </button>
            </div>

            {#if aiResponse}
              <div class="ai-response-box mt-4">
                {@html marked(aiResponse)}
              </div>
            {/if}
          </div>
          <div class="recipe-list">
            {#if isLoadingRecipes}
              <div class="d-flex justify-content-center p-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
            {:else if apiError}
              <div class="alert alert-danger" role="alert">{apiError}</div>
            {:else if recipeResults.length > 0}
              {#each recipeResults as recipe (recipe.seq)}
                <div class="card recipe-card mb-3 shadow-sm">
                  <div class="row g-0">
                    <div class="col-4">
                      <img
                        src={recipe.image}
                        class="img-fluid rounded-start"
                        alt={recipe.name}
                        on:error={handleImageError}
                      />
                    </div>
                    <div class="col-8 d-flex flex-column">
                      <div class="card-body">
                        <h5 class="card-title mb-2">{recipe.name}</h5>
                        <div class="ingredient-status small">
                          <div class="text-success">
                            <strong class="me-2">✅ 보유</strong>
                            {#if recipe.have.length > 0}
                              {#each recipe.have as ing, i}
                                <span
                                  class="badge bg-success-subtle text-success-emphasis rounded-pill"
                                  >{ing}</span
                                >
                              {/each}
                            {:else}
                              <span class="text-muted">없음</span>
                            {/if}
                          </div>
                          <div class="text-warning-emphasis mt-1">
                            <strong class="me-2">🔍 필요</strong>
                            {#if recipe.missing.length > 0}
                              {#each recipe.missing as ing, i}
                                <span
                                  class="badge bg-warning-subtle text-warning-emphasis rounded-pill"
                                  >{ing}</span
                                >
                              {/each}
                            {:else}
                              <span
                                class="badge bg-info-subtle text-info-emphasis rounded-pill"
                                >모든 재료 보유!</span
                              >
                            {/if}
                          </div>
                        </div>
                      </div>
                      <div
                        class="card-footer bg-transparent border-0 mt-auto text-end pb-2 pe-2"
                      >
                        <a
                          href={recipe.link}
                          class="btn btn-primary btn-sm"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          레시피 보기
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              {/each}
            {:else}
              <div class="text-center text-muted p-4 border rounded-3">
                <p class="mb-0">일치하는 레시피가 없습니다.</p>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
</main>

<Footer />

<style>
  main {
    background-image: url("/background.png");
    background-size: cover;
    background-position: center center;
    background-repeat: no-repeat;
    background-attachment: fixed;
    min-height: 100vh;
  }

  .border-dashed {
    border: 2px dashed #00000050;
  }

  /* ★★★ 메모 관련 스타일 수정/추가 시작 ★★★ */

  /* [핵심] 표시(div)와 편집(textarea) 양쪽에 적용될 공통 스타일 */
  .memo-box {
    width: 100%;
    margin-top: 12px; /* 상단 요소와의 간격 */

    /* Bootstrap의 .form-control-sm 에 맞춰 스타일 통일 */
    font-size: 0.875rem; /* 14px */
    font-family: inherit; /* 부모 폰트 상속 */
    line-height: 1.5;
    padding: 0.25rem 0.5rem; /* 4px 8px */
    text-align: center;

    /* 테두리 크기까지 동일하게 맞추기 위한 설정 */
    border: 1px solid;
    border-radius: 0.25rem; /* 4px */

    /* box-sizing 을 통일하여 padding/border 계산을 일관되게 함 */
    box-sizing: border-box;

    /* 내용이 없어도 최소 높이를 보장하여 UI가 어그러지는 것을 방지 */
    min-height: calc(
      1.5em + 0.5rem + 2px
    ); /* line-height + padding-y + border-y */
  }

  /* 표시 모드(div)에만 적용될 스타일 */
  .memo-display {
    cursor: pointer;
    white-space: pre-line; /* 줄바꿈을 HTML에 표시 */
    word-break: break-all; /* 긴 단어 자동 줄바꿈 */
    border-color: transparent; /* 테두리는 공간만 차지하고 보이지 않게 */
    background-color: transparent;
  }

  /* 메모가 비어있을 때 '메모 추가' 텍스트를 placeholder처럼 보이게 함 */
  .memo-display.is-placeholder {
    color: #6c757d; /* Bootstrap의 placeholder 텍스트 색상 */
  }

  /* 편집 모드(textarea)에만 적용될 스타일 */
  .memo-input {
    resize: none; /* 사용자가 크기 조절 못하게 막기 */
    overflow: hidden; /* [핵심] 스크롤바 강제 제거 */
    border-color: #dee2e6; /* Bootstrap의 기본 테두리 색상 */
    background-color: #fff;
  }

  /* 포커스될 때의 시각적 효과 */
  .memo-input:focus {
    color: #212529;
    background-color: #fff;
    border-color: #86b7fe;
    outline: 0;
    box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
  }

  /* ★★★ 메모 관련 스타일 수정/추가 끝 ★★★ */
  .title {
    font-size: 1.6rem;
    font-weight: bold;
    margin-bottom: 16px;
    text-align: center;
  }

  .grid-item {
    width: calc(
      33.3333% - 10.66px
    ); /* 3열 기준: 16px(gutter) * 2 / 3 의 값을 빼줍니다. */
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
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);
  }
  .ingredient-img {
    width: 64px;
    height: 64px;
    background: #e0e0e0;
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
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    padding: 24px;
    margin-bottom: 24px;
    width: 100%;
    text-align: center;
  }
  /* style 태그 내부에 추가 */
  .ai-response-box :global(h3) {
    font-size: 1.25rem;
    margin-top: 1rem;
    margin-bottom: 0.75rem;
    font-weight: 600;
  }

  .ai-response-box :global(ul),
  .ai-response-box :global(ol) {
    padding-left: 1.5rem;
  }

  .ai-response-box :global(blockquote) {
    border-left: 4px solid #ccc;
    padding-left: 1rem;
    margin-left: 0;
    color: #6c757d;
  }

  /* --- ★★★ 레시피 카드 관련 스타일 시작 ★★★ --- */
  .recipe-item {
    display: flex;
    align-items: center;
    gap: 16px; /* 아이템 간 간격 */
    background: var(--color, #eee);
    border-radius: 12px;
    padding: 12px; /* 패딩 조정 */
    margin-bottom: 16px;
  }

  .recipe-image {
    width: 60px;
    height: 60px;
    border-radius: 8px;
    object-fit: cover; /* 이미지가 잘리지 않고 채워지도록 */
    border: 2px solid rgba(255, 255, 255, 0.5);
    background-color: #f0f0f0;
  }

  .recipe-info {
    flex-grow: 1; /* 남는 공간을 모두 차지하도록 */
    display: flex;
    flex-direction: column;
    font-size: 1.05rem;
  }

  .recipe-name {
    font-weight: bold;
  }

  .recipe-match {
    font-size: 0.9rem;
    opacity: 0.8;
  }

  .recipe-card {
    border: none;
    background-color: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(10px);
    transition: all 0.2s ease-in-out;
  }
  .recipe-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.1) !important;
  }
  .recipe-card .img-fluid {
    height: 100%;
    object-fit: cover;
  }
  .recipe-card .card-body {
    padding: 0.8rem;
  }
  .recipe-card .card-title {
    font-weight: 600;
    font-size: 1.1rem;
  }
  .ingredient-status .badge {
    margin-right: 4px;
    margin-bottom: 4px;
    font-weight: 500;
  }
  /* --- ★★★ 레시피 카드 관련 스타일 끝 ★★★ --- */
</style>
