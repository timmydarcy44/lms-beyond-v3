export type AssistantMessageRole = "user" | "assistant";

export type AssistantHistoryMessage = {
  role: AssistantMessageRole;
  content: string;
};

export type CrmActionType = "create_prospect" | "update_prospect" | "none";

export type CrmAction = {
  type: CrmActionType;
  payload: Record<string, unknown>;
};

export type AssistantRequest = {
  message: string;
  conversationHistory: AssistantHistoryMessage[];
};

export type CrmActionResult = {
  type: CrmActionType;
  success: boolean;
  message: string;
  prospect?: Record<string, unknown>;
};

export type AssistantResponse = {
  reply: string;
  actions?: CrmAction[];
  actionResults?: CrmActionResult[];
};
