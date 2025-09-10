<script lang="ts">
  import { onMount, tick } from "svelte";
  import type { ProductInfo } from "$lib/data/products";
  import {
    SYSTEM_PRODUCTS,
    userCustomProducts,
    addUserCustomProduct,
    findProductInfo,
  } from "$lib/data/products";
  import { addItem } from "$lib/stores/inventory";
  import {
    InventoryItem,
    type Amount,
    type StepLevel,
    type Unit,
  } from "$lib/Item";

  let showUrlInput = false;
  let modalEl: HTMLElement;
  let modal: any;

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

  // 2차 모달 요소/인스턴스
  let customModalEl: HTMLElement;
  let customModal: any;

  // 2차 모달 폼 상태
  const customDefaultForm = {
    name: "",
    category: "",
    image: "",
    aliasesText: "",
  };
  let customForm = { ...customDefaultForm };

  function handleCustomSubmit() {
    const name = customForm.name.trim();
    const category = (customForm.category || "").trim() || "기타";
    if (!name) {
      alert("제품 이름을 입력하세요.");
      return;
    }
    const aliases = (customForm.aliasesText || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const created = addUserCustomProduct({
      name,
      category,
      image: customForm.image?.trim(),
      aliases,
    });
    // 신규 상품 즉시 선택
    handleProductSelect(created);
    // 2차 모달 닫기
    customModal?.hide();
  }

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
        amount = { type: "count", value: formState.countValue } as any;
        break;
      case "step":
        amount = { type: "step", level: formState.stepLevel } as any;
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
        } as any;
        break;
    }
    const newItem = new InventoryItem(
      formState.selectedProduct as any,
      amount as any,
      new Date(formState.purchaseDate),
      formState.memo,
      formState.expiryDate ? new Date(formState.expiryDate) : undefined,
      formState.selectedImage || undefined
    );
    addItem(newItem);
    modal?.hide();
  }

  onMount(async () => {
    // 1) DOM 바인딩 보장
    await tick();
 
    // 2) ESM 번들에서 Modal 로드 (Popper 포함)
    const { Modal } = await import("bootstrap/dist/js/bootstrap.bundle");
 
    // 3) 안전한 인스턴스 획득
    if (modalEl) {
      modal = Modal.getOrCreateInstance(modalEl);
      modalEl.addEventListener("hidden.bs.modal", resetForm);
    }
    // 4) 2차 모달 인스턴스
    if (customModalEl) {
      customModal = Modal.getOrCreateInstance(customModalEl);
      customModalEl.addEventListener("hidden.bs.modal", () => {
        customForm = { ...customDefaultForm };
      });
    }
  });
</script>

<!-- 트리거 카드 -->
<button
  class="grid-item rounded-3 p-3 border-dashed position-relative bg-transparent"
  data-bs-toggle="modal"
  data-bs-target="#addItemModal"
>
  <div class="text-muted">새 식품 추가하기</div>
  <div class="m-4 p-4"></div>
  <div class="position-absolute top-50 start-50 translate-middle">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      fill="currentColor"
      class="bi bi-plus-lg"
      viewBox="0 0 16 16"
      ><path
        fill-rule="evenodd"
        d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2"
      /></svg
    >
  </div>
  <small class="text-muted">버튼을 눌러 새로운 식품을 추가하세요!</small>
</button>

<!-- 모달 본문 -->

<div
  class="modal fade"
  bind:this={modalEl}
  id="addItemModal"
  tabindex="-1"
  aria-labelledby="addItemModalLabel"
  aria-hidden="true"
>
  <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="addItemModalLabel">새 식자재 추가</h5>
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
            {#each $userCustomProducts as product}
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
              data-bs-toggle="modal"
              data-bs-target="#customProductModal"
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
              </svg> 직접 추가
            </button>
          </div>
        </div>
        <div class="mb-3">
          <label class="form-label fw-bold">이미지</label>
          <div>
            <div class="btn-group" role="group">
              <button type="button" class="btn btn-outline-primary" disabled>
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
                </svg> 아이콘 선택
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
                > URL 입력
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
                </svg> 사진 촬영
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
              /> <span class="input-group-text">개</span>
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
        <button type="button" class="btn btn-primary" on:click={handleSubmit}
          >추가하기</button
        >
      </div>
    </div>
  </div>
</div>

<!-- 2차 모달: 사용자 정의 상품 직접 추가 -->
<div
  class="modal fade"
  id="customProductModal"
  tabindex="-1"
  aria-labelledby="customProductModalLabel"
  aria-hidden="true"
  bind:this={customModalEl}
>
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="customProductModalLabel">사용자 정의 식자재 추가</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <div class="mb-2">
          <label class="form-label fw-bold">이름</label>
          <input type="text" class="form-control" placeholder="예: 양파" bind:value={customForm.name} />
        </div>
        <div class="mb-2">
          <label class="form-label fw-bold">카테고리</label>
          <input type="text" class="form-control" placeholder="예: 채소" bind:value={customForm.category} />
        </div>
        <div class="mb-2">
          <label class="form-label fw-bold">이미지 URL(선택)</label>
          <input type="text" class="form-control" placeholder="http(s)://" bind:value={customForm.image} />
        </div>
        <div class="mb-2">
          <label class="form-label fw-bold">별칭(쉼표로 구분)</label>
          <input type="text" class="form-control" placeholder="예: onion, 양파채" bind:value={customForm.aliasesText} />
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">취소</button>
        <button type="button" class="btn btn-success" on:click={handleCustomSubmit}>등록</button>
      </div>
    </div>
  </div>
</div>
 
<style>
  /* 이전 단일 파일 구현과 동일한 점선 테두리 */
  .border-dashed {
    border: 2px dashed #00000050 !important;
  }
</style>
