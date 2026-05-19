import { Node, mergeAttributes } from "@tiptap/core";

type Variant = "definition" | "example";

const VARIANTS: Record<Variant, { className: string }> = {
  definition: {
    className:
      'bg-red-50 border-l-4 border-red-500 p-4 my-6 rounded-r-lg text-red-900',
  },
  example: {
    className:
      'bg-green-50 border-l-4 border-green-500 p-4 my-6 rounded-r-lg text-green-900',
  },
};

export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "block+",
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: "definition" as Variant,
        parseHTML: (element) => {
          const className = String(element.getAttribute("class") ?? "");
          if (className.includes("bg-green-50") || className.includes("border-green-500")) {
            return "example";
          }
          return "definition";
        },
        renderHTML: (attrs) => {
          const variant = (attrs.variant as Variant) in VARIANTS ? (attrs.variant as Variant) : "definition";
          return { class: VARIANTS[variant].className };
        },
      },
    };
  },

  parseHTML() {
    return [
      { tag: "div.bg-red-50" },
      { tag: "div.bg-green-50" },
      { tag: "div.border-red-500" },
      { tag: "div.border-green-500" },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["div", mergeAttributes(HTMLAttributes), 0];
  },
});

