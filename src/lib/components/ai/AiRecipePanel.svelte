<script lang="ts">
  import { GoogleGenerativeAI } from "@google/generative-ai";
  import { availableIngredients } from "$lib/stores/inventory";
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
  let optDiet = {
    lowSodium: false,
    lowFat: false,
    highProtein: false,
    vegan: false,
  };
  let optSpicy: "" | "순한" | "보통" | "매운" = "";
  let optTime: "" | "15" | "30" | "60" = "";
  let optServings: number | "" = "";
  let optCuisine = { 한식: false, 양식: false, 중식: false, 일식: false };
  let optTools = { airfryer: false, noOven: true };
  // 끼니 선택(미선택 시 현재 시각 기반 자동 추론)
  let optMeal: "" | "아침" | "점심" | "저녁" = "";
  let aiResult: AiRecipeJSON | null = null;

  function cleanStep(text: string): string {
    let s = (text ?? '').trim();
    const prefixRe = /^(?:\d+[\.\)]|[-*•])\s+/;
    while (prefixRe.test(s)) {
      s = s.replace(prefixRe, '');
    }
    return s;
  }

  function buildModifiers(): string {
    const parts: string[] = [];

    // 끼니/현재 시각 정보
    if (optMeal) {
      // 사용자가 직접 끼니를 선택한 경우: 현재 시각 프롬프트는 제거
      parts.push(`- 끼니: ${optMeal}에 어울리는 메뉴를 제안하세요.`);
    } else {
      const now = new Date();
      const nowStr = now.toLocaleTimeString("ko-KR", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const h = now.getHours();
      let mealByNow: "아침" | "점심" | "저녁" | "야식";
      if (h >= 5 && h < 11) mealByNow = "아침";
      else if (h >= 11 && h < 16) mealByNow = "점심";
      else if (h >= 16 && h < 22) mealByNow = "저녁";
      else mealByNow = "야식";
      parts.push(`- 현재 시각: ${nowStr}`);
      parts.push(`- 끼니: ${mealByNow}에 어울리는 메뉴를 제안하세요.`);
    }

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
    if (cuisines.length)
      parts.push(`- 선호 국가/스타일: ${cuisines.join(", ")}`);

    const tools: string[] = [];
    if (optTools.airfryer) tools.push("에어프라이어 사용 가능");
    if (optTools.noOven) tools.push("오븐 없이 조리 가능");
    if (tools.length) parts.push(`- 조리도구 조건: ${tools.join(", ")}`);

    return parts.join("\n");
  }

  async function runAi() {
    aiWaiting.set(true);
    aiResponseMd.set("");
    const myIngredientsList = $availableIngredients
      .map((i) => i.product.name.split("(")[0].trim())
      .join(", ");
    try {
      // 재료별 메모 블록 구성
      const now = new Date();
const hNow = now.getHours();
let mealByNow: "아침" | "점심" | "저녁" | "야식";
if (hNow >= 5 && hNow < 11) mealByNow = "아침";
else if (hNow >= 11 && hNow < 16) mealByNow = "점심";
else if (hNow >= 16 && hNow < 22) mealByNow = "저녁";
else mealByNow = "야식";
const selectedMeal = optMeal || mealByNow;

const futureRe = /(내일|모레|다음\s*주|이번\s*주말|주말|다다음|다음달|다음\s*달)/;
const todayRe = /오늘/;
const mealRe = {
  "아침": /아침/,
  "점심": /점심/,
  "저녁": /저녁/,
  "야식": /야식/
} as const;

const memoEntries = $availableIngredients
  .map((i) => {
    const name = i.product.name.split("(")[0].trim();
    const memo = (i.memo || "").trim();
    if (!memo) return "";
    // 미래 지시가 있는 메모는 지금 추천에서 제외
    if (futureRe.test(memo)) return "";
    const mentionsAnyMeal = Object.values(mealRe).some((re) => re.test(memo));
    if (todayRe.test(memo)) {
      // 오늘 + 끼니 언급 시, 선택된 끼니와 정확히 일치할 때만 포함
      if (mentionsAnyMeal && !mealRe[selectedMeal].test(memo)) return "";
    } else if (mentionsAnyMeal) {
      // 날짜 언급 없이 끼니만 언급 시, 현재/선택 끼니와 일치할 때만 포함
      if (!mealRe[selectedMeal].test(memo)) return "";
    }
    return `- ${name}: "${memo.replace(/"/g, '\\"')}"`;
  })
  .filter(Boolean);

      const memoBlock = memoEntries.length
        ? `
# 재료 메모
각 항목은 해당 재료에 대한 사용자 메모입니다.
- 시간/날짜가 현재(또는 사용자가 선택한 끼니)와 정확히 일치하는 경우에만 적용하세요.
- 불일치하거나 미래 지시("내일","모레","다음 주" 등)는 지금 추천에서 절대 반영하지 마세요.
- 낮은 가중치로도 반영하지 마세요.
- 메모 텍스트는 출력 JSON에 포함하지 마세요.
${memoEntries.join("\n")}
`
        : "";

      const baseModifiers = buildModifiers();
      const modifiers = [baseModifiers, memoBlock]
        .filter((s) => s && s.trim())
        .join("\n");

      const json: AiRecipeJSON = await getAiRecipeJSON({
        genAI,
        ingredientsList: myIngredientsList,
        mode,
        desiredInput: desired,
        modifiers,
      });
      aiResult = json;
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
          <div class="group-title">기능성</div>
          <input
            class="btn-check"
            id="optWeatherBtn"
            type="checkbox"
            bind:checked={optWeather}
          />
          <label class="btn btn-outline-secondary btn-sm" for="optWeatherBtn"
            >날씨 반영</label
          >

          {#if optWeather}
            <div
              class="mt-2 d-flex flex-wrap gap-2 align-items-center weather-choices"
            >
              <input
                class="btn-check"
                type="radio"
                name="optWeatherType"
                id="w-hot"
                value="더위"
                bind:group={optWeatherType}
              />
              <label class="btn btn-outline-secondary btn-sm" for="w-hot"
                >더위</label
              >

              <input
                class="btn-check"
                type="radio"
                name="optWeatherType"
                id="w-sunny"
                value="맑음"
                bind:group={optWeatherType}
              />
              <label class="btn btn-outline-secondary btn-sm" for="w-sunny"
                >맑음</label
              >

              <input
                class="btn-check"
                type="radio"
                name="optWeatherType"
                id="w-rain"
                value="비"
                bind:group={optWeatherType}
              />
              <label class="btn btn-outline-secondary btn-sm" for="w-rain"
                >비</label
              >

              <input
                class="btn-check"
                type="radio"
                name="optWeatherType"
                id="w-snow"
                value="눈"
                bind:group={optWeatherType}
              />
              <label class="btn btn-outline-secondary btn-sm" for="w-snow"
                >눈</label
              >
            </div>
          {/if}
        </div>

        <div class="col-12">
          <div class="mt-3">
            <div class="group-title">시간대</div>
            <div class="d-flex flex-wrap gap-2 align-items-center">
              <input
                class="btn-check"
                type="radio"
                name="optMeal"
                id="meal-auto"
                value=""
                bind:group={optMeal}
              />
              <label class="btn btn-outline-secondary btn-sm" for="meal-auto"
                >자동(현재 시각)</label
              >

              <input
                class="btn-check"
                type="radio"
                name="optMeal"
                id="meal-breakfast"
                value="아침"
                bind:group={optMeal}
              />
              <label
                class="btn btn-outline-secondary btn-sm"
                for="meal-breakfast">아침</label
              >

              <input
                class="btn-check"
                type="radio"
                name="optMeal"
                id="meal-lunch"
                value="점심"
                bind:group={optMeal}
              />
              <label class="btn btn-outline-secondary btn-sm" for="meal-lunch"
                >점심</label
              >

              <input
                class="btn-check"
                type="radio"
                name="optMeal"
                id="meal-dinner"
                value="저녁"
                bind:group={optMeal}
              />
              <label class="btn btn-outline-secondary btn-sm" for="meal-dinner"
                >저녁</label
              >
            </div>
          </div>
        </div>
        <div class="col-12">
          <div class="group-title">식단</div>
          <div class="d-flex flex-wrap gap-2 align-items-center">
            <input
              class="btn-check"
              id="optDiet-lowSodium"
              type="checkbox"
              bind:checked={optDiet.lowSodium}
            />
            <label
              class="btn btn-outline-secondary btn-sm"
              for="optDiet-lowSodium">저염</label
            >

            <input
              class="btn-check"
              id="optDiet-lowFat"
              type="checkbox"
              bind:checked={optDiet.lowFat}
            />
            <label class="btn btn-outline-secondary btn-sm" for="optDiet-lowFat"
              >저지방</label
            >

            <input
              class="btn-check"
              id="optDiet-highProtein"
              type="checkbox"
              bind:checked={optDiet.highProtein}
            />
            <label
              class="btn btn-outline-secondary btn-sm"
              for="optDiet-highProtein">고단백</label
            >

            <input
              class="btn-check"
              id="optDiet-vegan"
              type="checkbox"
              bind:checked={optDiet.vegan}
            />
            <label class="btn btn-outline-secondary btn-sm" for="optDiet-vegan"
              >비건</label
            >
          </div>
        </div>

        <div class="col-12 col-md-6">
          <div class="group-title">매운맛</div>
          <div class="d-flex flex-wrap gap-2 align-items-center">
            <input
              class="btn-check"
              type="radio"
              name="optSpicy"
              id="spicy-mild"
              value="순한"
              bind:group={optSpicy}
            />
            <label class="btn btn-outline-secondary btn-sm" for="spicy-mild"
              >순한</label
            >

            <input
              class="btn-check"
              type="radio"
              name="optSpicy"
              id="spicy-medium"
              value="보통"
              bind:group={optSpicy}
            />
            <label class="btn btn-outline-secondary btn-sm" for="spicy-medium"
              >보통</label
            >

            <input
              class="btn-check"
              type="radio"
              name="optSpicy"
              id="spicy-hot"
              value="매운"
              bind:group={optSpicy}
            />
            <label class="btn btn-outline-secondary btn-sm" for="spicy-hot"
              >매운</label
            >

            <input
              class="btn-check"
              type="radio"
              name="optSpicy"
              id="spicy-any"
              value=""
              bind:group={optSpicy}
            />
            <label class="btn btn-outline-secondary btn-sm" for="spicy-any"
              >무관</label
            >
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
          <input
            class="form-control form-control-sm"
            type="number"
            min="1"
            max="12"
            bind:value={optServings}
            placeholder="예: 2"
          />
        </div>

        <div class="col-12">
          <div class="group-title">선호 국가/스타일</div>
          <div class="d-flex flex-wrap gap-2 align-items-center">
            <input
              class="btn-check"
              id="optCuisine-ko"
              type="checkbox"
              bind:checked={optCuisine.한식}
            />
            <label class="btn btn-outline-secondary btn-sm" for="optCuisine-ko"
              >한식</label
            >

            <input
              class="btn-check"
              id="optCuisine-west"
              type="checkbox"
              bind:checked={optCuisine.양식}
            />
            <label
              class="btn btn-outline-secondary btn-sm"
              for="optCuisine-west">양식</label
            >

            <input
              class="btn-check"
              id="optCuisine-cn"
              type="checkbox"
              bind:checked={optCuisine.중식}
            />
            <label class="btn btn-outline-secondary btn-sm" for="optCuisine-cn"
              >중식</label
            >

            <input
              class="btn-check"
              id="optCuisine-jp"
              type="checkbox"
              bind:checked={optCuisine.일식}
            />
            <label class="btn btn-outline-secondary btn-sm" for="optCuisine-jp"
              >일식</label
            >
          </div>
        </div>

        <div class="col-12">
          <div class="group-title">조리 도구</div>
          <div class="d-flex flex-wrap gap-2 align-items-center">
            <input
              class="btn-check"
              id="optTools-airfryer"
              type="checkbox"
              bind:checked={optTools.airfryer}
            />
            <label
              class="btn btn-outline-secondary btn-sm"
              for="optTools-airfryer">에어프라이어 사용</label
            >

            <input
              class="btn-check"
              id="optTools-noOven"
              type="checkbox"
              bind:checked={optTools.noOven}
            />
            <label
              class="btn btn-outline-secondary btn-sm"
              for="optTools-noOven">오븐 없이 조리</label
            >
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if aiResult}
    <div class="ai-response-box mt-4">
      <h3 class="recipe-title">{aiResult.이름}</h3>

      <div class="ingredients mt-3">
        <div class="group-title"><strong>필요 재료</strong></div>
        <div class="ing-row recipe-ingredient">
          보유 재료: {aiResult.재료.보유재료.join(", ")}
        </div>
        <div class="ing-row recipe-ingredient">
          추가 추천 재료: {aiResult.재료.추가추천재료 &&
          aiResult.재료.추가추천재료.length
            ? aiResult.재료.추가추천재료.join(", ")
            : "-"}
        </div>
      </div>

      <div class="steps mt-3">
        <div class="group-title"><strong>조리법</strong></div>
        <ol class="recipe-steps">
          {#each aiResult.레시피 as step}
            <li>{cleanStep(step)}</li>
          {/each}
        </ol>
      </div>

      <div class="keywords mt-3">
        <div class="d-flex flex-wrap gap-2">
          {#each aiResult.키워드 as kw}
            <span class="badge bg-secondary">{kw}</span>
          {/each}
        </div>
      </div>
    </div>
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
  /* 구조화된 레시피 뷰 스타일 */
  .ai-response-box .recipe-title {
    font-size: 1.35rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
  }
  .ai-response-box .recipe-steps {
    text-align: left;
    padding-left: 1.5rem;
  }
  .ai-response-box .recipe-steps li {
    text-align: left;
  }
  .ai-response-box .recipe-ingredient {
    text-align: left;
  }
  /* 내부 마크다운 콘텐츠 타이포그래피 */
  .ai-response-box .group-title {
    font-size: 1.08rem;
    text-align: left;
    margin-top: 0.45rem;
    margin-bottom: 0.35rem;
  }
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
    font-size: 0.9rem;
    font-weight: 600;
    margin-bottom: 0.35rem;
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
