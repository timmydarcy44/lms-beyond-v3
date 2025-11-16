"use client";

import { Textarea } from "@/components/ui/textarea";

type RichTextEditorProps = {
  content: string;
  onChange: (content: string) => void;
};

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  return (
    <Textarea
      value={content}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Saisissez votre texte ici..."
      rows={6}
      className="resize-none"
    />
  );
}

