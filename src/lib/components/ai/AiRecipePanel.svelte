<script lang="ts">
  import { marked } from "marked";
  import { GoogleGenerativeAI } from "@google/generative-ai";
  import { ingredients } from "$lib/stores/inventory";
  import { aiWaiting, aiResponseMd, savedRecipes } from "$lib/stores/ui";
  import { getAiRecipeJSON, toMarkdown } from "$lib/services/ai";
  import type { AiRecipeJSON } from "$lib/types/recipe";

  let mode: "current" | "desired" = "current";
  let desired = "";

  const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

  async function runAi() {
    aiWaiting.set(true);
    aiResponseMd.set("");
    const myIngredientsList = $ingredients
      .map((i) => i.product.name.split("(")[0].trim())
      .join(", ");
    try {
      const json: AiRecipeJSON = await getAiRecipeJSON({
        genAI,
        ingredientsList: myIngredientsList,
        mode,
        desiredInput: desired,
      });
      const md = toMarkdown(json);
      aiResponseMd.set(md);
    } catch (e) {
      aiResponseMd.set("⚠️ AI 응답을 가져오는 중 문제가 발생했습니다.");
      console.error(e);
    } finally {
      aiWaiting.set(false);
    }
  }

  function saveRecipe() {
    const text = $aiResponseMd;
    if (!text) return;
    // 간단한 제목 추출
    const title = text.match(/^##\s*(.+)$/m)?.[1] || text.split("\n")[0];
    const kws = (text.match(/\n\n([가-힣A-Za-z,\s]+)$/)?.[1] || "")
      .split(/,\s*/)
      .filter(Boolean);
    savedRecipes.update((arr) => [...arr, { recipe: text, keywords: kws }]);
    alert("레시피가 저장되었습니다!");
  }
</script>

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
      value="current"
      bind:group={mode}
      checked
    />
    <label class="btn btn-outline-primary" for="ai-current"
      >보유 재료 기반</label
    >
    <input
      type="radio"
      class="btn-check"
      name="ai-type"
      id="ai-desired"
      value="desired"
      bind:group={mode}
    />
    <label class="btn btn-outline-primary" for="ai-desired"
      >메뉴/키워드 기반</label
    >
  </div>

  {#if mode === "desired"}
    <div class="form-floating mb-3">
      <input
        type="text"
        class="form-control"
        id="desiredMenu"
        placeholder="예: 간단한 야식"
        bind:value={desired}
      />
      <label for="desiredMenu">원하는 메뉴나 키워드를 입력하세요</label>
    </div>
  {/if}

  <div class="d-grid">
    <button class="btn btn-success" on:click={runAi} disabled={$aiWaiting}>
      {#if $aiWaiting}
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

  {#if $aiResponseMd}
    <div class="ai-response-box mt-4">{@html marked($aiResponseMd)}</div>
    <div class="mt-4">
      <button on:click={saveRecipe} class="btn btn-dark">레시피 저장</button>
    </div>
  {/if}
</div>

<style>
  /* 페이지 상단의 전역 헤더 영역을 이 컴포넌트에서 꾸밀 수 있도록 :global 사용 */
  :global(.recommend-header) {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    width: 100%;
    justify-content: space-between;
  }
  :global(.recommend-title) {
    font-size: 1.2rem;
    font-weight: bold;
  }
  :global(.gemini-25-flash-select) {
    background: #eee;
    border: none;
    border-radius: 8px;
    padding: 4px 12px;
    font-size: 1rem;
  }
  .ai-box {
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
    padding: 24px;
    margin-bottom: 24px;
    width: 100%;
    text-align: center;
  }
  /* 내부 마크다운 콘텐츠 타이포그래피 */
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
</style>
