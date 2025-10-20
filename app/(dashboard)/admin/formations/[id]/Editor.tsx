'use client';
import { useState, useEffect, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import { useDebouncedCallback } from 'use-debounce';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  Heading1, 
  Heading2, 
  Heading3, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Link as LinkIcon, 
  Video,
  Palette,
  Sparkles,
  Save,
  Maximize2,
  Loader2
} from 'lucide-react';
import { saveRichContent, mockGenerateAIContent, loadRichContent } from './actions';
import { toast } from 'sonner';
import EditorModal from './EditorModal';
import Uploader from './components/Uploader';
import { Video as VideoExtension } from './extensions/Video';

type Formation = { 
  id: string; 
  org_id: string; 
  title: string; 
  reading_mode: 'free' | 'linear'; 
  visibility_mode: 'private' | 'catalog_only' | 'public'; 
  published: boolean 
};

interface EditorProps {
  formation: Formation;
  selection: { type: 'chapter' | 'subchapter'; id: string; title: string; parentTitle?: string; } | null;
}

export default function Editor({ formation, selection }: EditorProps) {
  const [saved, setSaved] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-iris-400 underline',
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      VideoExtension,
    ],
    content: '<p>Sélectionnez un chapitre ou sous-chapitre pour commencer à éditer...</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none focus:outline-none',
      },
    },
    immediatelyRender: false,
  });

  // Autosave avec debounce
  const debouncedSave = useDebouncedCallback(async (content: any, plainText: string) => {
    if (!selection || !editor) return;
    setSaved(false);
    try {
      await saveRichContent({
        orgId: formation.org_id,
        formationId: formation.id,
        chapterId: selection.type === 'chapter' ? selection.id : undefined,
        subchapterId: selection.type === 'subchapter' ? selection.id : undefined,
        editor: content,
        plainText: plainText,
      });
      setSaved(true);
    } catch (error) {
      console.error('Failed to save content:', error);
      setSaved(false);
    }
  }, 800);

  // Écouter les changements pour l'autosave
  useEffect(() => {
    if (!editor || !selection) return;

    const handleUpdate = () => {
      const content = editor.getJSON();
      const plainText = editor.getText();
      debouncedSave(content, plainText);
    };

    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, selection, debouncedSave]);

  const addImage = useCallback((url: string) => {
    editor?.chain().focus().setImage({ src: url }).run();
  }, [editor]);

  const addVideo = useCallback((url: string, title?: string) => {
    editor?.chain().focus().setVideo({ src: url, title }).run();
  }, [editor]);

  // Charger le contenu existant quand la sélection change
  useEffect(() => {
    if (!editor || !selection) {
      editor?.commands.setContent('<p>Sélectionnez un chapitre ou sous-chapitre pour commencer à éditer...</p>');
      return;
    }

    const loadContent = async () => {
      setIsLoading(true);
      try {
        const { richContent } = await loadRichContent(selection.type, selection.id);
        let contentToLoad: any;

        if (richContent) {
          contentToLoad = richContent;
        } else {
          contentToLoad = selection.type === 'chapter'
            ? {
                type: 'doc',
                content: [{
                  type: 'heading',
                  attrs: { level: 2 },
                  content: [{ type: 'text', text: `Nouveau chapitre : ${selection.title}` }]
                }, {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Commencez à écrire le contenu de ce chapitre...' }]
                }]
              }
            : {
                type: 'doc',
                content: [{
                  type: 'heading',
                  attrs: { level: 3 },
                  content: [{ type: 'text', text: `Nouveau sous-chapitre : ${selection.title}` }]
                }, {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Commencez à écrire le contenu de ce sous-chapitre...' }]
                }]
              };
        }
        editor.commands.setContent(contentToLoad);
      } catch (error) {
        console.error('Error loading content:', error);
        editor.commands.setContent('<p>Erreur lors du chargement du contenu...</p>');
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [selection, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor]);

  const handleGenerateAI = async () => {
    if (!selection || !editor) return;
    setIsGenerating(true);
    try {
      const currentText = editor.getText();
      const generatedContent = await mockGenerateAIContent(currentText);
      editor.chain().focus().setContent(generatedContent).run();
      toast.success('Contenu généré par l\'IA !');
    } catch (error: any) {
      console.error('Error generating AI content:', error);
      toast.error(error.message || 'Erreur lors de la génération de contenu IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  const ToolbarButton = ({ onClick, isActive, children, title }: { onClick: () => void; isActive?: boolean; children: React.ReactNode; title: string; }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded hover:bg-gray-100 transition-colors ${
        isActive ? 'bg-blue-100 text-blue-800' : 'text-gray-600'
      }`}
      title={title}
    >
      {children}
    </button>
  );

  if (!selection) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
        <div className="text-gray-600 text-lg mb-4">Sélectionnez un chapitre ou sous-chapitre pour commencer l'édition</div>
        <div className="text-gray-500 text-sm">Utilisez l'arborescence à gauche pour naviguer</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-gray-200">
        <div className="text-gray-600 text-lg mb-4">Chargement du contenu...</div>
        <div className="animate-spin w-6 h-6 border-2 border-iris-400 border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
      {/* Toolbar structuré */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Section Formatage de base */}
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBold().run()}
              isActive={editor?.isActive('bold')}
              title="Gras"
            >
              <Bold size={18} />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              isActive={editor?.isActive('italic')}
              title="Italique"
            >
              <Italic size={18} />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              isActive={editor?.isActive('underline')}
              title="Souligner"
            >
              <Underline size={18} />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              isActive={editor?.isActive('strike')}
              title="Barrer"
            >
              <Strikethrough size={18} />
            </ToolbarButton>
          </div>

          {/* Section Titres */}
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor?.isActive('heading', { level: 1 })}
              title="Titre 1"
            >
              <Heading1 size={18} />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor?.isActive('heading', { level: 2 })}
              title="Titre 2"
            >
              <Heading2 size={18} />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor?.isActive('heading', { level: 3 })}
              title="Titre 3"
            >
              <Heading3 size={18} />
            </ToolbarButton>
          </div>

          {/* Section Listes et blocs */}
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              isActive={editor?.isActive('bulletList')}
              title="Liste à puces"
            >
              <List size={18} />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              isActive={editor?.isActive('orderedList')}
              title="Liste numérotée"
            >
              <ListOrdered size={18} />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              isActive={editor?.isActive('blockquote')}
              title="Citation"
            >
              <Quote size={18} />
            </ToolbarButton>
            
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
              isActive={editor?.isActive('codeBlock')}
              title="Bloc de code"
            >
              <Code size={18} />
            </ToolbarButton>
          </div>

          {/* Section Liens et médias */}
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            <ToolbarButton
              onClick={setLink}
              isActive={editor?.isActive('link')}
              title="Lien"
            >
              <LinkIcon size={18} />
            </ToolbarButton>
            
            <Uploader
              onImageUpload={addImage}
              onVideoUpload={addVideo}
              formationId={formation.id}
              orgId={formation.org_id}
              published={formation.published}
            />
          </div>

          {/* Section Couleurs */}
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            <input
              type="color"
              onInput={(event: React.ChangeEvent<HTMLInputElement>) => editor?.chain().focus().setColor(event.target.value).run()}
              value={editor?.getAttributes('textStyle').color || '#ffffff'}
              className="w-8 h-8 p-0 border-none cursor-pointer rounded-md overflow-hidden"
              title="Couleur du texte"
            />
            <ToolbarButton
              onClick={() => editor?.chain().focus().unsetAllMarks().run()}
              title="Effacer le formatage"
            >
              <Palette size={18} />
            </ToolbarButton>
          </div>

          {/* Section IA */}
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            <button
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-lg transition-all duration-200 font-medium text-sm"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Créer avec l'IA
            </button>
          </div>

          {/* Section Plein écran */}
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            <ToolbarButton
              onClick={() => setShowModal(true)}
              title="Ouvrir l'éditeur en plein écran"
            >
              <Maximize2 size={18} />
            </ToolbarButton>
          </div>

          {/* Statut de sauvegarde */}
          {saved && (
            <div className="flex items-center gap-1 text-emerald-400 text-sm ml-auto">
              <Save size={16} /> Enregistré ✓
            </div>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="p-4 min-h-[500px]">
        <EditorContent editor={editor} />
      </div>

      {/* Modal d'édition plein écran */}
      {showModal && (
        <EditorModal
          formation={formation}
          selection={selection}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}