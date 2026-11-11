import { Body, Button, Head, Html, Preview, Section, Text } from "@react-email/components";
import { backstageTheme as t } from "./theme";

export type BackstageReminderEmailProps = {
  preheader: string;
  dateLine: string;
  emargerUrl: string;
  contactName: string;
  contactPhone: string | null;
};

export function BackstageReminderEmail(props: BackstageReminderEmailProps) {
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
            <Section
              bgcolor={t.violet}
              style={{
                backgroundColor: t.violet,
                backgroundImage: `linear-gradient(135deg, ${t.violetDeep} 0%, ${t.violet} 45%, ${t.violetBright} 100%)`,
                padding: "24px 28px",
              }}
            >
              <Text
                style={{
                  margin: 0,
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  fontFamily: t.font,
                }}
              >
                ● Byound Backstage · rappel
              </Text>
              <Text
                style={{
                  margin: "10px 0 0",
                  color: "#FFFFFF",
                  fontSize: 20,
                  fontWeight: 800,
                  lineHeight: "28px",
                  fontFamily: t.font,
                }}
              >
                {props.dateLine}
              </Text>
            </Section>

            <Section style={{ padding: "28px" }}>
              <Button
                href={props.emargerUrl}
                style={{
                  display: "block",
                  width: "100%",
                  boxSizing: "border-box",
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

              <Text
                style={{
                  margin: "22px 0 0",
                  fontSize: 14,
                  fontWeight: 800,
                  color: t.ink,
                  fontFamily: t.font,
                }}
              >
                Un imprévu sur place ?
              </Text>
              <Text
                style={{
                  margin: "4px 0 0",
                  fontSize: 13,
                  color: t.muted,
                  fontFamily: t.font,
                  lineHeight: "18px",
                }}
              >
                {props.contactName}
                {props.contactPhone ? ` · ${props.contactPhone}` : ""} · répondez simplement à
                cet e-mail.
              </Text>
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
          </Text>
        </Section>
      </Body>
    </Html>
  );
}

export default BackstageReminderEmail;
