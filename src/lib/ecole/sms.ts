/**
 * Abstraction SMS — provider configurable via env.
 * Aucun fournisseur hardcodé : si non configuré, l'envoi est simulé / journalisé.
 */
export type SmsSendResult = {
  ok: boolean;
  provider: string;
  messageId?: string;
  error?: string;
  simulated?: boolean;
};

export async function sendSms(params: {
  to: string;
  body: string;
  meta?: Record<string, unknown>;
}): Promise<SmsSendResult> {
  const provider = (process.env.EDGE_SMS_PROVIDER ?? "").trim().toLowerCase();
  const to = params.to.trim();
  if (!to) return { ok: false, provider: provider || "none", error: "MISSING_PHONE" };

  if (!provider || provider === "none" || provider === "log") {
    console.info("[sms] simulated", { to: to.slice(0, 4) + "…", bodyLen: params.body.length, meta: params.meta });
    return { ok: true, provider: "log", simulated: true, messageId: `sim_${Date.now()}` };
  }

  if (provider === "twilio") {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;
    if (!sid || !token || !from) {
      return { ok: false, provider: "twilio", error: "TWILIO_NOT_CONFIGURED" };
    }
    try {
      const auth = Buffer.from(`${sid}:${token}`).toString("base64");
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({ To: to, From: from, Body: params.body }),
        },
      );
      const json = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
      if (!res.ok) {
        return { ok: false, provider: "twilio", error: json.message || `HTTP_${res.status}` };
      }
      return { ok: true, provider: "twilio", messageId: json.sid };
    } catch (e) {
      return {
        ok: false,
        provider: "twilio",
        error: e instanceof Error ? e.message : "SEND_FAILED",
      };
    }
  }

  console.warn("[sms] unknown provider", provider);
  return { ok: false, provider, error: "UNKNOWN_PROVIDER" };
}
