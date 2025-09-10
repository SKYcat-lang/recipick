// Ambient type declarations for third-party libs without types
declare module "imagesloaded" {
  const imagesLoaded: any;
  export default imagesLoaded;
}
declare module "masonry-layout" {
  const Masonry: any;
  export default Masonry;
}
declare module "bootstrap/dist/js/bootstrap.bundle";
// Svelte 커스텀 이벤트 타입 보강
declare namespace svelteHTML {
  interface HTMLAttributes<T> {
    // autoHeight 액션이 디스패치하는 커스텀 이벤트
    'on:heightChange'?: (event: CustomEvent<number>) => void;
  }
}