<script lang="ts">
  import Header from "$lib/components/header.svelte";
  import Footer from "$lib/components/footer.svelte";
  import { onMount } from "svelte";
  import { page } from "$app/stores";

  const API_KEY = import.meta.env.VITE_FSK_API_KEY as string;

  type Step = { text: string; img?: string };
  type DetailRecipe = {
    seq: string;
    name: string;
    imageMain: string;
    imageSmall: string;
    way: string;
    category: string;
    weight: string;
    kcal: string;
    carb: string;
    protein: string;
    fat: string;
    sodium: string;
    hashtag: string;
    parts: string;
    steps: Step[];
    tip: string;
  };

  let loading = true;
  let error: string | null = null;
  let recipe: DetailRecipe | null = null;

  function handleImageError(e: Event) {
    (e.target as HTMLImageElement).src =
      "https://via.placeholder.com/300/EEEEEE/AAAAAA?text=No+Image";
  }

  function getText(el: Element | null, sel: string) {
    return (el?.querySelector(sel)?.textContent || "").trim();
  }

  function getManualSteps(row: Element) {
    const steps: Step[] = [];
    for (let i = 1; i <= 20; i++) {
      const idx = String(i).padStart(2, "0");
      const t = getText(row, `MANUAL${idx}`);
      const img = getText(row, `MANUAL_IMG${idx}`);
      const text = t.replace(/^\d+\)\s*/, "").trim();
      if (!text && !img) continue;
      steps.push({ text, img: img || undefined });
    }
    return steps;
  }

  async function fetchDetail(seq: string) {
    loading = true;
    error = null;
    recipe = null;

    if (!API_KEY || API_KEY === "YOUR_API_KEY") {
      error =
        "식약처 OPEN-API 키(VITE_FSK_API_KEY)가 설정되지 않았습니다. .env에 설정 후 다시 시도하세요.";
      loading = false;
      return;
    }

    try {
      // 충분히 넓은 범위를 요청하여 상세를 조회 (API가 RCP_SEQ 직접 조회 파라미터를 제공하지 않음)
      const url = `https://openapi.foodsafetykorea.go.kr/api/${API_KEY}/COOKRCP01/xml/1/1000`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP 오류: ${res.status}`);
      const xmlText = await res.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, "text/xml");

      const code = xmlDoc.querySelector("CODE")?.textContent?.trim();
      if (code !== "INFO-000") {
        const msg = xmlDoc.querySelector("MSG")?.textContent?.trim() || "";
        throw new Error(`API 오류: ${msg} (코드: ${code})`);
      }

      const rows = Array.from(xmlDoc.querySelectorAll("row"));
      const row = rows.find(
        (r) => getText(r, "RCP_SEQ") === seq
      );
      if (!row) {
        error = "해당 레시피를 찾을 수 없습니다.";
        loading = false;
        return;
      }

      const rec: DetailRecipe = {
        seq,
        name: getText(row, "RCP_NM"),
        imageMain:
          getText(row, "ATT_FILE_NO_MK") ||
          getText(row, "ATT_FILE_NO_MAIN"),
        imageSmall: getText(row, "ATT_FILE_NO_MAIN"),
        way: getText(row, "RCP_WAY2"),
        category: getText(row, "RCP_PAT2"),
        weight: getText(row, "INFO_WGT"),
        kcal: getText(row, "INFO_ENG"),
        carb: getText(row, "INFO_CAR"),
        protein: getText(row, "INFO_PRO"),
        fat: getText(row, "INFO_FAT"),
        sodium: getText(row, "INFO_NA"),
        hashtag: getText(row, "HASH_TAG"),
        parts: getText(row, "RCP_PARTS_DTLS"),
        steps: getManualSteps(row),
        tip: getText(row, "RCP_NA_TIP"),
      };

      recipe = rec;
    } catch (e: any) {
      console.error(e);
      error = e?.message || "레시피 상세를 불러오는 중 오류가 발생했습니다.";
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    const seq = $page.params.seq;
    fetchDetail(seq);
  });
</script>

<Header />

<main class="main">
  <div class="container-lg py-4">

    {#if loading}
      <div class="d-flex justify-content-center p-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
    {:else if error}
      <div class="alert alert-danger" role="alert">{error}</div>
    {:else if recipe}
      <div class="card shadow-sm detail-card">
        <div class="card-body">
          <div class="d-flex flex-column flex-lg-row gap-4">
            <div class="flex-shrink-0">
              <img
                src={recipe.imageMain}
                alt={recipe.name}
                class="img-main rounded"
                on:error={handleImageError}
              />
              <p class="m-0 p-0"><a class="back-link d-inline-block mt-2" href="/storage">← 목록으로</a></p>
            </div>
            <div class="flex-grow-1 min-w-0">
              <h2 class="mb-2">{recipe.name}</h2>
              <div class="mb-3 d-flex flex-wrap gap-2">
                {#if recipe.category}
                  <span class="badge rounded-pill bg-secondary">{recipe.category}</span>
                {/if}
                {#if recipe.way}
                  <span class="badge rounded-pill bg-info">{recipe.way}</span>
                {/if}
                {#if recipe.hashtag}
                  <span class="badge rounded-pill bg-dark">#{recipe.hashtag}</span>
                {/if}
              </div>
              <div class="row g-2 small">
                <div class="col-6 col-md-4">
                  <div class="stat"><strong>중량</strong> {recipe.weight}</div>
                </div>
                <div class="col-6 col-md-4">
                  <div class="stat"><strong>열량</strong> {recipe.kcal} kcal</div>
                </div>
                <div class="col-6 col-md-4">
                  <div class="stat"><strong>탄수화물</strong> {recipe.carb} g</div>
                </div>
                <div class="col-6 col-md-4">
                  <div class="stat"><strong>단백질</strong> {recipe.protein} g</div>
                </div>
                <div class="col-6 col-md-4">
                  <div class="stat"><strong>지방</strong> {recipe.fat} g</div>
                </div>
                <div class="col-6 col-md-4">
                  <div class="stat"><strong>나트륨</strong> {recipe.sodium} mg</div>
                </div>
              </div>
            </div>
          </div>

          <hr class="my-4"/>

          <section class="mb-4">
            <h4 class="mb-2">재료 정보</h4>
            <pre class="parts">{recipe.parts}</pre>
          </section>

          <section>
            <h4 class="mb-3">만드는 법</h4>
            {#if recipe.steps.length > 0}
              <ol class="steps list-unstyled">
                {#each recipe.steps as s, i}
                  <li class="step-item">
                    <div class="d-flex gap-3 align-items-start">
                      {#if s.img}
                        <img src={s.img} alt={"step " + (i + 1)} class="img-step rounded" on:error={handleImageError}/>
                      {/if}
                      <div class="flex-grow-1">
                        <div class="step-title">Step {i + 1}</div>
                        <div class="step-text">{s.text}</div>
                      </div>
                    </div>
                  </li>
                {/each}
              </ol>
            {:else}
              <div class="text-muted small">제공된 만드는 법 정보가 없습니다.</div>
            {/if}
          </section>

          {#if recipe.tip}
            <hr class="my-4"/>
            <section>
              <h5 class="mb-2">저감 조리법 TIP</h5>
              <p class="mb-0">{recipe.tip}</p>
            </section>
          {/if}
        </div>
      </div>
    {/if}
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
  .detail-card {
    background: rgba(255, 255, 255, .9);
    backdrop-filter: blur(6px);
  }
  .img-main {
    width: 320px;
    max-width: 100%;
    height: 220px;
    object-fit: cover;
  }

  /* 회색 밑줄의 연한 비강조 스타일 */
  .back-link {
    color: #6c757d;               /* muted gray */
    text-decoration: underline;
    text-decoration-color: #ced4da; /* light gray underline */
    text-underline-offset: 2px;
    font-size: .875rem;           /* subtle */
  }
  .back-link:hover {
    color: #495057;               /* a bit darker on hover */
    text-decoration-color: #adb5bd;
  }
  .img-step {
    width: 120px;
    height: 90px;
    object-fit: cover;
  }
  .parts {
    white-space: pre-wrap;
    background: #f8f9fa;
    padding: .75rem;
    border-radius: .5rem;
    border: 1px solid #eee;
  }
  .steps .step-item + .step-item {
    margin-top: .75rem;
    padding-top: .75rem;
    border-top: 1px dashed #e0e0e0;
  }
  .step-title {
    font-weight: 600;
    margin-bottom: .25rem;
  }
  .stat {
    background: #f8f9fa;
    border: 1px solid #eee;
    border-radius: .375rem;
    padding: .25rem .5rem;
  }
</style>