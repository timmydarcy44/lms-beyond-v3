"use client";

import { useEffect, useRef } from "react";

/**
 * Composant qui traite le texte pour mettre en évidence les lettres confusantes
 * et souligner les sons complexes dans le mode dyslexie
 */
export function DyslexiaTextProcessor({ enabled }: { enabled: boolean }) {
  const processedRef = useRef<Set<HTMLElement>>(new Set());

  useEffect(() => {
    if (!enabled) {
      // Nettoyer les marqueurs si le mode est désactivé
      processedRef.current.forEach((el) => {
        el.querySelectorAll(".dyslexia-letter-marker").forEach((marker) => {
          marker.remove();
        });
        el.querySelectorAll(".dyslexia-sound-marker").forEach((marker) => {
          marker.remove();
        });
      });
      processedRef.current.clear();
      return;
    }

    const processText = (element: HTMLElement) => {
      if (processedRef.current.has(element)) return;
      processedRef.current.add(element);

      // Lettres confusantes à mettre en évidence
      const confusingLetters = /([bdpqmnu])/gi;

      // Sons complexes à souligner
      const complexSounds = /(ch|ph|th|ou|au|eau|oi|ai|ei|eu|an|en|in|on|un|gn|ill)/gi;

      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null
      );

      const textNodes: Text[] = [];
      let node;
      while ((node = walker.nextNode())) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
          textNodes.push(node as Text);
        }
      }

      textNodes.forEach((textNode) => {
        const parent = textNode.parentElement;
        if (!parent || parent.classList.contains("dyslexia-processed")) return;

        let html = textNode.textContent || "";

        // Mettre en évidence les lettres confusantes
        html = html.replace(confusingLetters, (match) => {
          return `<span class="dyslexia-letter-marker" data-letter="${match}">${match}</span>`;
        });

        // Souligner les sons complexes
        html = html.replace(complexSounds, (match) => {
          return `<span class="dyslexia-sound-marker" data-sound="${match}">${match}</span>`;
        });

        if (html !== textNode.textContent) {
          const wrapper = document.createElement("span");
          wrapper.innerHTML = html;
          wrapper.classList.add("dyslexia-processed");
          parent.replaceChild(wrapper, textNode);
        }
      });
    };

    // Traiter tous les éléments de contenu
    const contentElements = document.querySelectorAll(
      ".dyslexia-mode p, .dyslexia-mode div, .dyslexia-mode span, .dyslexia-mode li, .dyslexia-mode td, .dyslexia-mode h1, .dyslexia-mode h2, .dyslexia-mode h3, .dyslexia-mode h4, .dyslexia-mode h5, .dyslexia-mode h6"
    );

    contentElements.forEach((el) => {
      if (el instanceof HTMLElement) {
        processText(el);
      }
    });

    // Observer les nouveaux éléments ajoutés
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            if (node.classList.contains("dyslexia-mode") || node.closest(".dyslexia-mode")) {
              processText(node);
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [enabled]);

  return null;
}


