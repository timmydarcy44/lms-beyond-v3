import "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    resizableImage: {
      setResizableImage: (options: Record<string, unknown>) => ReturnType;
    };
  }
}
