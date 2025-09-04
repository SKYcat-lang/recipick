export const allowedKeywords = [
  "디저트",
  "샐러드",
  "고기",
  "해산물",
  "국/탕",
  "면요리",
  "채식",
  "한식",
  "양식",
  "중식",
  "일식",
  "동남아",
  "퓨전",
] as const;
export type Keyword = (typeof allowedKeywords)[number];

export type AiRecipeJSON = {
  이름: string;
  재료: { 보유재료: string[]; 추가추천재료?: string[] };
  레시피: string[];
  키워드: Keyword[]; // 1~3개
};

export type MatchedRecipe = {
  seq: string;
  name: string;
  link: string;
  image: string;
  have: string[];
  missing: string[];
  color?: string;
};
