import { useEffect } from "react";
import { useTheme } from "next-themes";

function stripAccents(text: string): string {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeTextNodes(root: Node): void {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    const normalized = stripAccents(node.textContent ?? "");
    if (normalized !== node.textContent) {
      node.textContent = normalized;
    }
  }
}

/**
 * When the doom theme is active, strips accents from all visible text
 * so the AmazDoom font (ASCII-only) can render everything.
 */
export function useDoomTextNormalizer(): void {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (resolvedTheme !== "doom") return;

    // Initial pass
    normalizeTextNodes(document.body);

    // Observe future DOM changes
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (const node of mutation.addedNodes) {
            normalizeTextNodes(node);
          }
        } else if (mutation.type === "characterData" && mutation.target.textContent) {
          const normalized = stripAccents(mutation.target.textContent);
          if (normalized !== mutation.target.textContent) {
            // Temporarily disconnect to avoid infinite loop
            observer.disconnect();
            mutation.target.textContent = normalized;
            observer.observe(document.body, {
              characterData: true,
              childList: true,
              subtree: true,
            });
          }
        }
      }
    });

    observer.observe(document.body, {
      characterData: true,
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [resolvedTheme]);
}
