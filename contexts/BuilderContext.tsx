"use client";
import { createContext, useContext, useState, ReactNode } from "react";

type SubChapter = {
  id: string;
  chapter_id: string;
  title: string;
  content: string;
  position: number;
};

type BuilderContextType = {
  selectedSubChapter: SubChapter | null;
  setSelectedSubChapter: (subchapter: SubChapter | null) => void;
  refreshBuilder: () => void;
  setRefreshBuilder: (fn: () => void) => void;
};

const BuilderContext = createContext<BuilderContextType | undefined>(undefined);

export function BuilderProvider({ children }: { children: ReactNode }) {
  const [selectedSubChapter, setSelectedSubChapter] = useState<SubChapter | null>(null);
  const [refreshBuilder, setRefreshBuilder] = useState<() => void>(() => {});

  return (
    <BuilderContext.Provider
      value={{
        selectedSubChapter,
        setSelectedSubChapter,
        refreshBuilder,
        setRefreshBuilder,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
}

export function useBuilder() {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error("useBuilder must be used within BuilderProvider");
  }
  return context;
}




