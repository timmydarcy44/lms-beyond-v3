'use client';

import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Edit2, Trash2, GripVertical } from 'lucide-react';
import { 
  createSection, 
  createChapter, 
  createSubchapter, 
  renameNode, 
  deleteNode,
  reorderSections,
  reorderChapters,
  reorderSubchapters
} from './actions';
import { toast } from 'sonner';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ParentSelector from './components/ParentSelector';

type Section = { id: string; title: string; position: number; };
type Chapter = { id: string; section_id: string; title: string; position: number; };
type Subchapter = { id: string; chapter_id: string; title: string; position: number; };

interface TreeProps {
  formationId: string;
  sections: Section[];
  chapters: Chapter[];
  subchapters: Subchapter[];
  onSelect: (selection: { type: 'chapter' | 'subchapter'; id: string; title: string; parentTitle?: string; } | null) => void;
}

// Composant Sortable pour les sections
function SortableSection({ 
  section, 
  chapters, 
  subchapters, 
  expandedSections, 
  expandedChapters, 
  editingNode, 
  editingTitle, 
  onToggleSection, 
  onToggleChapter, 
  onStartEditing, 
  onFinishEditing, 
  onSetEditingTitle, 
  onDelete, 
  onCreateChapter, 
  onCreateSubchapter, 
  onSelect 
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sectionChapters = chapters.filter((ch: Chapter) => ch.section_id === section.id).sort((a: Chapter, b: Chapter) => a.position - b.position);
  const isExpanded = expandedSections.has(section.id);

  return (
    <div ref={setNodeRef} style={style} className="border border-gray-200 rounded-lg bg-white">
      {/* Section Header */}
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-t-lg border border-gray-200">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:bg-gray-100 rounded p-1"
        >
          <GripVertical size={16} className="text-gray-900/50" />
        </div>
        
        <button
          onClick={() => onToggleSection(section.id)}
          className="p-1 hover:bg-white/10 rounded"
        >
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        
        {editingNode?.type === 'section' && editingNode.id === section.id ? (
          <input
            type="text"
            value={editingTitle}
            onChange={(e) => onSetEditingTitle(e.target.value)}
            onBlur={onFinishEditing}
            onKeyDown={(e) => e.key === 'Enter' && onFinishEditing()}
            className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-gray-900"
            autoFocus
          />
        ) : (
          <span className="flex-1 text-gray-900 font-medium">{section.title}</span>
        )}
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => onStartEditing('section', section.id, section.title)}
            className="p-1 hover:bg-white/10 rounded"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => onDelete('section', section.id)}
            className="p-1 hover:bg-white/10 rounded text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Section Content */}
      {isExpanded && (
        <div className="p-3 space-y-3">
          {/* Bouton pour ajouter un chapitre */}
          <button
            onClick={() => onCreateChapter(section.id)}
            className="w-full btn-secondary flex items-center gap-2 justify-center text-sm"
          >
            <Plus size={14} />
            Nouveau Chapitre
          </button>

          {/* Chapitres */}
          <SortableContext items={sectionChapters.map((ch: Chapter) => ch.id)} strategy={verticalListSortingStrategy}>
            {sectionChapters.map((chapter: Chapter) => {
              const chapterSubchapters = subchapters.filter((sub: Subchapter) => sub.chapter_id === chapter.id).sort((a: Subchapter, b: Subchapter) => a.position - b.position);
              const isChapterExpanded = expandedChapters.has(chapter.id);
              
              return (
                <SortableChapter
                  key={chapter.id}
                  chapter={chapter}
                  subchapters={chapterSubchapters}
                  expandedChapters={expandedChapters}
                  editingNode={editingNode}
                  editingTitle={editingTitle}
                  onToggleChapter={onToggleChapter}
                  onStartEditing={onStartEditing}
                  onFinishEditing={onFinishEditing}
                  onSetEditingTitle={onSetEditingTitle}
                  onDelete={onDelete}
                  onCreateSubchapter={onCreateSubchapter}
                  onSelect={onSelect}
                />
              );
            })}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

// Composant Sortable pour les chapitres
function SortableChapter({ 
  chapter, 
  subchapters, 
  expandedChapters, 
  editingNode, 
  editingTitle, 
  onToggleChapter, 
  onStartEditing, 
  onFinishEditing, 
  onSetEditingTitle, 
  onDelete, 
  onCreateSubchapter, 
  onSelect 
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isChapterExpanded = expandedChapters.has(chapter.id);

  return (
    <div ref={setNodeRef} style={style} className="ml-4 border-l border-white/10 pl-3">
      {/* Chapter Header */}
      <div className="flex items-center gap-2 py-2">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab hover:bg-gray-100 rounded p-1"
        >
          <GripVertical size={12} className="text-gray-900/40" />
        </div>
        
        <button
          onClick={() => onToggleChapter(chapter.id)}
          className="p-1 hover:bg-white/10 rounded"
        >
          {isChapterExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        
        {editingNode?.type === 'chapter' && editingNode.id === chapter.id ? (
          <input
            type="text"
            value={editingTitle}
            onChange={(e) => onSetEditingTitle(e.target.value)}
            onBlur={onFinishEditing}
            onKeyDown={(e) => e.key === 'Enter' && onFinishEditing()}
            className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-gray-900 text-sm"
            autoFocus
          />
        ) : (
          <span 
            className="flex-1 text-gray-900/80 text-sm cursor-pointer hover:text-gray-900"
            onClick={() => onSelect({ type: 'chapter', id: chapter.id, title: chapter.title })}
          >
            {chapter.title}
          </span>
        )}
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => onStartEditing('chapter', chapter.id, chapter.title)}
            className="p-1 hover:bg-white/10 rounded"
          >
            <Edit2 size={12} />
          </button>
          <button
            onClick={() => onDelete('chapter', chapter.id)}
            className="p-1 hover:bg-white/10 rounded text-red-400"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Chapter Content */}
      {isChapterExpanded && (
        <div className="ml-4 space-y-2">
          {/* Bouton pour ajouter un sous-chapitre */}
          <button
            onClick={() => onCreateSubchapter(chapter.id)}
            className="w-full btn-secondary flex items-center gap-2 justify-center text-xs"
          >
            <Plus size={12} />
            Nouveau Sous-chapitre
          </button>

          {/* Sous-chapitres */}
          <SortableContext items={subchapters.map((sub: Subchapter) => sub.id)} strategy={verticalListSortingStrategy}>
            {subchapters.map((subchapter: Subchapter) => (
              <SortableSubchapter
                key={subchapter.id}
                subchapter={subchapter}
                editingNode={editingNode}
                editingTitle={editingTitle}
                onStartEditing={onStartEditing}
                onFinishEditing={onFinishEditing}
                onSetEditingTitle={onSetEditingTitle}
                onDelete={onDelete}
                onSelect={onSelect}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}

// Composant Sortable pour les sous-chapitres
function SortableSubchapter({ 
  subchapter, 
  editingNode, 
  editingTitle, 
  onStartEditing, 
  onFinishEditing, 
  onSetEditingTitle, 
  onDelete, 
  onSelect 
}: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subchapter.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 py-1">
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:bg-white/10 rounded p-1"
      >
        <GripVertical size={10} className="text-gray-900/30" />
      </div>
      
      <div className="w-2 h-2 bg-white/30 rounded-full"></div>
      
      {editingNode?.type === 'subchapter' && editingNode.id === subchapter.id ? (
        <input
          type="text"
          value={editingTitle}
          onChange={(e) => onSetEditingTitle(e.target.value)}
          onBlur={onFinishEditing}
          onKeyDown={(e) => e.key === 'Enter' && onFinishEditing()}
          className="flex-1 bg-white/10 border border-white/20 rounded px-2 py-1 text-gray-900 text-xs"
          autoFocus
        />
      ) : (
        <span 
          className="flex-1 text-gray-900/60 text-xs cursor-pointer hover:text-gray-900/80"
          onClick={() => {
            onSelect({ 
              type: 'subchapter', 
              id: subchapter.id, 
              title: subchapter.title
            });
          }}
        >
          {subchapter.title}
        </span>
      )}
      
      <div className="flex items-center gap-1">
        <button
          onClick={() => onStartEditing('subchapter', subchapter.id, subchapter.title)}
          className="p-1 hover:bg-white/10 rounded"
        >
          <Edit2 size={10} />
        </button>
        <button
          onClick={() => onDelete('subchapter', subchapter.id)}
          className="p-1 hover:bg-white/10 rounded text-red-400"
        >
          <Trash2 size={10} />
        </button>
      </div>
    </div>
  );
}

export default function Tree({ formationId, sections: initialSections, chapters: initialChapters, subchapters: initialSubchapters, onSelect }: TreeProps) {
  const [sections, setSections] = useState(initialSections);
  const [chapters, setChapters] = useState(initialChapters);
  const [subchapters, setSubchapters] = useState(initialSubchapters);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [editingNode, setEditingNode] = useState<{ type: 'section' | 'chapter' | 'subchapter'; id: string } | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [showParentSelector, setShowParentSelector] = useState<{ type: 'chapter' | 'subchapter' } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const handleCreateSection = async () => {
    try {
      const newSection = await createSection(formationId, 'Nouvelle Section');
      setSections(prev => [...prev, newSection].sort((a, b) => a.position - b.position));
      toast.success('Section créée !');
    } catch (error: any) {
      console.error('Error creating section:', error);
      toast.error(error.message || 'Erreur lors de la création de la section.');
    }
  };

  const handleCreateChapter = async (sectionId: string) => {
    try {
      const newChapter = await createChapter(sectionId, 'Nouveau Chapitre');
      setChapters(prev => [...prev, newChapter].sort((a, b) => a.position - b.position));
      toast.success('Chapitre créé !');
      setExpandedSections(prev => new Set(prev).add(sectionId));
    } catch (error: any) {
      console.error('Error creating chapter:', error);
      toast.error(error.message || 'Erreur lors de la création du chapitre.');
    }
  };

  const handleCreateSubchapter = async (chapterId: string) => {
    try {
      const newSubchapter = await createSubchapter(chapterId, 'Nouveau Sous-chapitre');
      setSubchapters(prev => [...prev, newSubchapter].sort((a, b) => a.position - b.position));
      toast.success('Sous-chapitre créé !');
      setExpandedChapters(prev => new Set(prev).add(chapterId));
    } catch (error: any) {
      console.error('Error creating subchapter:', error);
      toast.error(error.message || 'Erreur lors de la création du sous-chapitre.');
    }
  };

  const handleParentSelect = async (parentId: string) => {
    if (!showParentSelector) return;
    
    try {
      if (showParentSelector.type === 'chapter') {
        await handleCreateChapter(parentId);
      } else {
        await handleCreateSubchapter(parentId);
      }
    } catch (error: any) {
      console.error('Error creating with parent:', error);
      toast.error(error.message || 'Erreur lors de la création.');
    } finally {
      setShowParentSelector(null);
    }
  };

  const handleRename = async (type: 'section' | 'chapter' | 'subchapter', id: string, newTitle: string) => {
    try {
      await renameNode(type, id, newTitle);
      if (type === 'section') {
        setSections(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s));
      } else if (type === 'chapter') {
        setChapters(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
      } else {
        setSubchapters(prev => prev.map(sc => sc.id === id ? { ...sc, title: newTitle } : sc));
      }
      toast.success('Renommé !');
      setEditingNode(null);
    } catch (error: any) {
      console.error('Error renaming:', error);
      toast.error(error.message || 'Erreur lors du renommage.');
    }
  };

  const handleDelete = async (type: 'section' | 'chapter' | 'subchapter', id: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer ce ${type} ?`)) return;
    try {
      await deleteNode(type, id);
      if (type === 'section') {
        setSections(prev => prev.filter(s => s.id !== id));
        setChapters(prev => prev.filter(c => c.section_id !== id));
        setSubchapters(prev => prev.filter(sc => !chapters.find(c => c.section_id === id)?.id || !chapters.find(c => c.id === sc.chapter_id)?.id));
      } else if (type === 'chapter') {
        setChapters(prev => prev.filter(c => c.id !== id));
        setSubchapters(prev => prev.filter(sc => sc.chapter_id !== id));
      } else {
        setSubchapters(prev => prev.filter(sc => sc.id !== id));
      }
      toast.success('Supprimé !');
      onSelect(null);
    } catch (error: any) {
      console.error('Error deleting:', error);
      toast.error(error.message || 'Erreur lors de la suppression.');
    }
  };

  const startEditing = (type: 'section' | 'chapter' | 'subchapter', id: string, currentTitle: string) => {
    setEditingNode({ type, id });
    setEditingTitle(currentTitle);
  };

  const finishEditing = () => {
    if (editingNode && editingTitle.trim()) {
      handleRename(editingNode.type, editingNode.id, editingTitle.trim());
    } else {
      setEditingNode(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Déterminer le type d'élément et réorganiser
    const activeSection = sections.find(s => s.id === activeId);
    const activeChapter = chapters.find(c => c.id === activeId);
    const activeSubchapter = subchapters.find(sc => sc.id === activeId);

    if (activeSection) {
      // Réorganisation des sections
      const oldIndex = sections.findIndex(s => s.id === activeId);
      const newIndex = sections.findIndex(s => s.id === overId);
      const newSections = arrayMove(sections, oldIndex, newIndex);
      setSections(newSections);
      
      try {
        await reorderSections(formationId, newSections.map(s => s.id));
        toast.success('Ordre des sections mis à jour !');
      } catch (error) {
        console.error('Error reordering sections:', error);
        toast.error('Erreur lors de la réorganisation des sections.');
      }
    } else if (activeChapter) {
      // Réorganisation des chapitres dans la même section
      const sectionId = activeChapter.section_id;
      const sectionChapters = chapters.filter(c => c.section_id === sectionId).sort((a, b) => a.position - b.position);
      const oldIndex = sectionChapters.findIndex(c => c.id === activeId);
      const newIndex = sectionChapters.findIndex(c => c.id === overId);
      const newSectionChapters = arrayMove(sectionChapters, oldIndex, newIndex);
      
      // Mettre à jour les positions
      const updatedChapters = chapters.map(c => {
        if (c.section_id === sectionId) {
          const newChapter = newSectionChapters.find(nc => nc.id === c.id);
          return newChapter ? { ...c, position: newChapter.position } : c;
        }
        return c;
      });
      setChapters(updatedChapters);
      
      try {
        await reorderChapters(sectionId, newSectionChapters.map(c => c.id));
        toast.success('Ordre des chapitres mis à jour !');
      } catch (error) {
        console.error('Error reordering chapters:', error);
        toast.error('Erreur lors de la réorganisation des chapitres.');
      }
    } else if (activeSubchapter) {
      // Réorganisation des sous-chapitres dans le même chapitre
      const chapterId = activeSubchapter.chapter_id;
      const chapterSubchapters = subchapters.filter(sc => sc.chapter_id === chapterId).sort((a, b) => a.position - b.position);
      const oldIndex = chapterSubchapters.findIndex(sc => sc.id === activeId);
      const newIndex = chapterSubchapters.findIndex(sc => sc.id === overId);
      const newChapterSubchapters = arrayMove(chapterSubchapters, oldIndex, newIndex);
      
      // Mettre à jour les positions
      const updatedSubchapters = subchapters.map(sc => {
        if (sc.chapter_id === chapterId) {
          const newSubchapter = newChapterSubchapters.find(nsc => nsc.id === sc.id);
          return newSubchapter ? { ...sc, position: newSubchapter.position } : sc;
        }
        return sc;
      });
      setSubchapters(updatedSubchapters);
      
      try {
        await reorderSubchapters(chapterId, newChapterSubchapters.map(sc => sc.id));
        toast.success('Ordre des sous-chapitres mis à jour !');
      } catch (error) {
        console.error('Error reordering subchapters:', error);
        toast.error('Erreur lors de la réorganisation des sous-chapitres.');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Header avec 3 CTA côte à côte */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900">Structure de la formation</h3>
        
        {/* 3 boutons CTA côte à côte */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleCreateSection}
            className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-all duration-200 font-medium text-sm flex items-center gap-2 justify-center"
          >
            <Plus size={14} />
            Section
          </button>
          
          <button
            onClick={() => setShowParentSelector({ type: 'chapter' })}
            disabled={sections.length === 0}
            className="px-3 py-2 bg-blue-100 hover:bg-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-blue-800 rounded-lg transition-all duration-200 font-medium text-sm flex items-center gap-2 justify-center"
          >
            <Plus size={14} />
            Chapitre
          </button>
          
          <button
            onClick={() => setShowParentSelector({ type: 'subchapter' })}
            disabled={chapters.length === 0}
            className="px-3 py-2 bg-green-100 hover:bg-green-200 disabled:bg-gray-100 disabled:cursor-not-allowed text-green-800 rounded-lg transition-all duration-200 font-medium text-sm flex items-center gap-2 justify-center"
          >
            <Plus size={14} />
            Sous-chapitre
          </button>
        </div>
      </div>

      {/* Liste des sections avec drag & drop */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sections.map((section) => (
              <SortableSection
                key={section.id}
                section={section}
                chapters={chapters}
                subchapters={subchapters}
                expandedSections={expandedSections}
                expandedChapters={expandedChapters}
                editingNode={editingNode}
                editingTitle={editingTitle}
                onToggleSection={toggleSection}
                onToggleChapter={toggleChapter}
                onStartEditing={startEditing}
                onFinishEditing={finishEditing}
                onSetEditingTitle={setEditingTitle}
                onDelete={handleDelete}
                onCreateChapter={handleCreateChapter}
                onCreateSubchapter={handleCreateSubchapter}
                onSelect={onSelect}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Parent Selector Modal */}
      {showParentSelector && (
        <ParentSelector
          type={showParentSelector.type}
          sections={sections}
          chapters={chapters}
          onSelect={handleParentSelect}
          onCancel={() => setShowParentSelector(null)}
        />
      )}
    </div>
  );
}