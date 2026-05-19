export type AIAction =
  | "rephrase"
  | "mindmap"
  | "schema"
  | "translate"
  | "audio"
  | "insights"
  | "synthesis";

export interface TextTransformationOptions {
  style?: "simplify" | "enrich" | "formal" | "casual" | "theoretical" | "examples" | "structured";
  targetLanguage?: string;
  voice?: string;
}

export function isValidAIAction(action: string): action is AIAction {
  return ["rephrase", "mindmap", "schema", "translate", "audio", "insights", "synthesis"].includes(action);
}

export function getTransformationResultFormat(action: AIAction): "text" | "json" {
  switch (action) {
    case "rephrase":
    case "translate":
    case "synthesis":
      return "text";
    case "mindmap":
    case "schema":
    case "audio":
    case "insights":
      return "json";
    default:
      return "text";
  }
}



