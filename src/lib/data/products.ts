import { writable, get } from "svelte/store";

export type ProductInfo = {
  productId: string;
  name: string;
  category: string;
  source: "database" | "barcode";
  image?: string;
  aliases?: string[];
};

export const SYSTEM_PRODUCTS: ProductInfo[] = [
  {
    productId: "P001",
    name: "계란",
    category: "계란/유제품",
    source: "database",
    image: "/ingredients/계란.png",
    aliases: ["달걀", "egg", "eggs"],
  },
  {
    productId: "P002",
    name: "닭고기",
    category: "육류",
    source: "database",
    image: "/ingredients/닭.png",
    aliases: ["닭", "chicken"],
  },
  {
    productId: "P004",
    name: "사과",
    category: "과일",
    source: "database",
    image: "/ingredients/사과.png",
    aliases: ["apple", "apples"],
  },
  {
    productId: "P005",
    name: "대파",
    category: "채소",
    source: "database",
    image: "/ingredients/대파.png",
    aliases: ["파", "green onion", "scallion", "spring onion"],
  },
  {
    productId: "P006",
    name: "고추",
    category: "채소",
    source: "database",
    image: "/ingredients/고추.png",
    aliases: ["chili", "chili pepper", "red pepper"],
  },
  {
    productId: "P007",
    name: "당근",
    category: "채소",
    source: "database",
    image: "/ingredients/당근.png",
    aliases: ["carrot", "carrots"],
  },
  {
    productId: "P008",
    name: "감자",
    category: "채소",
    source: "database",
    image: "/ingredients/감자.png",
    aliases: ["potato", "potatoes"],
  },
  {
    productId: "P009",
    name: "애호박",
    category: "채소",
    source: "database",
    image: "/ingredients/애호박.png",
    aliases: ["zucchini", "korean zucchini", "courgette"],
  },
  {
    productId: "P010",
    name: "두부",
    category: "두부/콩 가공품",
    source: "database",
    image: "/ingredients/두부.png",
    aliases: ["tofu", "bean curd"],
  },
  {
    productId: "P011",
    name: "된장",
    category: "소스/장류",
    source: "database",
    image: "/ingredients/된장.png",
    aliases: [
      "doenjang",
      "soybean paste",
      "fermented soybean paste",
      "korean soybean paste",
    ],
  },
  {
    productId: "P013",
    name: "스파게티 면",
    category: "면류/파스타",
    source: "database",
    image: "/ingredients/파스타.png",
    aliases: ["파스타", "pasta", "spaghetti"],
  },
];

export const USER_CUSTOM_PRODUCTS: ProductInfo[] = [
  {
    productId: "USER001",
    name: "찌개용 돼지고기 (500g)",
    category: "육류",
    source: "barcode",
    aliases: ["돼지고기", "pork", "stew pork"],
  },
  {
    productId: "USER002",
    name: "또띠아(10개입)",
    category: "면류/파스타",
    source: "barcode",
    aliases: ["또띠아", "tortilla", "tortillas", "wrap"],
  },
];

export function findProductInfo(productId: string): ProductInfo | undefined {
  return (
    SYSTEM_PRODUCTS.find((p) => p.productId === productId) ||
    USER_CUSTOM_PRODUCTS.find((p) => p.productId === productId)
  );
}

// 사용자 정의 상품 배열에 대한 Svelte 스토어(리스트 변화에 UI가 반응)
export const userCustomProducts = writable<ProductInfo[]>([...USER_CUSTOM_PRODUCTS]);

// USER 커스텀 상품 ID 생성기
export function generateUserProductId(): string {
  try {
    const list = get(userCustomProducts);
    const ids = [...list, ...USER_CUSTOM_PRODUCTS].map((p) => p.productId);
    const nums = ids
      .map((id) => {
        const m = id?.match(/^USER(\d+)$/);
        return m ? parseInt(m[1], 10) : NaN;
      })
      .filter((n) => !Number.isNaN(n));
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    return `USER${String(next).padStart(3, "0")}`;
  } catch {
    return `USER${Date.now()}`;
  }
}

// 사용자 정의 상품 추가 (스토어 업데이트 + 기존 배열 유지)
export function addUserCustomProduct(input: {
  name: string;
  category: string;
  image?: string;
  aliases?: string[];
}): ProductInfo {
  const newProduct: ProductInfo = {
    productId: generateUserProductId(),
    name: (input.name || "").trim(),
    category: (input.category || "").trim(),
    source: "barcode",
    image: input.image?.trim() || undefined,
    aliases: input.aliases?.map((a) => a.trim()).filter(Boolean),
  };
  // 레거시 배열도 유지(직접 참조하는 코드 대비)
  USER_CUSTOM_PRODUCTS.push(newProduct);
  // 스토어 업데이트(앞에 추가하여 쉽게 보이도록)
  userCustomProducts.update((list) => [newProduct, ...list]);
  return newProduct;
}
