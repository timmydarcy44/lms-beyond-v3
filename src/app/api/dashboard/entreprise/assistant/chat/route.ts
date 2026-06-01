import { NextRequest, NextResponse } from "next/server";
import { generateChatWithAnthropic } from "@/lib/ai/anthropic-messages";
import {
  buildEntrepriseAssistantSystemPrompt,
  fetchEntrepriseAssistantContext,
} from "@/lib/entreprise/assistant-context";
import {
  rejectsCrossOrganizationRequest,
  resolveEntrepriseAssistantAccess,
} from "@/lib/entreprise/assistant-access";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const access = await resolveEntrepriseAssistantAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.error }, { status: access.status });
  }

  let body: { message?: string; history?: { role: "user" | "assistant"; content: string }[] };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message requis" }, { status: 400 });
  }

  if (rejectsCrossOrganizationRequest(message, access.organizationId)) {
    return NextResponse.json({
      reply:
        "Je n'ai accès qu'aux données de votre organisation. Je ne peux pas consulter les collaborateurs ou informations d'une autre entreprise.",
    });
  }

  const ctx = await fetchEntrepriseAssistantContext(access.organizationId);
  if (!ctx) {
    return NextResponse.json({ error: "Organisation introuvable" }, { status: 403 });
  }

  const history = (body.history ?? []).slice(-8);
  const systemPrompt = buildEntrepriseAssistantSystemPrompt(access.organizationId, ctx);

  const messages = [
    ...history.map((h) => ({ role: h.role, content: h.content })),
    { role: "user" as const, content: message },
  ];

  const reply =
    (await generateChatWithAnthropic(systemPrompt, messages, { maxTokens: 600 })) ??
    "Je ne peux pas répondre pour le moment. Réessayez dans un instant ou contactez le support Beyond.";

  return NextResponse.json({ reply });
}
