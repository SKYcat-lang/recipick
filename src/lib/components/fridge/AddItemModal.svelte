<script lang="ts">
  import { onMount, tick } from "svelte";
  import type { ProductInfo } from "$lib/data/products";
  import {
    SYSTEM_PRODUCTS,
    USER_CUSTOM_PRODUCTS,
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
  });
</script>

<!-- 트리거 카드 -->
<button
  class="grid-item rounded-3 p-3 border-dashed position-relative bg-transparent"
  data-bs-toggle="modal"
  data-bs-target="#addItemModal"
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
        <!-- ... 내용 동일 ... -->
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

<style>
  /* 이전 단일 파일 구현과 동일한 점선 테두리 */
  .border-dashed {
    border: 2px dashed #00000050 !important;
  }
</style>
