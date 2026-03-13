"use client";

import { useState } from "react";
import Link from "next/link";

const TYPE_OPTIONS = [
  {
    value: "cfa",
    label: "CFA / Organisme de formation",
    color: "#32B4FF",
    colorLight: "rgba(50,180,255,0.1)",
    icon: "🎓",
    desc: "Beyond for Education",
  },
  {
    value: "entreprise",
    label: "Entreprise / RH",
    color: "#FF9B20",
    colorLight: "rgba(255,155,32,0.1)",
    icon: "💼",
    desc: "Beyond for Business",
  },
  {
    value: "club",
    label: "Club sportif",
    color: "#50DC64",
    colorLight: "rgba(80,220,100,0.1)",
    icon: "⚽",
    desc: "Beyond for Club",
  },
  {
    value: "autre",
    label: "Autre",
    color: "#ffffff",
    colorLight: "rgba(255,255,255,0.06)",
    icon: "✦",
    desc: "On trouvera ensemble",
  },
];

const FIELDS = [
  {
    name: "nom",
    label: "Nom et prénom",
    type: "text",
    required: true,
    placeholder: "Jean Dupont",
  },
  {
    name: "structure",
    label: "Nom de votre structure",
    type: "text",
    required: true,
    placeholder: "CFA Normandie, FC Caen...",
  },
  {
    name: "email",
    label: "Email professionnel",
    type: "email",
    required: true,
    placeholder: "jean@structure.fr",
  },
  {
    name: "telephone",
    label: "Téléphone (optionnel)",
    type: "tel",
    required: false,
    placeholder: "06 00 00 00 00",
  },
];

type FormState = {
  nom: string;
  email: string;
  telephone: string;
  structure: string;
  type_structure: string;
  message: string;
};

export default function DemoPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>({
    nom: "",
    email: "",
    telephone: "",
    structure: "",
    type_structure: "",
    message: "",
  });

  const selectedType = TYPE_OPTIONS.find((t) => t.value === form.type_structure);
  const accentColor = selectedType?.color || "rgba(255,255,255,0.6)";
  const accentLight = selectedType?.colorLight || "rgba(255,255,255,0.04)";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const isValid =
    form.nom && form.email && form.structure && form.type_structure;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        setError(
          "Une erreur est survenue. Réessayez ou écrivez-nous directement."
        );
      }
    } catch {
      setError(
        "Une erreur est survenue. Réessayez ou écrivez-nous directement."
      );
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: "14px 16px",
    color: "#fff",
    fontSize: 15,
    outline: "none",
    boxSizing: "border-box" as const,
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  };

  return (
    <div
      style={{
        background: "#060608",
        minHeight: "100vh",
        color: "#fff",
        fontFamily: "-apple-system, 'SF Pro Display', sans-serif",
      }}
    >
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: "rgba(6,6,8,0.95)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
        }}
      >
        <Link
          href="/landing"
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: "#fff",
            textDecoration: "none",
            letterSpacing: "-0.02em",
          }}
        >
          Beyond
        </Link>
        <Link
          href="/landing"
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.35)",
            textDecoration: "none",
          }}
        >
          ← Retour
        </Link>
      </nav>

      <div
        style={{
          maxWidth: 1040,
          margin: "0 auto",
          padding: "72px 24px 120px",
          display: "grid",
          gridTemplateColumns: "minmax(260px, 360px) 1fr",
          gap: 48,
        }}
      >
        <div style={{ alignSelf: "start" }}>
          <h1
            style={{
              fontSize: "clamp(26px, 3vw, 36px)",
              fontWeight: 900,
              lineHeight: 1.2,
              letterSpacing: "-0.02em",
              margin: "0 0 16px",
            }}
          >
            On vous montre Beyond
            <br />
            en 30 minutes chrono.
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.35)",
              fontSize: 14,
              lineHeight: 1.7,
              fontWeight: 300,
            }}
          >
            Démo personnalisée selon votre structure.
            <br />
            Sans engagement.
          </p>
        </div>

        <div>
          {success ? (
            <div style={{ textAlign: "left" }}>
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "rgba(80,220,100,0.15)",
                  border: "1px solid rgba(80,220,100,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 28,
                  marginBottom: 24,
                }}
              >
                ✓
              </div>
              <h2
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  marginBottom: 12,
                  letterSpacing: "-0.02em",
                }}
              >
                C&apos;est noté.
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: 15,
                  lineHeight: 1.7,
                  marginBottom: 8,
                  fontWeight: 300,
                }}
              >
                Je vous recontacte dans les 24h pour planifier votre démo
                personnalisée.
              </p>
              <p
                style={{
                  color: "rgba(255,255,255,0.2)",
                  fontSize: 13,
                  marginBottom: 32,
                }}
              >
                Un email de confirmation vous a été envoyé.
              </p>
              <Link
                href="/landing"
                style={{
                  background: "#fff",
                  color: "#000",
                  borderRadius: 50,
                  padding: "10px 24px",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                Retour à l&apos;accueil
              </Link>
            </div>
          ) : step === 0 ? (
            <div>
              <div style={{ marginBottom: 20 }}>
                <p
                  style={{
                    fontSize: 11,
                    letterSpacing: "0.35em",
                    color: "rgba(255,255,255,0.2)",
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  Vous êtes...
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        type_structure: opt.value,
                      }));
                      setStep(1);
                    }}
                    style={{
                      padding: "16px",
                      borderRadius: 14,
                      border: `1px solid ${
                        form.type_structure === opt.value
                          ? opt.color
                          : "rgba(255,255,255,0.08)"
                      }`,
                      background:
                        form.type_structure === opt.value
                          ? opt.colorLight
                          : "rgba(255,255,255,0.02)",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s",
                      boxShadow:
                        form.type_structure === opt.value
                          ? `0 4px 20px ${opt.color}25`
                          : "none",
                    }}
                  >
                    <div style={{ fontSize: 24, marginBottom: 8 }}>{opt.icon}</div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color:
                          form.type_structure === opt.value
                            ? opt.color
                            : "rgba(255,255,255,0.8)",
                        marginBottom: 3,
                        lineHeight: 1.3,
                      }}
                    >
                      {opt.label}
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
                      {opt.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  marginBottom: 14,
                }}
              >
                {FIELDS.map((field) => (
                  <div key={field.name}>
                    <label
                      style={{
                        fontSize: 11,
                        color: "rgba(255,255,255,0.35)",
                        textTransform: "uppercase",
                        letterSpacing: "0.2em",
                        display: "block",
                        marginBottom: 8,
                      }}
                    >
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      name={field.name}
                      value={form[field.name as keyof FormState]}
                      onChange={handleChange}
                      placeholder={field.placeholder}
                      style={inputStyle}
                      onFocus={(e) => {
                        e.target.style.borderColor = accentColor;
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = "rgba(255,255,255,0.1)";
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 32 }}>
                <label
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,0.35)",
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Votre contexte (optionnel)
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows={3}
                  placeholder={`Ex : on a 80 apprenants \nen alternance, on cherche à automatiser \nle suivi tuteur...`}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    lineHeight: 1.6,
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = accentColor;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(255,255,255,0.1)";
                  }}
                />
              </div>

              {error && (
                <div
                  style={{
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.3)",
                    borderRadius: 10,
                    padding: "12px 16px",
                    fontSize: 13,
                    color: "#ef4444",
                    marginBottom: 16,
                  }}
                >
                  {error}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!isValid || loading}
                style={{
                  width: "100%",
                  background: !isValid ? "rgba(255,255,255,0.06)" : accentColor,
                  color: !isValid ? "rgba(255,255,255,0.2)" : "#000",
                  border: "none",
                  borderRadius: 50,
                  padding: "16px",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: !isValid || loading ? "not-allowed" : "pointer",
                  transition: "all 0.25s",
                  boxShadow: !isValid ? "none" : `0 8px 32px ${accentColor}40`,
                  fontFamily: "inherit",
                }}
              >
                {loading ? "Envoi en cours..." : "Demander ma démo →"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
