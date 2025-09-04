import type { MatchedRecipe } from "$lib/types/recipe";

export async function fetchRecipeMatches({
  apiKey,
  myNames,
}: {
  apiKey: string;
  myNames: string[];
}) {
  const url = `https://openapi.foodsafetykorea.go.kr/api/${apiKey}/COOKRCP01/xml/1/100`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP 오류: ${response.status}`);
  const xmlText = await response.text();

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  const resultCode = xmlDoc.querySelector("CODE")?.textContent;
  if (resultCode !== "INFO-000") {
    const resultMsg = xmlDoc.querySelector("MSG")?.textContent;
    throw new Error(`API 오류: ${resultMsg} (코드: ${resultCode})`);
  }

  const rows = xmlDoc.querySelectorAll("row");
  const mySet = new Set(myNames.map((s) => s.trim()));

  const matched = Array.from(rows)
    .map((row) => {
      const name = row.querySelector("RCP_NM")?.textContent || "";
      const seq = row.querySelector("RCP_SEQ")?.textContent || "";
      const image = row.querySelector("ATT_FILE_NO_MK")?.textContent || "";
      const ingredientsText =
        row.querySelector("RCP_PARTS_DTLS")?.textContent || "";

      const recipeIngredients = ingredientsText
        .replace(/\[.*?\]|●.*?:/g, ",")
        .split(",")
        .map((part) => part.trim().split(" ")[0].trim())
        .filter((ingName) => ingName && ingName.length > 1);

      const unique = [...new Set(recipeIngredients)];
      const have: string[] = [];
      const missing: string[] = [];
      unique.forEach((ri) =>
        mySet.has(ri) ? have.push(ri) : missing.push(ri)
      );

      return { name, seq, image, have, missing };
    })
    .filter((r) => r.have.length > 0)
    .sort(
      (a, b) =>
        a.missing.length - b.missing.length || b.have.length - a.have.length
    )
    .slice(0, 5)
    .map((item, index) => ({
      seq: item.seq,
      name: item.name,
      link: `https://www.10000recipe.com/recipe/${item.seq}`,
      image: item.image,
      have: item.have,
      missing: item.missing,
      color: ["#ffb6c1", "#d2b48c", "#add8e6", "#90ee90", "#dda0dd"][index % 5],
    })) as MatchedRecipe[];

  return matched;
}

// --- 데모 모드용 ---
export function demoProcess(myNames: string[]) {
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

  const processed = demoRecipes
    .map((r) => {
      const have: string[] = [];
      const missing: string[] = [];
      r.ingredients.forEach((ing) => {
        const isMatch = myNames.some(
          (my) => my.includes(ing) || ing.includes(my)
        );
        isMatch ? have.push(ing) : missing.push(ing);
      });
      return { ...r, have, missing };
    })
    .filter((r) => r.have.length > 0)
    .sort(
      (a, b) =>
        a.missing.length - b.missing.length || b.have.length - a.have.length
    )
    .slice(0, 5)
    .map((item, index) => ({
      seq: item.seq,
      name: item.name,
      link: `https://www.10000recipe.com/recipe/${item.seq}`,
      image: item.image,
      have: item.have,
      missing: item.missing,
      color: ["#ffb6c1", "#d2b48c", "#add8e6", "#90ee90", "#dda0dd"][index % 5],
    }));

  return processed as MatchedRecipe[];
}
