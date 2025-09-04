export type ProductInfo = {
  productId: string;
  name: string;
  category: string;
  source: "database" | "barcode";
  image?: string;
};

export const SYSTEM_PRODUCTS: ProductInfo[] = [
  { productId: "P001", name: "계란", category: "계란/유제품", source: "database", image: "/ingredients/계란.png" },
  { productId: "P002", name: "닭고기", category: "육류", source: "database", image: "/ingredients/닭.png" },
  { productId: "P004", name: "사과", category: "과일", source: "database", image: "/ingredients/사과.png" },
  { productId: "P005", name: "대파", category: "채소", source: "database", image: "/ingredients/대파.png" },
  { productId: "P006", name: "고추", category: "채소", source: "database", image: "/ingredients/고추.png" },
  { productId: "P007", name: "당근", category: "채소", source: "database", image: "/ingredients/당근.png" },
  { productId: "P008", name: "감자", category: "채소", source: "database", image: "/ingredients/감자.png" },
  { productId: "P009", name: "애호박", category: "채소", source: "database", image: "/ingredients/애호박.png" },
  { productId: "P010", name: "두부", category: "두부/콩 가공품", source: "database", image: "/ingredients/두부.png" },
  { productId: "P011", name: "된장", category: "소스/장류", source: "database", image: "/ingredients/된장.png" },
  { productId: "P013", name: "스파게티 면", category: "면류/파스타", source: "database", image: "/ingredients/파스타.png" },
];

export const USER_CUSTOM_PRODUCTS: ProductInfo[] = [
  { productId: "USER001", name: "찌개용 돼지고기 (500g)", category: "육류", source: "barcode" },
  { productId: "USER002", name: "또띠아(10개입)", category: "면류/파스타", source: "barcode" },
];

export function findProductInfo(productId: string): ProductInfo | undefined {
  return SYSTEM_PRODUCTS.find((p) => p.productId === productId) ||
         USER_CUSTOM_PRODUCTS.find((p) => p.productId === productId);
}