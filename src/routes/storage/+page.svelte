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

  // --- 1. COMPONENT STATE ---
  // 이 페이지의 핵심 데이터입니다.
  let ingredients: InventoryItem[] = []; // 초기값은 onMount에서 설정
  let recipeResults = [
    { name: "닭볶음탕", match: "식자재 8개 일치", color: "#ffb6c1", link: "#" },
    { name: "된장찌개", match: "식자재 5개 일치", color: "#d2b48c", link: "#" },
  ];


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
        amount = { type: "exact", value: formState.exactValue, unit: formState.exactUnit };
        break;
    }

    const newItem = new InventoryItem(
      formState.selectedProduct,
      amount,
      new Date(formState.purchaseDate),
      formState.memo,
      formState.expiryDate ? new Date(formState.expiryDate) : undefined
    );

    ingredients = [newItem, ...ingredients];
    addModal.hide();
  }


  // --- 3. MASONRY GRID: Logic ---
  // Masonry 벽돌 레이아웃과 관련된 로직입니다.
  let masonryInstance: Masonry | null = null;
  let masonryContainer: HTMLElement;

  async function refreshMasonryLayout() {
    await tick();
    masonryInstance?.layout();
  }


  // --- 4. LIFECYCLE & REACTIVITY ---
  // 컴포넌트의 생명주기(생성, 파괴) 및 반응성 로직입니다.
  onMount(async () => {
    // 예시 데이터로 ingredients 배열 초기화
    ingredients = [
      new InventoryItem(findProductInfo("USER002")!,{ type: 'step', level: 'full' },new Date('2025-06-20'),'',new Date('2025-06-23')),
      new InventoryItem(findProductInfo("USER001")!,{ type: 'step', level: 'half' },new Date('2025-06-20'),'오늘 저녁 메뉴!',new Date('2025-06-23')),
      new InventoryItem(findProductInfo("P006")!,{ type: 'count', value: 12 },new Date('2025-06-11'),'',new Date('2025-06-24')),
      new InventoryItem(findProductInfo("P008")!,{ type: 'exact', value: 120, unit: 'kg' },new Date('2025-06-17'),'',new Date('2025-06-30')),
      new InventoryItem(findProductInfo("P011")!,{ type: 'exact', value: 1000, unit: 'g' },new Date('2025-06-17'),'', null),
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

  // ingredients 배열이 변경될 때 Masonry 레이아웃 업데이트
  $: if (masonryInstance && ingredients) {
    setTimeout(() => {
      masonryInstance?.reloadItems();
      masonryInstance?.layout();
    }, 100); // 약간의 딜레이를 주어 이미지 로딩 등 안정성 확보
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
    { productId: "P001", name: "계란", category: "계란/유제품", source: "database" },
    { productId: "P002", name: "닭고기", category: "육류", source: "database" },
    { productId: "P004", name: "사과", category: "과일", source: "database" },
    { productId: "P005", name: "대파", category: "채소", source: "database" },
    { productId: "P006", name: "고추", category: "채소", source: "database" },
    { productId: "P007", name: "당근", category: "채소", source: "database" },
    { productId: "P008", name: "감자", category: "채소", source: "database" },
    { productId: "P009", name: "애호박", category: "채소", source: "database" },
    { productId: "P010", name: "두부", category: "두부/콩 가공품", source: "database" },
    { productId: "P011", name: "된장", category: "소스/장류", source: "database" },
    { productId: "P013", name: "스파게티 면", category: "면류/파스타", source: "database" },
  ];
  const USER_CUSTOM_PRODUCTS: ProductInfo[] = [
    { productId: "USER001", name: "찌개용 돼지고기 (500g)", category: "육류", source: "barcode" },
    { productId: "USER002", name: "또띠아(10개입)", category: "면류/파스타", source: "barcode" },
  ];
  function findProductInfo(productId: string): ProductInfo | undefined {
    let product = SYSTEM_PRODUCTS.find((p) => p.productId === productId);
    if (product) return product;
    return USER_CUSTOM_PRODUCTS.find((p) => p.productId === productId);
  }
</script>

<div class="modal fade" bind:this={modalElement} id="exampleModal" tabindex="-1" aria-labelledby="exampleModalLabel" aria-hidden="true">
  <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      
      <div class="modal-header">
        <h5 class="modal-title" id="exampleModalLabel">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-basket-fill me-2" viewBox="0 0 16 16">
            <path d="M5.071 1.243a.5.5 0 0 1 .858.514L3.383 6h9.234L10.07 1.757a.5.5 0 1 1 .858-.514L13.783 6H15.5a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-.623l-1.844 6.456a.75.75 0 0 1-.722.544H3.69a.75.75 0 0 1-.722-.544L1.123 8H.5a.5.5 0 0 1-.5-.5v-1A.5.5 0 0 1 .5 6h1.717L5.07 1.243zM3.5 10.5a.5.5 0 1 0-1 0v3a.5.5 0 1 0 1 0zm2.5 0a.5.5 0 1 0-1 0v3a.5.5 0 1 0 1 0zm2.5 0a.5.5 0 1 0-1 0v3a.5.5 0 1 0 1 0zm2.5 0a.5.5 0 1 0-1 0v3a.5.5 0 1 0 1 0zm2.5 0a.5.5 0 1 0-1 0v3a.5.5 0 1 0 1 0z"/>
          </svg>
          새 식자재 추가
        </h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>

      <div class="modal-body">
        
        <div class="mb-3">
          <label for="product-list" class="form-label fw-bold">제품 선택</label>
          <div id="product-list" class="border rounded p-2" style="max-height: 150px; overflow-y: auto;">
            <h6 class="text-muted small px-1 mt-1">기본 식자재</h6>
            {#each SYSTEM_PRODUCTS as product}
              <button
                type="button"
                class="btn btn-outline-secondary btn-sm m-1"
                class:active={formState.selectedProduct?.productId === product.productId}
                on:click={() => handleProductSelect(product)}
              >
                {product.name}
              </button>
            {/each}
            
            <hr class="my-2">
            
            <h6 class="text-muted small px-1">내가 등록한 식자재</h6>
            {#each USER_CUSTOM_PRODUCTS as product}
              <button
                type="button"
                class="btn btn-outline-info btn-sm m-1"
                class:active={formState.selectedProduct?.productId === product.productId}
                on:click={() => handleProductSelect(product)}
              >
                {product.name}
              </button>
            {/each}
            
            <button type="button" class="btn btn-outline-success btn-sm m-1" disabled>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-lg" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"/>
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-emoji-smile-fill" viewBox="0 0 16 16">
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16M7 6.5C7 7.328 6.552 8 6 8s-1-.672-1-1.5S5.448 5 6 5s1 .672 1 1.5M4.285 9.567a.5.5 0 0 1 .683.183A3.5 3.5 0 0 0 8 11.5a3.5 3.5 0 0 0 3.032-1.75.5.5 0 1 1 .866.5A4.5 4.5 0 0 1 8 12.5a4.5 4.5 0 0 1-3.898-2.25.5.5 0 0 1 .183-.683M10 8c.552 0 1-.672 1-1.5S10.552 5 10 5s-1 .672-1 1.5S9.448 8 10 8"/>
                  </svg>
                  아이콘 선택
                </button>
                <button type="button" class="btn btn-outline-primary" disabled>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-camera-fill" viewBox="0 0 16 16">
                    <path d="M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0"/>
                    <path d="M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4zM8 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7"/>
                  </svg>
                  사진 촬영
                </button>
              </div>
            </div>
        </div>

        <div class="mb-3">
          <label class="form-label fw-bold">수량</label>

          <div class="btn-group w-100 mb-2" role="group">
            <input type="radio" class="btn-check" name="amountType" id="type-count" autocomplete="off" 
                   checked on:change={() => formState.amountType = 'count'}>
            <label class="btn btn-outline-primary" for="type-count">개수</label>

            <input type="radio" class="btn-check" name="amountType" id="type-step" autocomplete="off"
                   on:change={() => formState.amountType = 'step'}>
            <label class="btn btn-outline-primary" for="type-step">단계</label>

            <input type="radio" class="btn-check" name="amountType" id="type-exact" autocomplete="off"
                   on:change={() => formState.amountType = 'exact'}>
            <label class="btn btn-outline-primary" for="type-exact">용량</label>
          </div>

          {#if formState.amountType === 'count'}
            <div class="input-group">
              <input type="number" class="form-control" placeholder="예: 12" bind:value={formState.countValue}>
              <span class="input-group-text">개</span>
            </div>
          {:else if formState.amountType === 'step'}
            <div class="btn-group w-100" role="group">
              <button type="button" class="btn {formState.stepLevel === 'empty' ? 'btn-danger' : 'btn-outline-danger'}" on:click={() => formState.stepLevel = 'empty'}>없음</button>
              <button type="button" class="btn {formState.stepLevel === 'low' ? 'btn-warning' : 'btn-outline-warning'}" on:click={() => formState.stepLevel = 'low'}>조금</button>
              <button type="button" class="btn {formState.stepLevel === 'half' ? 'btn-info' : 'btn-outline-info'}" on:click={() => formState.stepLevel = 'half'}>절반</button>
              <button type="button" class="btn {formState.stepLevel === 'high' ? 'btn-primary' : 'btn-outline-primary'}" on:click={() => formState.stepLevel = 'high'}>넉넉</button>
              <button type="button" class="btn {formState.stepLevel === 'full' ? 'btn-success' : 'btn-outline-success'}" on:click={() => formState.stepLevel = 'full'}>가득</button>
            </div>
          {:else if formState.amountType === 'exact'}
            <div class="input-group">
              <input type="number" class="form-control" placeholder="예: 500" bind:value={formState.exactValue}>
              <div class="dropdown">
                <button class="btn btn-outline-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                  {formState.exactUnit}
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                  <li><a class="dropdown-item" href="#" on:click|preventDefault={() => formState.exactUnit = 'g'}>g (그램)</a></li>
                  <li><a class="dropdown-item" href="#" on:click|preventDefault={() => formState.exactUnit = 'kg'}>kg (킬로그램)</a></li>
                  <li><a class="dropdown-item" href="#" on:click|preventDefault={() => formState.exactUnit = 'ml'}>ml (미리리터)</a></li>
                  <li><a class="dropdown-item" href="#" on:click|preventDefault={() => formState.exactUnit = 'l'}>l (리터)</a></li>
                </ul>
              </div>
            </div>
          {/if}
        </div>

        <div class="row">
          <div class="col">
            <label for="purchase-date" class="form-label fw-bold">구매일</label>
            <input type="date" class="form-control" id="purchase-date" bind:value={formState.purchaseDate}/>
          </div>
          <div class="col">
            <label for="expiry-date" class="form-label fw-bold">소비기한</label>
            <input type="date" class="form-control" id="expiry-date" bind:value={formState.expiryDate}/>
          </div>
        </div>
        
        <div class="mt-3">
            <label for="item-memo" class="form-label fw-bold">메모</label>
            <textarea class="form-control" id="item-memo" rows="2" placeholder="메모를 남겨보세요..." bind:value={formState.memo}></textarea>
        </div>

      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
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
                  <div class="ingredient-img rounded-3 m-2"><!-- 이미지 자리 --></div>
                  <div class="text-center mb-2">
                    <div>{ing.product.name}</div>
                    {#if ing.expirationDate}
                    <small>{ing.expirationDate?.getUTCFullYear()}년 {ing.expirationDate?.getMonth()+1}월 {ing.expirationDate?.getDate()}일 까지</small>
                    {:else}
                    <small>기한 없음</small>
                    {/if}
                  </div>
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
                    {:else if ing.amount.type == "exact"}
                      <span>{ing.getDisplayAmount()}</span>
                    {:else if ing.amount.type == "step"}
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
                      <button type="button"
                        class="memo-box memo-display { !ing.memo ? 'is-placeholder' : '' }"
                        on:click={() => { ing.memouse = true }}
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
                          if (event.key === 'Enter' && (event.ctrlKey || event.shiftKey)) {
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
                        on:heightChange={refreshMasonryLayout} ></textarea>
                    {/if}
                </div>
              </div>
            {/each}
            <button class="grid-item rounded-3 p-3 border-dashed position-relative bg-transparent"  data-bs-toggle="modal" data-bs-target="#exampleModal">
                <div class="text-muted">새 제품 추가하기</div>
                <div class="m-4 p-4"></div>
                <div class="position-absolute top-50 start-50 translate-middle">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-plus-lg" viewBox="0 0 16 16">
                    <path fill-rule="evenodd" d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"/>
                  </svg>
                </div>
                <small class="text-muted">버튼을 눌러 새로운 식품을 추가하세요!</small>
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
              <a class="btn fw-bold bg-opacity-50 bg-white text-center text-black-50" href={recipe.link}>레시피 확인 하러 가기</a>
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
    min-height: calc(1.5em + 0.5rem + 2px); /* line-height + padding-y + border-y */
  }

  /* 표시 모드(div)에만 적용될 스타일 */
  .memo-display {
    cursor: pointer;
    white-space: pre-line;   /* 줄바꿈을 HTML에 표시 */
    word-break: break-all;   /* 긴 단어 자동 줄바꿈 */
    border-color: transparent; /* 테두리는 공간만 차지하고 보이지 않게 */
    background-color: transparent;
  }

  /* 메모가 비어있을 때 '메모 추가' 텍스트를 placeholder처럼 보이게 함 */
  .memo-display.is-placeholder {
    color: #6c757d; /* Bootstrap의 placeholder 텍스트 색상 */
  }

  /* 편집 모드(textarea)에만 적용될 스타일 */
  .memo-input {
    resize: none;            /* 사용자가 크기 조절 못하게 막기 */
    overflow: hidden;        /* [핵심] 스크롤바 강제 제거 */
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
</style> 