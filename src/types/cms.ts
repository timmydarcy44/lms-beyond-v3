// Types pour le système CMS avec grille

export type BlockType = 
  | "heading1" 
  | "heading2" 
  | "text" 
  | "image" 
  | "video"
  | "button"
  | "spacer";

export type ColumnLayout = "1" | "2" | "3" | "4" | "1-2" | "2-1" | "1-1-1";

export interface BlockStyles {
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: "left" | "center" | "right";
  padding?: string;
  margin?: string;
  width?: string;
  height?: string;
  borderRadius?: string;
}

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  styles?: BlockStyles;
  metadata?: {
    alt?: string;
    url?: string;
    width?: number;
    height?: number;
    href?: string;
    buttonVariant?: "primary" | "secondary" | "outline";
  };
}

export interface Column {
  id: string;
  width?: string; // Pour les layouts personnalisés
  blocks: Block[];
}

export interface Section {
  id: string;
  type: "section";
  layout: ColumnLayout;
  columns: Column[];
  styles?: {
    backgroundColor?: string;
    padding?: string;
    margin?: string;
    backgroundImage?: string;
    minHeight?: string;
  };
}

export type CMSContent = Section[];

export interface CMSPage {
  id?: string;
  slug: string;
  title: string;
  meta_title?: string;
  meta_description?: string;
  h1?: string;
  h2?: string;
  content: CMSContent;
  is_published?: boolean;
}








