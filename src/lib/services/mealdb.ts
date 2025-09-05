import type { MatchedRecipe } from "$lib/types/recipe";

type MealSummary = {
  idMeal: string;
  strMeal: string;
  strMealThumb: string | null;
};

type MealDetail = {
  idMeal: string;
  strMeal: string;
  strMealThumb: string | null;
  strSource?: string | null;
  strYoutube?: string | null;
  [key: string]: any;
};

function normalize(s: string) {
  return (s || "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/\[.*?\]/g, "")
    .replace(/●.*?:/g, "")
    .replace(/[^가-힣a-z0-9]/g, "")
    .trim();
}

function preferDisplay(cur: string, cand: string) {
  const hasSpaceCur = /\s/.test(cur);
  const hasSpaceCand = /\s/.test(cand);
  if (hasSpaceCur && !hasSpaceCand) return cur;
  if (!hasSpaceCur && hasSpaceCand) return cand;
  // 둘 다 공백 유무가 같다면 더 긴(정보량 많은) 것을 선택
  return cand.length > cur.length ? cand : cur;
}

function extractIngredients(meal: MealDetail): string[] {
  const parts: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const ing = (meal as any)[`strIngredient${i}`] as string | null | undefined;
    const cleaned = (ing || "").trim();
    if (!cleaned) continue;
    parts.push(cleaned);
  }
  // 정규화 키로 유니크 처리 + 표시문구는 공백 포함 표기 선호
  const normParts = parts.map((p) => normalize(p)).filter(Boolean);
  const indexByNorm = new Map<string, number>();
  const uniqueDisplay: string[] = [];
  const uniqueNorm: string[] = [];

  for (let i = 0; i < normParts.length; i++) {
    const n = normParts[i];
    const d = parts[i];
    if (!n) continue;
    if (!indexByNorm.has(n)) {
      indexByNorm.set(n, uniqueNorm.length);
      uniqueNorm.push(n);
      uniqueDisplay.push(d);
    } else {
      const idx = indexByNorm.get(n)!;
      uniqueDisplay[idx] = preferDisplay(uniqueDisplay[idx], d);
    }
  }
  return uniqueDisplay;
}

async function searchByFirstLetter(letter: string): Promise<MealSummary[]> {
  const url = `https://www.themealdb.com/api/json/v1/1/search.php?f=${encodeURIComponent(letter)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MealDB search HTTP ${res.status}`);
  const data = await res.json();
  const meals = (data?.meals ?? []) as any[];
  return meals.map((m) => ({
    idMeal: String(m.idMeal),
    strMeal: m.strMeal,
    strMealThumb: m.strMealThumb || null
  }));
}

async function lookupById(id: string): Promise<MealDetail | null> {
  const url = `https://www.themealdb.com/api/json/v1/1/lookup.php?i=${encodeURIComponent(id)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`MealDB lookup HTTP ${res.status}`);
  const data = await res.json();
  const meals = data?.meals as any[] | null;
  if (!meals || meals.length === 0) return null;
  return meals[0] as MealDetail;
}

async function collectSummariesAcrossLetters(start: string, target: number): Promise<MealSummary[]> {
  // 우선 시작 글자, 부족하면 a~z 순으로 채움
  const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");
  const ordered = [start.toLowerCase(), ...alphabet.filter((c) => c !== start.toLowerCase())];

  const seen = new Set<string>();
  const acc: MealSummary[] = [];

  for (const lt of ordered) {
    try {
      const list = await searchByFirstLetter(lt);
      for (const m of list) {
        if (!seen.has(m.idMeal)) {
          seen.add(m.idMeal);
          acc.push(m);
          if (acc.length >= target) return acc;
        }
      }
    } catch {
      // 다음 글자 계속
    }
  }
  return acc;
}

export async function fetchMealDbMatches({
  myNames,
  letter = "a",
  limit = 30
}: {
  myNames: string[];
  letter?: string;
  limit?: number;
}): Promise<MatchedRecipe[]> {
  // 내 재료 정규화
  const myNorms = myNames.map((s) => normalize(s)).filter(Boolean);

  // 여러 글자를 순회하며 필요한 개수만큼 요약 수집
  const desired = Math.max(20, limit); // 최소 20개 이상 시도
  const summaries = await collectSummariesAcrossLetters(letter, desired);
  if (!summaries.length) return [];

  // 상한 제한
  const pick = summaries.slice(0, Math.min(limit, summaries.length));

  // 상세 조회 병렬 진행 (과도한 동시성 방지)
  const concurrency = 5;
  const resultDetails: MealDetail[] = [];
  for (let i = 0; i < pick.length; i += concurrency) {
    const chunk = pick.slice(i, i + concurrency);
    const details = await Promise.all(
      chunk.map((m) => lookupById(m.idMeal).catch(() => null))
    );
    for (const d of details) {
      if (d) resultDetails.push(d);
    }
  }

  // 점수화하여 정렬: 보유 재료 많은 순 → 부족 재료 적은 순 → 느슨 매칭 많은 순 → 총 재료 수 적은 순
  type Scored = {
    mr: MatchedRecipe;
    looseScore: number;
    totalParts: number;
    haveLen: number;
    missingLen: number;
  };

  const palette = ["#ffb6c1", "#d2b48c", "#add8e6", "#90ee90", "#dda0dd"];

  const scored: Scored[] = resultDetails.map((meal) => {
    const parts = extractIngredients(meal);
    const normParts = parts.map((p) => normalize(p)).filter(Boolean);

    const have: string[] = [];
    const missing: string[] = [];
    let looseScore = 0;

    for (let i = 0; i < normParts.length; i++) {
      const nr = normParts[i];
      const strict = myNorms.includes(nr);
      const loose = !strict && myNorms.some((mn) => mn.length >= 2 && (nr.includes(mn) || mn.includes(nr)));
      if (strict || loose) {
        have.push(parts[i]);
        if (loose && !strict) looseScore++;
      } else {
        missing.push(parts[i]);
      }
    }

    const link =
      (meal.strSource && meal.strSource.trim()) ||
      (meal.strYoutube && meal.strYoutube.trim()) ||
      `https://www.themealdb.com/meal/${meal.idMeal}`;

    const mr: MatchedRecipe = {
      seq: String(meal.idMeal),
      name: meal.strMeal,
      link,
      image: meal.strMealThumb || "",
      have,
      missing,
      color: "#cccccc",
    };

    return {
      mr,
      looseScore,
      totalParts: parts.length,
      haveLen: have.length,
      missingLen: missing.length,
    };
  });

  // 정렬 기준 적용
  scored.sort(
    (a, b) =>
      b.haveLen - a.haveLen ||
      a.missingLen - b.missingLen ||
      b.looseScore - a.looseScore ||
      a.totalParts - b.totalParts
  );

  // 팔레트 색상 재부여 후 최종 결과 매핑
  const result: MatchedRecipe[] = scored.map((s, idx) => ({
    ...s.mr,
    color: palette[idx % palette.length],
  }));

  return result;
}