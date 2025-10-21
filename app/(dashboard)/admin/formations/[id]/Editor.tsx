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
  Loader2,
  Music
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
  const [showImageModal, setShowImageModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);

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
          class: 'text-blue-500 underline',
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
        class: 'prose prose-gray max-w-none focus:outline-none p-6 min-h-[400px] text-gray-800',
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
      console.error('Erreur lors de la sauvegarde:', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  }, 800);

  // Charger le contenu existant
  useEffect(() => {
    if (!selection || !editor) return;
    
    setIsLoading(true);
    loadRichContent({
      orgId: formation.org_id,
      formationId: formation.id,
      chapterId: selection.type === 'chapter' ? selection.id : undefined,
      subchapterId: selection.type === 'subchapter' ? selection.id : undefined,
    }).then((content) => {
      if (content) {
        editor.commands.setContent(content);
      }
      setIsLoading(false);
    }).catch((error) => {
      console.error('Erreur lors du chargement:', error);
      setIsLoading(false);
    });
  }, [selection, editor, formation.org_id, formation.id]);

  // Autosave sur changement de contenu
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

  const handleImageUpload = useCallback(async (file: File) => {
    if (!editor) return;
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/storage/upload', {
        method: 'POST',
        body: formData,
      });
      
      const { url } = await response.json();
      
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
        toast.success('Image insérée avec succès');
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      toast.error('Erreur lors de l\'upload de l\'image');
    }
  }, [editor]);

  const handleVideoInsert = () => {
    const url = window.prompt('URL de la vidéo (YouTube, Vimeo, etc.):');
    if (url && editor) {
      editor.chain().focus().insertContent({
        type: 'video',
        attrs: {
          src: url,
          title: 'Vidéo',
        },
      }).run();
      toast.success('Vidéo insérée avec succès');
    }
  };

  const handleAudioInsert = () => {
    const url = window.prompt('URL de l\'audio:');
    if (url && editor) {
      editor.chain().focus().insertContent({
        type: 'audio',
        attrs: {
          src: url,
          title: 'Audio',
        },
      }).run();
      toast.success('Audio inséré avec succès');
    }
  };

  const handleGenerateAI = async () => {
    if (!editor || !selection) return;
    
    setIsGenerating(true);
    try {
      const prompt = window.prompt('Décrivez le contenu que vous souhaitez générer:');
      if (!prompt) {
        setIsGenerating(false);
        return;
      }

      const content = await mockGenerateAIContent(prompt);
      editor.chain().focus().insertContent(content).run();
      toast.success('Contenu généré avec succès');
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      toast.error('Erreur lors de la génération du contenu');
    } finally {
      setIsGenerating(false);
    }
  };

  const ToolbarButton = ({ onClick, isActive, children, title }: { onClick: () => void; isActive?: boolean; children: React.ReactNode; title: string; }) => (
    <button
      onClick={onClick}
      className={`p-2 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg' 
          : 'bg-white/80 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 text-gray-700 hover:text-gray-900 shadow-sm hover:shadow-md'
      }`}
      title={title}
    >
      {children}
    </button>
  );

  if (!selection) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20 shadow-lg">
        <div className="text-gray-600 text-lg mb-4">Sélectionnez un chapitre ou sous-chapitre pour commencer l'édition</div>
        <div className="text-gray-500 text-sm">Utilisez l'arborescence à gauche pour naviguer</div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/20 shadow-lg">
        <div className="text-gray-600 text-lg mb-4">Chargement du contenu...</div>
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/20 shadow-lg">
      {/* Toolbar structuré avec gradients */}
      <div className="border-b border-white/20 p-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Section Formatage de base */}
          <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm rounded-lg p-1 shadow-sm">
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBold().run()}
              isActive={editor?.isActive('bold')}
              title="Gras"
            >
              <Bold size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleItalic().run()}
              isActive={editor?.isActive('italic')}
              title="Italique"
            >
              <Italic size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleUnderline().run()}
              isActive={editor?.isActive('underline')}
              title="Souligné"
            >
              <Underline size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleStrike().run()}
              isActive={editor?.isActive('strike')}
              title="Barré"
            >
              <Strikethrough size={16} />
            </ToolbarButton>
          </div>

          {/* Section Titres */}
          <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm rounded-lg p-1 shadow-sm">
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor?.isActive('heading', { level: 1 })}
              title="Titre 1"
            >
              <Heading1 size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor?.isActive('heading', { level: 2 })}
              title="Titre 2"
            >
              <Heading2 size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor?.isActive('heading', { level: 3 })}
              title="Titre 3"
            >
              <Heading3 size={16} />
            </ToolbarButton>
          </div>

          {/* Section Listes */}
          <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm rounded-lg p-1 shadow-sm">
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBulletList().run()}
              isActive={editor?.isActive('bulletList')}
              title="Liste à puces"
            >
              <List size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleOrderedList().run()}
              isActive={editor?.isActive('orderedList')}
              title="Liste numérotée"
            >
              <ListOrdered size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleBlockquote().run()}
              isActive={editor?.isActive('blockquote')}
              title="Citation"
            >
              <Quote size={16} />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
              isActive={editor?.isActive('codeBlock')}
              title="Bloc de code"
            >
              <Code size={16} />
            </ToolbarButton>
          </div>

          {/* Section Médias */}
          <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setShowImageModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl"
            >
              <Palette size={14} />
              Insérer une image
            </button>
            <button
              onClick={handleVideoInsert}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-lg transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl"
            >
              <Video size={14} />
              Insérer une vidéo
            </button>
            <button
              onClick={handleAudioInsert}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 text-white rounded-lg transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl"
            >
              <Music size={14} />
              Insérer un audio
            </button>
          </div>

          {/* Section IA */}
          <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm rounded-lg p-1 shadow-sm">
            <button
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Créer avec l'IA
            </button>
          </div>

          {/* Section Actions */}
          <div className="flex items-center gap-1 bg-white/60 backdrop-blur-sm rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-lg transition-all duration-200 font-medium text-sm shadow-lg hover:shadow-xl"
            >
              <Maximize2 size={14} />
              Plein écran
            </button>
            {saved && (
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium text-sm shadow-lg">
                <Save size={14} />
                Enregistré ✓
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Zone d'édition */}
      <div className="bg-white/90 backdrop-blur-sm">
        <EditorContent editor={editor} />
      </div>

      {/* Modals */}
      {showModal && (
        <EditorModal
          formation={formation}
          selection={selection}
          onClose={() => setShowModal(false)}
        />
      )}

      {showImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Insérer une image</h3>
            <Uploader
              onImageUpload={handleImageUpload}
              accept="image/*"
            />
            <button
              onClick={() => setShowImageModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}