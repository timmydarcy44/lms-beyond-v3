export const PIPELINE_ACTION_TYPES = [
  { value: "call_success", label: "Appel", icon: "📞" },
  { value: "call_no_answer", label: "Appel sans succès", icon: "📵" },
  { value: "call_voicemail", label: "Messagerie", icon: "📩" },
  { value: "call_busy", label: "Ligne occupée", icon: "⏳" },
  { value: "call_failed", label: "Échec de l'appel", icon: "❌" },
  { value: "email", label: "Email", icon: "✉️" },
  { value: "meeting", label: "Rendez-vous / visio", icon: "👥" },
  { value: "note", label: "Note", icon: "📝" },
  { value: "other", label: "Autre", icon: "•" },
] as const;

export type PipelineActionType = (typeof PIPELINE_ACTION_TYPES)[number]["value"];

export function pipelineActionLabel(type: string): string {
  return PIPELINE_ACTION_TYPES.find((t) => t.value === type)?.label ?? type;
}

export function isCallActionType(type: string): boolean {
  return type.startsWith("call_");
}
