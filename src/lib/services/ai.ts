import type { AiRecipeJSON } from "$lib/types/recipe";
import { allowedKeywords } from "$lib/types/recipe";

// 오류 발생시 자동 재시도 - X, 오류가 난걸 사용자에게 알릴 것.

// ===== Performance helpers: model reuse, caching, in-flight dedupe, timeout =====

const MODEL_NAME = "gemini-2.5-flash";
const DEFAULT_TIMEOUT_MS = 30000; // 30초 타임아웃

// genAI 인스턴스별 모델 재사용 (생성 비용/지연 감소)
const modelSingleton = new WeakMap<any, Map<string, any>>();
function getModel(genAI: any, name = MODEL_NAME) {
  let inner = modelSingleton.get(genAI);
  if (!inner) {
    inner = new Map();
    modelSingleton.set(genAI, inner);
  }
  if (!inner.has(name)) {
    inner.set(name, genAI.getGenerativeModel({ model: name }));
  }
  return inner.get(name);
}

function normalizeForKey(s?: string) {
  return (s ?? "").replace(/\s+/g, " ").trim();
}
function buildPrompt(
  myIngredientsList: string,
  userLine: string,
  modifiers?: string
) {
  const extra =
    modifiers && modifiers.trim()
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

 # 해석 지침
 - "보유재료"는 반드시 ${myIngredientsList} 문자열에서만 파생합니다. 제공된 재료 외의 텍스트로 유추하거나 확장하지 마세요.
 - 응답 길이는 600-800자 내외로 응답할 것.

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

function buildResponseSchema() {
  return {
    type: "object",
    properties: {
      이름: { type: "string" },
      재료: {
        type: "object",
        properties: {
          보유재료: { type: "array", items: { type: "string" } },
          추가추천재료: { type: "array", items: { type: "string" } },
        },
        required: ["보유재료"],
      },
      레시피: {
        type: "array",
        items: { type: "string" },
      },
      키워드: {
        type: "array",
        items: { type: "string", enum: allowedKeywords },
      },
    },
    required: ["이름", "재료", "레시피", "키워드"],
  };
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
  // 캐시/중복 억제 제거: 매 클릭마다 항상 새 요청을 수행
  const userLine =
    mode === "current"
      ? `현재 가지고 있는 재료는 ${ingredientsList} 입니다. 이 재료들을 활용해 새로운 레시피를 창작해주세요.`
      : `"${normalizeForKey(
          desiredInput
        )}" 컨셉의 레시피를 창작해주세요. 현재 가진 재료는 ${ingredientsList} 입니다.`;

  const prompt = buildPrompt(ingredientsList, userLine, modifiers);

  const model = getModel(genAI, MODEL_NAME);

  const generationConfig = {
    responseMimeType: "application/json",
    maxOutputTokens: 512,
    temperature: 1.0, // 창의성 조금 부여
    topK: 3, // 후보 확장
    topP: 0.9, // 확률 분산 약간 허용
    thinkingConfig: {
      thinkingBudget: 0, // ← 추론을 꺼버림
      includeThoughts: false,
    },
  };

  const systemInstruction = [
    "오직 JSON 하나만 반환하세요. 마크다운/설명/주석 금지.",
    '최상위 키는 "이름","재료","레시피","키워드"만 허용. 그 외 키 금지.',
    "추론 과정이나 중간 사고를 서술하지 말고 최종 JSON만 출력하세요.",
  ].join("\n");

  const task = model.generateContent({
    systemInstruction: {
      role: "system",
      parts: [{ text: systemInstruction }],
    },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      ...generationConfig,
      responseSchema: buildResponseSchema(),
    },
  });

  const timeoutMs = DEFAULT_TIMEOUT_MS;
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("timeout: AI 응답 지연")), timeoutMs)
  );

  const result = (await Promise.race([task, timeoutPromise])) as any;

  const raw = await extractRawResponse(result);
  if (!raw || !raw.trim()) throw new Error("empty ai response");

  const json = parseAiJsonStrict(raw);
  return json;
}

// Gemini 응답에서 텍스트/JSON을 견고하게 추출하기 위한 헬퍼
function decodeInlineDataBase64(b64: string): string {
  const clean = String(b64 || "").replace(/\s/g, "");
  if (!clean) return "";
  try {
    if (typeof atob === "function") {
      try {
        // UTF-8 안전 디코딩
        return decodeURIComponent(escape(atob(clean)));
      } catch {
        return atob(clean);
      }
    }
    // Node.js/SSR 환경 대비
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const B: any = (globalThis as any).Buffer;
    if (B) return B.from(clean, "base64").toString("utf-8");
    // Buffer가 없으면 디코딩 불가 환경
    throw new Error("inlineData 디코딩 환경 미지원");
  } catch (e) {
    // 디코딩 실패를 명시적으로 알림
    throw new Error("inlineData 디코딩 실패");
  }
}

// ===== Debug helpers: raw Gemini response logging for blocked/invalid cases =====
const __DEV__ = import.meta.env.DEV;

// Pretty-print but avoid circular and overlong values
function safeStringify(obj: any, max = 20000) {
  try {
    const cache = new WeakSet();
    const s = JSON.stringify(
      obj,
      (k, v) => {
        if (typeof v === "bigint") return String(v);
        if (typeof v === "function") return `[Function ${v.name || "anon"}]`;
        if (typeof v === "object" && v !== null) {
          if (cache.has(v)) return "[Circular]";
          cache.add(v);
        }
        return v;
      },
      2
    );
    return s.length > max ? s.slice(0, max) + "…(truncated)" : s;
  } catch {
    try {
      return String(obj);
    } catch {
      return "[unstringifiable]";
    }
  }
}

function summarizeResp(resp: any) {
  try {
    const candidates = resp?.candidates ?? [];
    return {
      modelVersion: resp?.modelVersion ?? resp?.model,
      promptFeedback: resp?.promptFeedback,
      usageMetadata: resp?.usageMetadata,
      candidates: candidates.map((c: any) => ({
        finishReason: c?.finishReason,
        safetyRatings: c?.safetyRatings,
        parts: (c?.content?.parts ?? []).map((p: any) => ({
          hasText: !!p?.text,
          textPreview:
            typeof p?.text === "string"
              ? String(p.text).slice(0, 160)
              : undefined,
          hasInlineJson: !!(p?.inlineData?.data || p?.inline_data?.data),
          mime: p?.inlineData?.mimeType || p?.inline_data?.mime_type,
        })),
      })),
    };
  } catch {
    return { note: "summarizeResp failed" };
  }
}

function debugLogRawResponse(resp: any, tag = "ai.raw") {
  if (!__DEV__) return;
  try {
    // Grouped logging to keep console tidy
    // eslint-disable-next-line no-console
    console.groupCollapsed(`[AI][RAW] ${tag}`);
    // eslint-disable-next-line no-console
    console.log("[AI][RAW] summary:", summarizeResp(resp));
    // eslint-disable-next-line no-console
    console.log("[AI][RAW] full:", resp);
    // eslint-disable-next-line no-console
    console.log("[AI][RAW] full(JSON):", safeStringify(resp));
    // eslint-disable-next-line no-console
    console.groupEnd();
  } catch {
    // ignore logging errors
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function extractRawResponse(result: any): Promise<string> {
  const resp = result?.response;
  if (!resp) return "";

  // 1) 표준 text() 우선 - 차단 예외를 별도 오류로 변환
  const maybeText = (resp as any).text;
  if (typeof maybeText === "function") {
    try {
      const t = maybeText.call(resp);
      if (typeof t === "string" && t.trim()) return t;
    } catch (e: any) {
      try {
        debugLogRawResponse(resp, "text() threw");
      } catch {}
      const block =
        e?.response?.promptFeedback?.blockReason ||
        e?.response?.candidates?.[0]?.finishReason;
      if (block) throw new Error(`응답 차단됨(${block})`);
      throw e;
    }
  } else if (typeof maybeText === "string" && maybeText.trim()) {
    return maybeText;
  }

  // 2) 후보 파트에서 text/inlineData(application/json) 추출
  const candidates = (resp as any).candidates ?? [];
  let sawFunctionCall = false;

  for (const c of candidates) {
    const parts = c?.content?.parts ?? [];
    for (const p of parts) {
      if (typeof p?.text === "string" && p.text.trim()) return p.text;

      const mime = p?.inlineData?.mimeType || p?.inline_data?.mime_type;
      const data = p?.inlineData?.data || p?.inline_data?.data;
      if (data && /json/i.test(String(mime || ""))) {
        try {
          const decoded = decodeInlineDataBase64(data);
          if (decoded.trim()) return decoded;
        } catch {
          try {
            debugLogRawResponse(resp, "inlineData decode fail");
          } catch {}
          // 디코딩 실패를 명시적 에러로 전달
          throw new Error("inlineData 디코딩 실패");
        }
      }

      if (p?.functionCall) {
        sawFunctionCall = true;
      }
    }
  }

  // functionCall-only 케이스 명시적 오류
  if (sawFunctionCall) {
    throw new Error("지원하지 않는 응답 형식(functionCall-only)");
  }

  // 3) 안전성 차단/종료 사유를 의미 있는 에러로 승격
  const block =
    (resp as any)?.promptFeedback?.blockReason || candidates?.[0]?.finishReason;
  if (block) {
    try {
      debugLogRawResponse(resp, `blocked:${block}`);
    } catch {}
    throw new Error(`응답 차단됨(${block})`);
  }

  return "";
}

export function parseAiJsonStrict(text: string): AiRecipeJSON {
  // 1) 기본 정리
  let payload = String(text ?? "").trim();

  // 코드펜스 제거
  if (payload.startsWith("```")) {
    payload = payload
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```$/i, "")
      .trim();
  }

  // 선행 BOM 제거
  payload = payload.replace(/^\uFEFF/, "");

  // 가능한 JSON 본문 추출: 첫 여는 중괄호부터
  const s = payload.indexOf("{");
  if (s !== -1) {
    const e = payload.lastIndexOf("}");
    if (e !== -1 && e > s) {
      payload = payload.slice(s, e + 1);
    } else {
      payload = payload.slice(s);
    }
  }

  // 2) 파싱 함수
  const tryParse = (str: string) => JSON.parse(str);

  // 3) 수리 함수: 흔한 오류(끝부분 잘림/트레일링 콤마/닫힘 괄호 부족) 자동 보정
  function repairJson(str: string): string {
    let out = String(str ?? "");

    // 트레일링 콤마 제거: } 또는 ] 앞의 콤마
    out = out.replace(/,\s*(?=[}\]])/g, "");

    // 마지막 닫힘 괄호 이후의 찌꺼기 제거
    const lastObj = out.lastIndexOf("}");
    const lastArr = out.lastIndexOf("]");
    const lastCloser = Math.max(lastObj, lastArr);
    if (lastCloser !== -1) {
      out = out.slice(0, lastCloser + 1);
    }

    // 괄호 균형 맞추기
    const count = (s: string, re: RegExp) => (s.match(re) || []).length;
    const openObj = count(out, /{/g);
    const closeObj = count(out, /}/g);
    const openArr = count(out, /\[/g);
    const closeArr = count(out, /]/g);

    if (closeArr < openArr) out += "]".repeat(openArr - closeArr);
    if (closeObj < openObj) out += "}".repeat(openObj - closeObj);

    return out;
  }

  let obj: any;
  try {
    obj = tryParse(payload);
  } catch (e1) {
    // 1차 실패 → 수리 후 재시도
    const fixed = repairJson(payload);
    try {
      obj = tryParse(fixed);
    } catch (e2) {
      // 그대로 실패 → 상위에서 재시도 로직(재생성) 수행
      throw e2;
    }
  }

  // 4) 스키마 검증
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
