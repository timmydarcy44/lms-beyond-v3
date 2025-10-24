'use client';

import { useState } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2, Edit3, GripVertical } from 'lucide-react';
import { createSection, createChapter, createSubchapter, renameNode, deleteNode, reorderSections, reorderChapters, reorderSubchapters } from '@/app/admin/[org]/formations/[id]/actions';

interface Section {
  id: string;
  title: string;
  position: number;
  chapters: Chapter[];
}

interface Chapter {
  id: string;
  title: string;
  position: number;
  subchapters: Subchapter[];
}

interface Subchapter {
  id: string;
  title: string;
  position: number;
}

interface StructureTreeProps {
  formationId: string;
  sections: Section[];
  onSectionsChange: (sections: Section[]) => void;
}

function SortableSection({ section, formationId, sections, onSectionsChange }: { section: Section; formationId: string; sections: Section[]; onSectionsChange: (sections: Section[]) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(section.title);
  
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

  const handleRename = async () => {
    if (title.trim() && title !== section.title) {
      await renameNode('section', section.id, title.trim());
      onSectionsChange(sections.map(s => s.id === section.id ? { ...s, title: title.trim() } : s));
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('Supprimer cette section ?')) {
      await deleteNode('section', section.id);
      onSectionsChange(sections.filter(s => s.id !== section.id));
    }
  };

  const addChapter = async () => {
    const chapter = await createChapter(section.id, 'Nouveau chapitre');
    const newChapter: Chapter = {
      id: chapter.id,
      title: chapter.title,
      position: chapter.position,
      subchapters: []
    };
      onSectionsChange(sections.map(s => 
        s.id === section.id ? { ...s, chapters: [...s.chapters, newChapter] } : s
      ));
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-1">
      <div className="flex items-center gap-2 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
        <div {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-4 w-4 text-white/50" />
        </div>
        
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-iris-500/50"
            autoFocus
          />
        ) : (
          <span className="flex-1 text-white font-medium text-sm">{section.title}</span>
        )}
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-white/50 hover:text-white/70"
          >
            <Edit3 className="h-3 w-3" />
          </button>
          <button
            onClick={addChapter}
            className="p-1 text-white/50 hover:text-white/70"
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-red-400/50 hover:text-red-400"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      
      <div className="ml-6 space-y-1">
        {section.chapters.map(chapter => (
          <SortableChapter
            key={chapter.id}
            chapter={chapter}
            section={section}
            formationId={formationId}
            sections={sections}
            onSectionsChange={onSectionsChange}
          />
        ))}
      </div>
    </div>
  );
}

function SortableChapter({ chapter, section, formationId, sections, onSectionsChange }: { chapter: Chapter; section: Section; formationId: string; sections: Section[]; onSectionsChange: (sections: Section[]) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(chapter.title);
  
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

  const handleRename = async () => {
    if (title.trim() && title !== chapter.title) {
      await renameNode('chapter', chapter.id, title.trim());
      onSectionsChange(sections.map(s => 
        s.id === section.id ? {
          ...s,
          chapters: s.chapters.map(c => c.id === chapter.id ? { ...c, title: title.trim() } : c)
        } : s
      ));
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('Supprimer ce chapitre ?')) {
      await deleteNode('chapter', chapter.id);
      onSectionsChange(sections.map(s => 
        s.id === section.id ? { ...s, chapters: s.chapters.filter(c => c.id !== chapter.id) } : s
      ));
    }
  };

  const addSubchapter = async () => {
    const subchapter = await createSubchapter(chapter.id, 'Nouveau sous-chapitre');
    const newSubchapter: Subchapter = {
      id: subchapter.id,
      title: subchapter.title,
      position: subchapter.position
    };
    onSectionsChange(sections.map(s => 
      s.id === section.id ? {
        ...s,
        chapters: s.chapters.map(c => 
          c.id === chapter.id ? { ...c, subchapters: [...c.subchapters, newSubchapter] } : c
        )
      } : s
    ));
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-1">
      <div className="flex items-center gap-2 p-2 bg-white/5 rounded hover:bg-white/10 transition-colors">
        <div {...attributes} {...listeners} className="cursor-grab">
          <GripVertical className="h-3 w-3 text-white/50" />
        </div>
        
        {isEditing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-iris-500/50"
            autoFocus
          />
        ) : (
          <span className="flex-1 text-white/80 text-xs">{chapter.title}</span>
        )}
        
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-white/50 hover:text-white/70"
          >
            <Edit3 className="h-3 w-3" />
          </button>
          <button
            onClick={addSubchapter}
            className="p-1 text-white/50 hover:text-white/70"
          >
            <Plus className="h-3 w-3" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-red-400/50 hover:text-red-400"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
      
      <div className="ml-4 space-y-1">
        {chapter.subchapters.map(subchapter => (
          <SortableSubchapter
            key={subchapter.id}
            subchapter={subchapter}
            chapter={chapter}
            section={section}
            formationId={formationId}
            sections={sections}
            onSectionsChange={onSectionsChange}
          />
        ))}
      </div>
    </div>
  );
}

function SortableSubchapter({ subchapter, chapter, section, formationId, sections, onSectionsChange }: { subchapter: Subchapter; chapter: Chapter; section: Section; formationId: string; sections: Section[]; onSectionsChange: (sections: Section[]) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(subchapter.title);
  
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

  const handleRename = async () => {
    if (title.trim() && title !== subchapter.title) {
      await renameNode('subchapter', subchapter.id, title.trim());
      onSectionsChange(sections.map(s => 
        s.id === section.id ? {
          ...s,
          chapters: s.chapters.map(c => 
            c.id === chapter.id ? {
              ...c,
              subchapters: c.subchapters.map(sc => sc.id === subchapter.id ? { ...sc, title: title.trim() } : sc)
            } : c
          )
        } : s
      ));
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm('Supprimer ce sous-chapitre ?')) {
      await deleteNode('subchapter', subchapter.id);
      onSectionsChange(sections.map(s => 
        s.id === section.id ? {
          ...s,
          chapters: s.chapters.map(c => 
            c.id === chapter.id ? { ...c, subchapters: c.subchapters.filter(sc => sc.id !== subchapter.id) } : c
          )
        } : s
      ));
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-2 p-2 bg-white/5 rounded hover:bg-white/10 transition-colors">
      <div {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="h-3 w-3 text-white/50" />
      </div>
      
      {isEditing ? (
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          className="flex-1 px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-xs focus:outline-none focus:ring-1 focus:ring-iris-500/50"
          autoFocus
        />
      ) : (
        <span className="flex-1 text-white/60 text-xs">{subchapter.title}</span>
      )}
      
      <div className="flex items-center gap-1">
        <button
          onClick={() => setIsEditing(true)}
          className="p-1 text-white/50 hover:text-white/70"
        >
          <Edit3 className="h-3 w-3" />
        </button>
        <button
          onClick={handleDelete}
          className="p-1 text-red-400/50 hover:text-red-400"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

export default function StructureTree({ formationId, sections, onSectionsChange }: StructureTreeProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addSection = async () => {
    const section = await createSection(formationId, 'Nouvelle section');
    const newSection: Section = {
      id: section.id,
      title: section.title,
      position: section.position,
      chapters: []
    };
    onSectionsChange([...sections, newSection]);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Déterminer le type d'élément et réorganiser
    const activeSection = sections.find(s => s.id === active.id);
    if (activeSection) {
      // Réorganisation des sections
      const oldIndex = sections.findIndex(s => s.id === active.id);
      const newIndex = sections.findIndex(s => s.id === over.id);
      const newSections = arrayMove(sections, oldIndex, newIndex);
      onSectionsChange(newSections);
      await reorderSections(formationId, newSections.map(s => s.id));
      return;
    }

    // Réorganisation des chapitres
    for (const section of sections) {
      const activeChapter = section.chapters.find(c => c.id === active.id);
      if (activeChapter) {
        const oldIndex = section.chapters.findIndex(c => c.id === active.id);
        const newIndex = section.chapters.findIndex(c => c.id === over.id);
        const newChapters = arrayMove(section.chapters, oldIndex, newIndex);
        onSectionsChange(sections.map(s => 
          s.id === section.id ? { ...s, chapters: newChapters } : s
        ));
        await reorderChapters(section.id, newChapters.map(c => c.id));
        return;
      }

      // Réorganisation des sous-chapitres
      for (const chapter of section.chapters) {
        const activeSubchapter = chapter.subchapters.find(sc => sc.id === active.id);
        if (activeSubchapter) {
          const oldIndex = chapter.subchapters.findIndex(sc => sc.id === active.id);
          const newIndex = chapter.subchapters.findIndex(sc => sc.id === over.id);
          const newSubchapters = arrayMove(chapter.subchapters, oldIndex, newIndex);
          onSectionsChange(sections.map(s => 
            s.id === section.id ? {
              ...s,
              chapters: s.chapters.map(c => 
                c.id === chapter.id ? { ...c, subchapters: newSubchapters } : c
              )
            } : s
          ));
          await reorderSubchapters(chapter.id, newSubchapters.map(sc => sc.id));
          return;
        }
      }
    }
  };

  const allSortableIds = [
    ...sections.map(s => s.id),
    ...sections.flatMap(s => s.chapters.map(c => c.id)),
    ...sections.flatMap(s => s.chapters.flatMap(c => c.subchapters.map(sc => sc.id)))
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Structure</h3>
        <button
          onClick={addSection}
          className="p-2 bg-iris-500/20 text-iris-400 rounded-lg hover:bg-iris-500/30 transition-colors"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={allSortableIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {sections.map(section => (
              <SortableSection
                key={section.id}
                section={section}
                formationId={formationId}
                sections={sections}
                onSectionsChange={onSectionsChange}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
