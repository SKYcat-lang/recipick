import { v4 as uuidv4 } from 'uuid';

// --- Helper Types ---

export type StepLevel = 'full' | 'high' | 'half' | 'low' | 'empty';
export type Unit = 'g' | 'kg' | 'ml' | 'l';

// --- Discriminated Union for Amount ---

interface AmountCount {
  type: 'count';
  value: number;
}
interface AmountStep {
  type: 'step';
  level: StepLevel;
}
interface AmountExact {
  type: 'exact';
  value: number;
  unit: Unit;
}
interface AmountFree {
  type: 'free';
}
export type Amount = AmountCount | AmountStep | AmountExact | AmountFree;

// --- Data Structure Interfaces/Classes ---

export interface ProductInfo {
  /*
  * 아이템에 사용되는 식재료 정보 클래스
  * productId: 내부 구분자
  * name: 식재료의 이름
  * category: 식재료 카테고리
  * purchaseDate: 등록일
  * source: 상품이 어디서 생성됐는지barcode: 바코드, database: DB, api: api, custom: 사용자 생성
  */
  productId: string;
  name: string;
  category: string;
  image?: string;

  // 별칭/서브 이름들 (예: "파스타", "pasta", "spaghetti")
  aliases?: string[];
  
  // 새로 추가된 속성
  source: 'barcode' | 'database' | 'api' | 'custom'; // 이 상품 정보가 어디서 왔는지
}

export class InventoryItem {
  /*
  * 냉장고에 사용되는 아이템 클래스
  * id: 내부 구분자
  * product: 식재료 정보 클래스 (ProductInfo)
  * amount: 수량 (X개, Xkg, 많음 등 하이브리드 대응)
  * purchaseDate: 등록일
  * expirationDate: 만료일 (유통기한)
  * memo: 식품 메모
  */
  readonly id: string;
  product: ProductInfo;
  amount: Amount;
  purchaseDate: Date;
  expirationDate?: Date;
  memo: string;
  memouse: boolean | false | undefined;
  public image_override?: string;

  constructor(
    product: ProductInfo,
    amount: Amount,
    purchaseDate: Date,
    memo: string = '',
    expirationDate?: Date,
    image_override?: string
  ) {
    this.id = uuidv4();
    this.product = product;
    this.amount = amount;
    this.purchaseDate = purchaseDate;
    this.memo = memo;
    this.expirationDate = expirationDate;
    this.image_override = image_override;
  }

  // 현재 남은 양을 문자열로 변환해주는 메소드
  getDisplayAmount(): string {
    switch (this.amount.type) {
      case 'count':
        return `${this.amount.value}개`;
      case 'step': {
        const labels: { [key in StepLevel]: string } = {
          full: '가득 참',
          high: '넉넉함',
          half: '절반 정도',
          low: '거의 없음',
          empty: '없음'
        };
        return labels[this.amount.level];
      }
      case 'exact':
        return `${this.amount.value}${this.amount.unit}`;
      case 'free':
        return '수량 무관';
    }
  }
  
  get displayImage(): string | undefined {
    // 커스텀 이미지가 있으면 그것을, 없으면 제품의 기본 이미지를 반환
    return this.image_override || this.product.image;
  }
}