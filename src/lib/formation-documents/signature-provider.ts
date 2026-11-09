/**
 * Abstraction signature — aujourd'hui acceptation simple (case + nom).
 * Brancher Yousign (ou équivalent) plus tard sans refaire le flux métier.
 */

export type SignatureMethod = "simple_checkbox" | "email_otp" | "yousign";

export type SignatureAcceptanceInput = {
  documentId: string;
  acceptToken: string;
  signerName: string;
  signerRole?: string | null;
  cgvAccepted: boolean;
  cgvVersion: string;
  ip?: string | null;
  userAgent?: string | null;
};

export type SignatureAcceptanceResult = {
  method: SignatureMethod;
  signedAt: string;
  evidence: {
    signer_name: string;
    signer_role: string | null;
    accepted_ip: string | null;
    accepted_user_agent: string | null;
    cgv_version: string;
    pdf_content_hash?: string | null;
  };
};

export interface SignatureProvider {
  readonly method: SignatureMethod;
  accept(input: SignatureAcceptanceInput): Promise<SignatureAcceptanceResult>;
}

/** Provider actuel — validation locale, pas d'appel externe. */
export class SimpleCheckboxSignatureProvider implements SignatureProvider {
  readonly method: SignatureMethod = "simple_checkbox";

  async accept(input: SignatureAcceptanceInput): Promise<SignatureAcceptanceResult> {
    const name = String(input.signerName || "").trim();
    if (!name) throw new Error("Nom du signataire requis");
    if (!input.cgvAccepted) throw new Error("Acceptation des CGV requise");
    if (!input.acceptToken) throw new Error("Jeton d'acceptation manquant");

    return {
      method: this.method,
      signedAt: new Date().toISOString(),
      evidence: {
        signer_name: name,
        signer_role: input.signerRole?.trim() || null,
        accepted_ip: input.ip?.trim() || null,
        accepted_user_agent: input.userAgent?.trim() || null,
        cgv_version: input.cgvVersion,
      },
    };
  }
}

/** Stub — à brancher quand Yousign sera intégré. */
export class YousignSignatureProvider implements SignatureProvider {
  readonly method: SignatureMethod = "yousign";

  async accept(_input: SignatureAcceptanceInput): Promise<SignatureAcceptanceResult> {
    throw new Error("Signature Yousign non configurée");
  }
}

export function getDefaultSignatureProvider(): SignatureProvider {
  return new SimpleCheckboxSignatureProvider();
}
