import type { CrmAction, CrmActionResult } from "@/lib/crm/ai-assistant-types";
import {
  createPipelineBtobDeal,
  updatePipelineBtobDeal,
  type McpPipelineBtobInput,
} from "@/lib/crm/pipeline-btob-mcp";

export async function executeCrmAssistantAction(action: CrmAction): Promise<CrmActionResult> {
  if (action.type === "none") {
    return { type: "none", success: true, message: "Aucune action" };
  }

  if (action.type === "create_prospect") {
    try {
      const prospect = await createPipelineBtobDeal({
        ...(action.payload as McpPipelineBtobInput),
        source: "claude",
      });
      return {
        type: "create_prospect",
        success: true,
        message: `Prospect « ${String(prospect.company_name)} » créé.`,
        prospect: prospect as Record<string, unknown>,
      };
    } catch (e) {
      return {
        type: "create_prospect",
        success: false,
        message: e instanceof Error ? e.message : "Création impossible",
      };
    }
  }

  if (action.type === "update_prospect") {
    const id = String(action.payload.id ?? "").trim();
    if (!id) {
      return { type: "update_prospect", success: false, message: "ID prospect manquant." };
    }
    const { id: _id, ...rest } = action.payload;
    try {
      const prospect = await updatePipelineBtobDeal(id, rest as McpPipelineBtobInput);
      return {
        type: "update_prospect",
        success: true,
        message: `Prospect « ${String(prospect.company_name)} » mis à jour.`,
        prospect: prospect as Record<string, unknown>,
      };
    } catch (e) {
      return {
        type: "update_prospect",
        success: false,
        message: e instanceof Error ? e.message : "Mise à jour impossible",
      };
    }
  }

  return { type: "none", success: false, message: "Type d'action inconnu" };
}
