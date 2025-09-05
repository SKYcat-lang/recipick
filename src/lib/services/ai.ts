import type { AiRecipeJSON } from "$lib/types/recipe";
import { allowedKeywords } from "$lib/types/recipe";

function buildPrompt(myIngredientsList: string, userLine: string, modifiers?: string) {
  const extra = (modifiers && modifiers.trim())
    ? `

# 선호/조건
${modifiers.trim()}`
    : "";

  return `# 출력 규칙 (매우 중요)
- 오직 JSON 하나만 반환하세요. 마크다운, 코드펜스, 설명, 주석 금지.
- JSON의 최상위 키는 정확히 다음 4개만 허용됩니다: "이름", "재료", "레시피", "키워드".
- 각 필드의 형식:
  - "이름": string
  - "재료": object
      - "보유재료": string[]  // 반드시 ${myIngredientsList} 에서 파생
      - "추가추천재료": string[] // 선택
  - "레시피": string[] // 단계별 조리 설명
  - "키워드": string[] // 아래 후보에서 1~3개 (정확 일치, 공백 없음)
- "키워드" 후보: ["디저트","샐러드","고기","해산물","국/탕","면요리","채식","한식","양식","중식","일식","동남아","퓨전"]
- 위 형식을 위반하거나 다른 텍스트를 포함하면 응답은 무효입니다.

# 사용자 요청
${userLine}${extra}

# 반환 예시:
{
  "이름": "예시 이름",
  "재료": {
    "보유재료": ["..."],
    "추가추천재료": ["..."]
  },
  "레시피": ["1단계 ...", "2단계 ..."],
  "키워드": ["한식","채식"]
}`.trim();
}

export async function getAiRecipeJSON({
  genAI,
  ingredientsList,
  mode,
  desiredInput,
  modifiers,
}: {
  genAI: any;
  ingredientsList: string;
  mode: "current" | "desired";
  desiredInput?: string;
  modifiers?: string;
}): Promise<AiRecipeJSON> {
  const userLine =
    mode === "current"
      ? `현재 가지고 있는 재료는 ${ingredientsList} 입니다. 이 재료들을 활용해 새로운 레시피를 창작해주세요.`
      : `"${desiredInput}" 컨셉의 레시피를 창작해주세요. 현재 가진 재료는 ${ingredientsList} 입니다.`;

  const prompt = buildPrompt(ingredientsList, userLine, modifiers);

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: "application/json" },
  });

  const raw = result.response.text();
  return parseAiJsonStrict(raw);
}

export function parseAiJsonStrict(text: string): AiRecipeJSON {
  let payload = text.trim();
  if (payload.startsWith("```")) {
    payload = payload
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```$/i, "")
      .trim();
  }
  if (!(payload.startsWith("{") && payload.endsWith("}"))) {
    const s = payload.indexOf("{");
    const e = payload.lastIndexOf("}");
    if (s !== -1 && e !== -1 && e > s) payload = payload.slice(s, e + 1);
  }
  const obj = JSON.parse(payload);
  for (const k of ["이름", "재료", "레시피", "키워드"]) {
    if (!(k in obj)) throw new Error(`필드 누락: ${k}`);
  }
  if (!obj || typeof obj.이름 !== "string")
    throw new Error("이름은 string이어야 합니다.");
  if (!obj.재료 || !Array.isArray(obj.재료.보유재료))
    throw new Error("재료.보유재료는 string[]이어야 합니다.");
  if (obj.재료.추가추천재료 && !Array.isArray(obj.재료.추가추천재료))
    throw new Error("재료.추가추천재료는 string[]이어야 합니다.");
  if (!Array.isArray(obj.레시피))
    throw new Error("레시피는 string[]이어야 합니다.");
  if (!Array.isArray(obj.키워드))
    throw new Error("키워드는 string[]이어야 합니다.");
  if (obj.키워드.length < 1 || obj.키워드.length > 3)
    throw new Error("키워드는 1~3개여야 합니다.");

  const set = new Set(allowedKeywords);
  for (const kw of obj.키워드) {
    if (!set.has(kw)) throw new Error(`허용되지 않은 키워드: ${kw}`);
  }
  return obj as AiRecipeJSON;
}

export function toMarkdown(r: AiRecipeJSON) {
  const own = (r.재료.보유재료 ?? []).join(", ");
  const add = (r.재료.추가추천재료 ?? []).join(", ") || "-";
  const steps = (r.레시피 ?? []).join("\n\n");
  const kw = (r.키워드 ?? []).join(", ");
  return `## ${r.이름}

**필요 재료**
- 보유 재료: ${own}
- 추가 추천 재료: ${add}

**조리법**
${steps}

${kw}`.trim();
}
