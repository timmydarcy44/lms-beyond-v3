"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Bold, Italic, List, ListOrdered, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type BadgeCriteriaEditorProps = {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function BadgeCriteriaEditor({ content, onChange, placeholder, className, disabled }: BadgeCriteriaEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-indigo-600 underline" } }),
    ],
    content: content || "<p></p>",
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm max-w-none min-h-[140px] px-3 py-2 focus:outline-none text-black",
          "[&_p]:my-1 [&_li]:my-0.5",
        ),
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  if (!editor) {
    return <div className={cn("min-h-[160px] animate-pulse rounded-xl border border-slate-200 bg-slate-50", className)} />;
  }

  const setLink = () => {
    const prev = typeof window !== "undefined" ? window.prompt("URL du lien") : null;
    if (prev === null) return;
    if (prev === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: prev }).run();
  };

  return (
    <div className={cn("overflow-hidden rounded-xl border-2 border-slate-300 bg-white", className)}>
      <div className="flex flex-wrap gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          aria-pressed={editor.isActive("bold")}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          aria-pressed={editor.isActive("italic")}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={setLink} disabled={disabled}>
          <LinkIcon className="h-4 w-4" />
        </Button>
      </div>
      <EditorContent editor={editor} data-placeholder={placeholder} />
    </div>
  );
}
