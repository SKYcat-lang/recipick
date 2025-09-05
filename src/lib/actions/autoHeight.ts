// src/lib/actions/autoHeight.ts
export function autoHeight(node: HTMLTextAreaElement) {
  const update = () => {
    node.style.height = "auto";
    const border = 2;
    node.style.height = `${node.scrollHeight + border}px`;
    node.dispatchEvent(new CustomEvent("heightChange"));
  };

  node.addEventListener("input", update);
  Promise.resolve().then(update);

  return {
    destroy() {
      node.removeEventListener("input", update);
    }
  };
}
