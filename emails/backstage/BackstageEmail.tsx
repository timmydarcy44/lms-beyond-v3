import {
  Body,
  Button,
  Column,
  Head,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { backstageTheme as t } from "./theme";

export type BackstageDocCard = {
  key: string;
  title: string;
  subtitle: string;
  href: string;
  iconBg: string;
  iconLabel: string;
};

export type BackstageEmailProps = {
  preheader: string;
  trainerFirstName: string;
  dateLabel: string;
  dayPartPill: string;
  courseTitle: string;
  locationKindLabel: string;
  locationDetail: string;
  clientName: string;
  participantCount: number;
  emargerUrl: string;
  qrImageUrl: string;
  checklist: Array<{ moment: string; text: string }>;
  docs: BackstageDocCard[];
  formateurUrl: string;
  contactName: string;
  contactPhone: string | null;
  contactInitials: string;
};

export function BackstageEmail(props: BackstageEmailProps) {
  const greeting = props.trainerFirstName
    ? `Bonjour ${props.trainerFirstName}, tout est prêt pour votre session.`
    : "Bonjour, tout est prêt pour votre session.";

  const infoCells = [
    { label: props.locationKindLabel, value: props.locationDetail || "—" },
    { label: "Client", value: props.clientName },
    {
      label: "Participants",
      value: String(props.participantCount),
    },
  ];

  return (
    <Html lang="fr">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
      </Head>
      <Preview>{props.preheader}</Preview>
      <Body style={{ margin: 0, padding: 0, backgroundColor: t.page, fontFamily: t.font }}>
        <Section style={{ backgroundColor: t.page, padding: "28px 16px" }}>
          <Section
            style={{
              maxWidth: "600px",
              margin: "0 auto",
              backgroundColor: t.card,
              borderRadius: t.radius,
              overflow: "hidden",
            }}
          >
            {/* Header gradient — bgcolor fallback for Outlook */}
            <Section
              bgcolor={t.violet}
              style={{
                backgroundColor: t.violet,
                backgroundImage: `linear-gradient(135deg, ${t.violetDeep} 0%, ${t.violet} 45%, ${t.violetBright} 100%)`,
                padding: "28px 28px 24px",
              }}
            >
              <Row>
                <Column align="left" style={{ verticalAlign: "middle" }}>
                  <table role="presentation" cellPadding={0} cellSpacing={0}>
                    <tbody>
                      <tr>
                        <td
                          width={36}
                          height={36}
                          align="center"
                          valign="middle"
                          style={{
                            width: 36,
                            height: 36,
                            backgroundColor: "#FFFFFF",
                            borderRadius: 10,
                            color: t.violetDeep,
                            fontWeight: 800,
                            fontSize: 18,
                            fontFamily: t.font,
                            lineHeight: "36px",
                          }}
                        >
                          B
                        </td>
                        <td
                          style={{
                            paddingLeft: 10,
                            color: "#FFFFFF",
                            fontWeight: 700,
                            fontSize: 18,
                            fontFamily: t.font,
                          }}
                        >
                          Byound
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </Column>
                <Column align="right" style={{ verticalAlign: "middle" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "6px 12px",
                      borderRadius: 999,
                      backgroundColor: "rgba(255,255,255,0.14)",
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: t.font,
                    }}
                  >
                    <span style={{ color: t.mint }}>●</span> Byound Backstage
                  </span>
                </Column>
              </Row>

              <Text
                style={{
                  margin: "22px 0 0",
                  color: "#FFFFFF",
                  fontSize: 15,
                  lineHeight: "22px",
                  fontFamily: t.font,
                }}
              >
                {greeting}
              </Text>

              <table role="presentation" cellPadding={0} cellSpacing={0} style={{ marginTop: 10 }}>
                <tbody>
                  <tr>
                    <td
                      style={{
                        color: "#FFFFFF",
                        fontSize: 34,
                        fontWeight: 800,
                        lineHeight: "40px",
                        fontFamily: t.font,
                        paddingRight: 10,
                      }}
                    >
                      {props.dateLabel}
                    </td>
                    <td valign="middle">
                      <span
                        style={{
                          display: "inline-block",
                          backgroundColor: "#FFFFFF",
                          color: t.violetDeep,
                          borderRadius: 999,
                          padding: "6px 12px",
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: t.font,
                        }}
                      >
                        {props.dayPartPill}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>

              <Text
                style={{
                  margin: "8px 0 0",
                  color: "rgba(255,255,255,0.9)",
                  fontSize: 16,
                  lineHeight: "24px",
                  fontFamily: t.font,
                }}
              >
                {props.courseTitle}
              </Text>

              <table
                role="presentation"
                width="100%"
                cellPadding={0}
                cellSpacing={0}
                style={{ marginTop: 18 }}
              >
                <tbody>
                  <tr>
                    {infoCells.map((cell) => (
                      <td
                        key={cell.label}
                        width="33%"
                        valign="top"
                        style={{
                          paddingRight: 8,
                          backgroundColor: "rgba(0,0,0,0.18)",
                          borderRadius: 14,
                        }}
                      >
                        <div
                          style={{
                            padding: "12px 12px",
                            backgroundColor: "rgba(0,0,0,0.18)",
                            borderRadius: 14,
                          }}
                        >
                          <div
                            style={{
                              color: "rgba(255,255,255,0.65)",
                              fontSize: 11,
                              fontWeight: 600,
                              letterSpacing: "0.04em",
                              textTransform: "uppercase",
                              fontFamily: t.font,
                              marginBottom: 4,
                            }}
                          >
                            {cell.label}
                          </div>
                          <div
                            style={{
                              color: "#FFFFFF",
                              fontSize: 13,
                              lineHeight: "18px",
                              fontWeight: 600,
                              fontFamily: t.font,
                            }}
                          >
                            {cell.value}
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </Section>

            {/* Émargement */}
            <Section style={{ backgroundColor: "#F5F4F0", padding: "28px 28px 24px" }}>
              <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
                <tbody>
                  <tr>
                    <td width={120} valign="top" style={{ paddingRight: 16 }}>
                      <Img
                        src={props.qrImageUrl}
                        width={110}
                        height={110}
                        alt="QR code d'émargement"
                        style={{
                          display: "block",
                          borderRadius: 12,
                          border: `1px solid ${t.line}`,
                          backgroundColor: "#FFFFFF",
                        }}
                      />
                    </td>
                    <td valign="top">
                      <Text
                        style={{
                          margin: 0,
                          fontSize: 18,
                          fontWeight: 800,
                          color: t.ink,
                          fontFamily: t.font,
                        }}
                      >
                        Émargement de la session
                      </Text>
                      <Text
                        style={{
                          margin: "8px 0 0",
                          fontSize: 14,
                          lineHeight: "20px",
                          color: t.muted,
                          fontFamily: t.font,
                        }}
                      >
                        À ouvrir en début de séance : les participants scannent le QR code et
                        signent depuis leur téléphone.
                      </Text>
                    </td>
                  </tr>
                </tbody>
              </table>
              <Button
                href={props.emargerUrl}
                style={{
                  display: "block",
                  width: "100%",
                  boxSizing: "border-box",
                  marginTop: 18,
                  backgroundColor: t.black,
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontWeight: 700,
                  fontFamily: t.font,
                  textAlign: "center",
                  textDecoration: "none",
                  borderRadius: 14,
                  padding: "16px 20px",
                  lineHeight: "20px",
                  minHeight: 48,
                }}
              >
                Ouvrir l&apos;écran d&apos;émargement
              </Button>
            </Section>

            {/* Checklist */}
            <Section style={{ backgroundColor: t.card, padding: "28px 28px 8px" }}>
              <Text
                style={{
                  margin: "0 0 14px",
                  fontSize: 18,
                  fontWeight: 800,
                  color: t.ink,
                  fontFamily: t.font,
                }}
              >
                <span style={{ color: "#22C55E" }}>✓</span> Votre checklist du jour
              </Text>
              {props.checklist.map((item) => (
                <table
                  key={item.moment}
                  role="presentation"
                  width="100%"
                  cellPadding={0}
                  cellSpacing={0}
                  style={{ marginBottom: 14 }}
                >
                  <tbody>
                    <tr>
                      <td width={28} valign="top" style={{ paddingTop: 2 }}>
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 6,
                            border: `1.5px solid ${t.line}`,
                            backgroundColor: "#FAFAF8",
                          }}
                        />
                      </td>
                      <td>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: t.ink,
                            fontFamily: t.font,
                          }}
                        >
                          {item.moment}
                        </div>
                        <div
                          style={{
                            marginTop: 2,
                            fontSize: 14,
                            lineHeight: "20px",
                            color: t.muted,
                            fontFamily: t.font,
                          }}
                        >
                          {item.text}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ))}
            </Section>

            {/* Documents 2x2 */}
            {props.docs.length > 0 ? (
              <Section style={{ backgroundColor: t.card, padding: "12px 28px 8px" }}>
                <Text
                  style={{
                    margin: "0 0 14px",
                    fontSize: 18,
                    fontWeight: 800,
                    color: t.ink,
                    fontFamily: t.font,
                  }}
                >
                  Vos documents
                </Text>
                <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
                  <tbody>
                    {chunk(props.docs, 2).map((row, i) => (
                      <tr key={i}>
                        {row.map((doc) => (
                          <td
                            key={doc.key}
                            width="50%"
                            valign="top"
                            style={{ padding: "0 6px 12px 0" }}
                          >
                            <a href={doc.href} style={{ textDecoration: "none" }}>
                              <div
                                style={{
                                  border: `1px solid ${t.line}`,
                                  borderRadius: 16,
                                  padding: "14px 14px 12px",
                                  backgroundColor: "#FFFFFF",
                                }}
                              >
                                <div
                                  style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 8,
                                    backgroundColor: doc.iconBg,
                                    color: "#FFFFFF",
                                    fontSize: 12,
                                    fontWeight: 800,
                                    textAlign: "center",
                                    lineHeight: "28px",
                                    fontFamily: t.font,
                                    marginBottom: 10,
                                  }}
                                >
                                  {doc.iconLabel}
                                </div>
                                <div
                                  style={{
                                    fontSize: 15,
                                    fontWeight: 700,
                                    color: t.ink,
                                    fontFamily: t.font,
                                  }}
                                >
                                  {doc.title}
                                </div>
                                <div
                                  style={{
                                    marginTop: 2,
                                    fontSize: 12,
                                    color: t.quiet,
                                    fontFamily: t.font,
                                  }}
                                >
                                  {doc.subtitle}
                                </div>
                                <div
                                  style={{
                                    marginTop: 10,
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: t.violetBright,
                                    fontFamily: t.font,
                                  }}
                                >
                                  Ouvrir →
                                </div>
                              </div>
                            </a>
                          </td>
                        ))}
                        {row.length === 1 ? <td width="50%" /> : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Section>
            ) : null}

            {/* Backstage CTA */}
            <Section style={{ backgroundColor: t.card, padding: "12px 28px 24px" }}>
              <table
                role="presentation"
                width="100%"
                cellPadding={0}
                cellSpacing={0}
                style={{
                  border: `1px solid ${t.line}`,
                  borderRadius: 16,
                  backgroundColor: "#FAFAF8",
                }}
              >
                <tbody>
                  <tr>
                    <td style={{ padding: "16px 18px" }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 800,
                          color: t.ink,
                          fontFamily: t.font,
                        }}
                      >
                        Retrouvez tout dans Backstage
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 13,
                          color: t.muted,
                          fontFamily: t.font,
                          lineHeight: "18px",
                        }}
                      >
                        Votre espace formateur : sessions, émargements, évaluations.
                      </div>
                    </td>
                    <td align="right" style={{ padding: "16px 18px", whiteSpace: "nowrap" }}>
                      <Button
                        href={props.formateurUrl}
                        style={{
                          backgroundColor: t.violetBright,
                          color: "#FFFFFF",
                          fontSize: 14,
                          fontWeight: 700,
                          fontFamily: t.font,
                          textDecoration: "none",
                          borderRadius: 12,
                          padding: "12px 16px",
                          minHeight: 48,
                          lineHeight: "24px",
                        }}
                      >
                        Mon espace →
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>

            {/* Contact */}
            <Section
              style={{
                backgroundColor: t.card,
                padding: "0 28px 28px",
                borderBottomLeftRadius: t.radius,
                borderBottomRightRadius: t.radius,
              }}
            >
              <table role="presentation" cellPadding={0} cellSpacing={0}>
                <tbody>
                  <tr>
                    <td
                      width={40}
                      height={40}
                      align="center"
                      valign="middle"
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 999,
                        backgroundColor: t.violet,
                        color: "#FFFFFF",
                        fontWeight: 800,
                        fontSize: 13,
                        fontFamily: t.font,
                        lineHeight: "40px",
                      }}
                    >
                      {props.contactInitials}
                    </td>
                    <td style={{ paddingLeft: 12 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 800,
                          color: t.ink,
                          fontFamily: t.font,
                        }}
                      >
                        Un imprévu sur place ?
                      </div>
                      <div
                        style={{
                          marginTop: 2,
                          fontSize: 13,
                          color: t.muted,
                          fontFamily: t.font,
                          lineHeight: "18px",
                        }}
                      >
                        {props.contactName}
                        {props.contactPhone ? ` · ${props.contactPhone}` : ""} · répondez
                        simplement à cet e-mail.
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>
          </Section>

          <Text
            style={{
              margin: "18px 0 0",
              textAlign: "center",
              fontSize: 12,
              color: t.quiet,
              fontFamily: t.font,
              lineHeight: "18px",
            }}
          >
            Byound · byound.fr
            <br />
            Vous recevez cet e-mail car vous intervenez sur une session Byound.
          </Text>
        </Section>
      </Body>
    </Html>
  );
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default BackstageEmail;
