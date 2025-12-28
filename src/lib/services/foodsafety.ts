import type { MatchedRecipe } from "$lib/types/recipe";

export async function fetchRecipeMatches({
  apiKey,
  myNames,
}: {
  apiKey: string;
  myNames: string[];
}) {
  const url = `/api/foodsafety`;
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
  if (rows.length === 0) {
    throw new Error("OPEN-API 응답에 레시피가 없습니다");
  }
  // 정규화 함수: 괄호내용 제거, 공백/기호 제거, 소문자, NFKC
  const normalize = (s: string) =>
    (s || "")
      .normalize("NFKC")
      .toLowerCase()
      .replace(/\(.*?\)/g, "")
      .replace(/\[.*?\]/g, "")
      .replace(/●.*?:/g, "")
      .replace(/[^가-힣a-z0-9]/g, "")
      .trim();

  const myNorms = myNames.map((s) => normalize(s)).filter(Boolean);

  // 느슨한 매칭(포함 관계 허용, 길이 2 이상만 포함)
  const isLooseMatch = (a: string, b: string) => {
    const A = normalize(a);
    const B = normalize(b);
    if (!A || !B) return false;
    if (A === B) return true;
    const minLenOk = A.length >= 2 && B.length >= 2;
    return minLenOk && (A.includes(B) || B.includes(A));
  };

  // 1) 전체 아이템 구성 (+ 느슨한 점수 포함) — 안정적 매칭(정규화)로 have 계산
  const allItems = Array.from(rows).map((row) => {
    const name = row.querySelector("RCP_NM")?.textContent || "";
    const seq = row.querySelector("RCP_SEQ")?.textContent || "";
    const image =
      row.querySelector("ATT_FILE_NO_MK")?.textContent?.trim() ||
      row.querySelector("ATT_FILE_NO_MAIN")?.textContent?.trim() ||
      "";
    const ingredientsText =
      row.querySelector("RCP_PARTS_DTLS")?.textContent || "";

    // 재료 텍스트 파싱: 소괄호 내용은 먼저 전역 제거하고, 이후 구분자로 분리
    // 개행(\n)은 토큰 내부 공백으로 간주하여 쪼개지 않도록 먼저 공백으로 변환
    const cleaned = ingredientsText
      .replace(/\[.*?\]/g, " ")       // 대괄호 라벨 제거
      .replace(/●.*?:/g, " ")         // 블릿 라벨 제거
      .replace(/\(.*?\)/g, " ");      // 소괄호 내부 통째로 제거

    const noNewline = cleaned.replace(/\r?\n+/g, " ");
    const rawParts = noNewline.split(/,|\/|;|·|\u00b7/g); // 주요 구분자로 분리(개행 제외)
  
    // 풀네임 표시용:
    // - 공백 및 주변 구분 부호 정리
    // - "수량만 남은 토큰(숫자/분수 + 선택 단위)" 제거: (1/2개), 200g, 1컵 등
    const displayParts = rawParts
      .map((part) =>
        part
          .replace(/\s+/g, " ")
          .replace(/^[\s\-–·.,/]+|[\s\-–·.,/]+$/g, "")
          .trim()
      )
      .filter(
        (p) =>
          p.length >= 1 &&
          !/^\d+(?:\/\d+)?(?:\.\d+)?\s*(?:개|g|kg|mg|ml|l|컵|큰술|작은술|스푼|tsp|tbsp)?$/i.test(p)
      );

    // 매칭용 정규화 키
    const normParts = displayParts.map((p) => normalize(p));

    // 정규화 기준으로 유니크 집합 구성(첫 등장 우선, 단 '표시용'은 공백 포함 표기를 선호)
    const indexByNorm = new Map<string, number>();
    const uniqueDisplay: string[] = [];
    const uniqueNorm: string[] = [];

    const preferDisplay = (cur: string, cand: string) => {
      const hasSpaceCur = /\s/.test(cur);
      const hasSpaceCand = /\s/.test(cand);
      if (hasSpaceCur && !hasSpaceCand) return cur;
      if (!hasSpaceCur && hasSpaceCand) return cand;
      // 둘 다 공백 유무가 같다면 더 긴(정보량 많은) 것을 선택
      return cand.length > cur.length ? cand : cur;
    };

    for (let i = 0; i < normParts.length; i++) {
      const n = normParts[i];
      if (!n) continue;
      const d = displayParts[i];
      if (!indexByNorm.has(n)) {
        indexByNorm.set(n, uniqueNorm.length);
        uniqueNorm.push(n);
        uniqueDisplay.push(d);
      } else {
        const idx = indexByNorm.get(n)!;
        uniqueDisplay[idx] = preferDisplay(uniqueDisplay[idx], d);
      }
    }

    // have/missing 계산은 정규화 키 기준, 표시는 풀네임으로
    const have: string[] = [];
    const missing: string[] = [];
    for (let i = 0; i < uniqueNorm.length; i++) {
      const nr = uniqueNorm[i];
      const strict = myNorms.includes(nr);
      const loose =
        !strict &&
        myNorms.some((mn) => mn.length >= 2 && (nr.includes(mn) || mn.includes(nr)));
      if (strict || loose) {
        have.push(uniqueDisplay[i]);
      } else {
        missing.push(uniqueDisplay[i]);
      }
    }

    // 느슨 매칭으로만 매칭된 표시용 목록(엄격 매칭 제외)
    const looseMatches: string[] = [];
    for (let i = 0; i < uniqueNorm.length; i++) {
      const nr = uniqueNorm[i];
      if (
        !myNorms.includes(nr) &&
        myNorms.some((mn) => mn.length >= 2 && (nr.includes(mn) || mn.includes(nr)))
      ) {
        looseMatches.push(uniqueDisplay[i]);
      }
    }
    const looseScore = looseMatches.length;

    return { name, seq, image, have, missing, unique: uniqueDisplay, looseMatches, looseScore };
  });

  // 2) 정렬: 보유 재료 많은 순(내림차순) → 부족 재료 적은 순 → 느슨 점수 높은 순 → 재료 수 적은 순
  const ordered = [...allItems].sort(
    (a, b) =>
      b.have.length - a.have.length ||
      a.missing.length - b.missing.length ||
      b.looseScore - a.looseScore ||
      a.unique.length - b.unique.length
  );
  if (ordered.length === 0) {
    throw new Error("레시피 계산 결과가 비어 있습니다");
  }
  const result = ordered.map((item, index) => {
    return {
      seq: item.seq,
      name: item.name,
      link: `${item.seq}`,
      image: item.image,
      have: item.have,
      missing: item.missing,
      color: ["#ffb6c1", "#d2b48c", "#add8e6", "#90ee90", "#dda0dd"][index % 5],
    };
  }) as MatchedRecipe[];

  return result;
}

