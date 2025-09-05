// src/lib/utils/masonry.ts
import imagesLoaded from "imagesloaded";

export type MasonryHandle = {
  msnry: any;
  ro: ResizeObserver;
  update: () => void;
  destroy: () => void;
};

export async function initMasonry(
  targetEl: HTMLElement | null
): Promise<MasonryHandle> {
  // 안전 가드: DOM 바인딩 타이밍 문제로 null이 전달될 수 있음
  if (!targetEl) {
    console.warn("Bad element for masonry: null");
    const dummyRO = new ResizeObserver(() => {});
    return {
      msnry: null,
      ro: dummyRO,
      update: () => {},
      destroy() {
        try {
          dummyRO.disconnect();
        } catch {}
      }
    };
  }

  const MasonryModule = await import("masonry-layout");
  const Masonry = MasonryModule.default;

  const msnry = new Masonry(targetEl, {
    itemSelector: ".grid-item",
    columnWidth: ".grid-sizer",
    percentPosition: true,
    gutter: 16,
    transitionDuration: 0,
    initLayout: false,
    horizontalOrder: true
  });

  const raf = (cb: () => void, delay = 0) =>
    requestAnimationFrame(() => setTimeout(cb, delay));

  // 안전한 레이아웃: 다음 페인트 타이밍에 수행
  const update = () => {
    raf(() => {
      try {
        msnry?.reloadItems?.();
        msnry?.layout?.();
      } catch {}
    });
  };

  // 초기 이미지/폰트 로딩 흐름
  const img = imagesLoaded(targetEl as any);
  img.on("progress", () => raf(update));
  img.on("always", async () => {
    try {
      await (document as any).fonts?.ready;
    } catch {}
    raf(update);
    raf(update, 50);
  });

  // 크기 변동 대응
  const ro = new ResizeObserver(() => raf(update));
  const observeAll = () =>
    targetEl.querySelectorAll(".grid-item").forEach((el) => ro.observe(el));
  observeAll();

  // 컨테이너 크기 변화 대응 (탭 전환/브레이크포인트/폰트 적용 등)
  const roContainer = new ResizeObserver(() => raf(update));
  roContainer.observe(targetEl);

  // 자식 추가/변경 대응 (새 아이템/이미지 추가 시도 포함)
  const mo = new MutationObserver(() => {
    observeAll();
    raf(update);
  });
  mo.observe(targetEl, { childList: true, subtree: true });

  // 윈도우 리사이즈 대응
  const onResize = () => raf(update);
  window.addEventListener("resize", onResize);

  // 초기 한 번 강제 레이아웃(이미지 없는 카드 대비)
  raf(update);

  return {
    msnry,
    ro,
    update,
    destroy() {
      window.removeEventListener("resize", onResize);
      mo.disconnect();
      ro.disconnect();
      roContainer.disconnect();
      try {
        msnry?.destroy?.();
      } catch {}
    },
  };
}
