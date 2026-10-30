import { Body, Head, Html, Preview } from "@react-email/components";
import type { ReactNode } from "react";
import { careTheme } from "./theme";

const fontLink =
  "https://fonts.googleapis.com/css2?family=Inter:wght@500&family=Manrope:wght@500;800&display=swap";

export function CareLayout({ preheader, children }: { preheader: string; children: ReactNode }) {
  return (
    <Html lang="fr">
      <Head>
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light" />
        <link href={fontLink} rel="stylesheet" />
      </Head>
      <Preview>{preheader}</Preview>
      <Body style={{ margin: 0, padding: 0, backgroundColor: careTheme.canvas }}>
        <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} bgcolor={careTheme.canvas} style={{ backgroundColor: careTheme.canvas }}>
          <tbody>
            <tr>
              <td align="center" bgcolor={careTheme.canvas} style={{ backgroundColor: careTheme.canvas, padding: "28px 24px" }}>
                <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ maxWidth: "560px" }} bgcolor={careTheme.canvas}>
                  <tbody>
                    <tr>
                      <td bgcolor={careTheme.canvas} style={{ backgroundColor: careTheme.canvas, padding: "0 0 22px" }}>
                        <table role="presentation" cellPadding={0} cellSpacing={0}>
                          <tbody>
                            <tr>
                              <td
                                width={34}
                                height={34}
                                align="center"
                                valign="middle"
                                bgcolor={careTheme.berry}
                                style={{
                                  width: "34px",
                                  height: "34px",
                                  backgroundColor: careTheme.berry,
                                  borderRadius: "10px",
                                  color: "#FFFFFF",
                                  fontFamily: careTheme.font,
                                  fontSize: "18px",
                                  fontWeight: 800,
                                  lineHeight: "34px",
                                }}
                              >
                                B
                              </td>
                              <td style={{ paddingLeft: "10px", fontFamily: careTheme.font, fontSize: "18px", lineHeight: "22px" }}>
                                <span style={{ color: careTheme.berry, fontWeight: 800 }}>Byound</span>
                                <span style={{ color: careTheme.ink, fontFamily: careTheme.care, fontWeight: 500 }}> Care</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </td>
                    </tr>
                    <tr>
                      <td bgcolor={careTheme.canvas} style={{ backgroundColor: careTheme.canvas }}>
                        {children}
                      </td>
                    </tr>
                    <tr>
                      <td
                        bgcolor={careTheme.canvas}
                        style={{
                          backgroundColor: careTheme.canvas,
                          borderTop: `1px solid ${careTheme.line}`,
                          paddingTop: "18px",
                          fontFamily: careTheme.font,
                          fontSize: "12px",
                          lineHeight: "18px",
                          color: careTheme.quiet,
                        }}
                      >
                        Byound Care · Caen · Cet email ne contient aucune information sur le contenu de votre accompagnement.{" "}
                        <a href="https://byoundcare.fr/dashboard/patient" style={{ color: careTheme.quiet, textDecoration: "underline" }}>
                          Gérer mes préférences
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  );
}
