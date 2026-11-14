"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { useEffect } from "react";
import { HANDICAP_THEME as T } from "@/lib/handicap/theme";
import { cn } from "@/lib/utils";

export function HandicapPlanEditor({
  content,
  onChange,
  disabled,
}: {
  content: string;
  onChange: (html: string) => void;
  disabled?: boolean;
}) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] } })],
    content: content || "<p></p>",
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "min-h-[180px] px-3 py-2 text-[14px] leading-relaxed focus:outline-none",
          "[&_p]:my-1.5 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
          "[&_strong]:font-extrabold [&_h2]:text-[18px] [&_h2]:font-extrabold [&_h3]:text-[15px] [&_h3]:font-bold",
        ),
        style: `color:${T.text}`,
      },
    },
    onUpdate: ({ editor: ed }) => onChange(ed.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = content || "<p></p>";
    if (current !== next) editor.commands.setContent(next, false);
  }, [content, editor]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  if (!editor) {
    return (
      <div
        className="min-h-[220px] animate-pulse rounded-2xl border"
        style={{ borderColor: T.borderSoft, background: T.inner }}
      />
    );
  }

  const btn = (active: boolean) => ({
    background: active ? T.accentSoft : "transparent",
    color: active ? T.accent : T.muted,
  });

  return (
    <div
      className="overflow-hidden rounded-2xl border"
      style={{ borderColor: T.borderSoft, background: T.inner }}
    >
      <div
        className="flex flex-wrap gap-1 border-b px-2 py-1.5"
        style={{ borderColor: T.borderSoft }}
      >
        <button
          type="button"
          className="grid h-8 w-8 place-items-center rounded-lg"
          style={btn(editor.isActive("bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          aria-label="Gras"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="grid h-8 w-8 place-items-center rounded-lg"
          style={btn(editor.isActive("italic"))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          aria-label="Italique"
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="grid h-8 w-8 place-items-center rounded-lg"
          style={btn(editor.isActive("bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          aria-label="Liste"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="grid h-8 w-8 place-items-center rounded-lg"
          style={btn(editor.isActive("orderedList"))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          aria-label="Liste numérotée"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
