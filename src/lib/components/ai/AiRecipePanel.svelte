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

  // 확장 옵션 UI 상태
  let showOptions = false;

  let optWeather = false;
  let optWeatherType: "" | "더위" | "맑음" | "비" | "눈" = "";
  let optDiet = { lowSodium: false, lowFat: false, highProtein: false, vegan: false };
  let optSpicy: "" | "순한" | "보통" | "매운" = "";
  let optTime: "" | "15" | "30" | "60" = "";
  let optServings: number | "" = "";
  let optCuisine = { 한식: false, 양식: false, 중식: false, 일식: false };
  let optTools = { airfryer: false, noOven: true };

  function buildModifiers(): string {
    const parts: string[] = [];

    if (optWeather) {
      if (optWeatherType) {
        parts.push(`- 날씨: ${optWeatherType}에 어울리는 메뉴를 제안하세요.`);
      } else {
        parts.push("- 날씨를 반영해 계절/기온에 어울리는 메뉴를 제안하세요.");
      }
    }

    const dietSel: string[] = [];
    if (optDiet.lowSodium) dietSel.push("저염");
    if (optDiet.lowFat) dietSel.push("저지방");
    if (optDiet.highProtein) dietSel.push("고단백");
    if (optDiet.vegan) dietSel.push("비건");
    if (dietSel.length) parts.push(`- 식단 선호: ${dietSel.join(", ")}`);

    if (optSpicy) parts.push(`- 매운맛: ${optSpicy} 수준`);

    if (optTime) parts.push(`- 최대 조리 시간: ${optTime}분 이내`);

    if (optServings) parts.push(`- 인분 수: ${optServings}인분 기준`);

    const cuisines = Object.entries(optCuisine)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (cuisines.length) parts.push(`- 선호 국가/스타일: ${cuisines.join(", ")}`);

    const tools: string[] = [];
    if (optTools.airfryer) tools.push("에어프라이어 사용 가능");
    if (optTools.noOven) tools.push("오븐 없이 조리 가능");
    if (tools.length) parts.push(`- 조리도구 조건: ${tools.join(", ")}`);

    return parts.join("\n");
  }

  async function runAi() {
    aiWaiting.set(true);
    aiResponseMd.set("");
    const myIngredientsList = $ingredients
      .map((i) => i.product.name.split("(")[0].trim())
      .join(", ");
    try {
      const modifiers = buildModifiers();
      const json: AiRecipeJSON = await getAiRecipeJSON({
        genAI,
        ingredientsList: myIngredientsList,
        mode,
        desiredInput: desired,
        modifiers,
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

  <div class="mt-2 text-end">
    <button
      class="btn btn-outline-secondary btn-sm {showOptions ? 'active' : ''}"
      aria-pressed={showOptions}
      aria-expanded={showOptions}
      on:click={() => (showOptions = !showOptions)}
    >
      {#if showOptions}옵션 접기{:else}옵션 펼치기{/if}
    </button>
  </div>

  {#if showOptions}
    <div class="options-panel mt-3 text-start">
      <div class="row g-3">
        <div class="col-12 col-md-6">
          <div class="group-title d-none">날씨</div>
          <input class="btn-check" id="optWeatherBtn" type="checkbox" bind:checked={optWeather} />
          <label class="btn btn-outline-secondary btn-sm" for="optWeatherBtn">날씨 반영</label>

          {#if optWeather}
            <div class="mt-2 d-flex flex-wrap gap-2 align-items-center weather-choices">
              <input class="btn-check" type="radio" name="optWeatherType" id="w-hot" value="더위" bind:group={optWeatherType} />
              <label class="btn btn-outline-secondary btn-sm" for="w-hot">더위</label>

              <input class="btn-check" type="radio" name="optWeatherType" id="w-sunny" value="맑음" bind:group={optWeatherType} />
              <label class="btn btn-outline-secondary btn-sm" for="w-sunny">맑음</label>

              <input class="btn-check" type="radio" name="optWeatherType" id="w-rain" value="비" bind:group={optWeatherType} />
              <label class="btn btn-outline-secondary btn-sm" for="w-rain">비</label>

              <input class="btn-check" type="radio" name="optWeatherType" id="w-snow" value="눈" bind:group={optWeatherType} />
              <label class="btn btn-outline-secondary btn-sm" for="w-snow">눈</label>
            </div>
          {/if}
        </div>

        <div class="col-12">
          <div class="group-title">기능성</div>
          <div class="d-flex flex-wrap gap-2 align-items-center">
            <input class="btn-check" id="optDiet-lowSodium" type="checkbox" bind:checked={optDiet.lowSodium} />
            <label class="btn btn-outline-secondary btn-sm" for="optDiet-lowSodium">저염</label>

            <input class="btn-check" id="optDiet-lowFat" type="checkbox" bind:checked={optDiet.lowFat} />
            <label class="btn btn-outline-secondary btn-sm" for="optDiet-lowFat">저지방</label>

            <input class="btn-check" id="optDiet-highProtein" type="checkbox" bind:checked={optDiet.highProtein} />
            <label class="btn btn-outline-secondary btn-sm" for="optDiet-highProtein">고단백</label>

            <input class="btn-check" id="optDiet-vegan" type="checkbox" bind:checked={optDiet.vegan} />
            <label class="btn btn-outline-secondary btn-sm" for="optDiet-vegan">비건</label>
          </div>
        </div>

        <div class="col-12 col-md-6">
          <div class="group-title">기능성</div>
          <div class="d-flex flex-wrap gap-2 align-items-center">
            <input class="btn-check" type="radio" name="optSpicy" id="spicy-mild" value="순한" bind:group={optSpicy} />
            <label class="btn btn-outline-secondary btn-sm" for="spicy-mild">순한</label>

            <input class="btn-check" type="radio" name="optSpicy" id="spicy-medium" value="보통" bind:group={optSpicy} />
            <label class="btn btn-outline-secondary btn-sm" for="spicy-medium">보통</label>

            <input class="btn-check" type="radio" name="optSpicy" id="spicy-hot" value="매운" bind:group={optSpicy} />
            <label class="btn btn-outline-secondary btn-sm" for="spicy-hot">매운</label>

            <input class="btn-check" type="radio" name="optSpicy" id="spicy-any" value="" bind:group={optSpicy} />
            <label class="btn btn-outline-secondary btn-sm" for="spicy-any">무관</label>
          </div>
        </div>

        <div class="col-6 col-md-3">
          <div class="group-title">시간(분)</div>
          <select class="form-select form-select-sm" bind:value={optTime}>
            <option value="">무관</option>
            <option value="15">≤ 15</option>
            <option value="30">≤ 30</option>
            <option value="60">≤ 60</option>
          </select>
        </div>

        <div class="col-6 col-md-3">
          <div class="group-title">인분</div>
          <input class="form-control form-control-sm" type="number" min="1" max="12" bind:value={optServings} placeholder="예: 2" />
        </div>

        <div class="col-12">
          <div class="group-title">선호 국가/스타일</div>
          <div class="d-flex flex-wrap gap-2 align-items-center">
            <input class="btn-check" id="optCuisine-ko" type="checkbox" bind:checked={optCuisine.한식} />
            <label class="btn btn-outline-secondary btn-sm" for="optCuisine-ko">한식</label>

            <input class="btn-check" id="optCuisine-west" type="checkbox" bind:checked={optCuisine.양식} />
            <label class="btn btn-outline-secondary btn-sm" for="optCuisine-west">양식</label>

            <input class="btn-check" id="optCuisine-cn" type="checkbox" bind:checked={optCuisine.중식} />
            <label class="btn btn-outline-secondary btn-sm" for="optCuisine-cn">중식</label>

            <input class="btn-check" id="optCuisine-jp" type="checkbox" bind:checked={optCuisine.일식} />
            <label class="btn btn-outline-secondary btn-sm" for="optCuisine-jp">일식</label>
          </div>
        </div>

        <div class="col-12">
          <div class="group-title">조리 도구</div>
          <div class="d-flex flex-wrap gap-2 align-items-center">
            <input class="btn-check" id="optTools-airfryer" type="checkbox" bind:checked={optTools.airfryer} />
            <label class="btn btn-outline-secondary btn-sm" for="optTools-airfryer">에어프라이어 사용</label>

            <input class="btn-check" id="optTools-noOven" type="checkbox" bind:checked={optTools.noOven} />
            <label class="btn btn-outline-secondary btn-sm" for="optTools-noOven">오븐 없이 조리</label>
          </div>
        </div>
      </div>
    </div>
  {/if}

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

 .options-panel {
   border: 1px solid #eee;
   border-radius: 8px;
   padding: 12px;
   background: #fafafa;
 }
 .options-panel .group-title {
   font-size: .9rem;
   font-weight: 600;
   margin-bottom: .35rem;
   color: #495057;
 }

 /* 토글/선택 시 버튼 시각 피드백 */
 .options-panel .btn-check:checked + .btn.btn-outline-secondary {
   background-color: var(--bs-secondary);
   border-color: var(--bs-secondary);
   color: #fff;
 }

 /* 토글 버튼 시각적 피드백 강화 */
 .options-panel .btn-check:checked + .btn.btn-outline-secondary {
   background-color: var(--bs-secondary);
   border-color: var(--bs-secondary);
   color: #fff;
 }
</style>
