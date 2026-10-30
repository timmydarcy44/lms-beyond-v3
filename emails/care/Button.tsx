import { careTheme } from "./theme";

export function CareButton({
  href,
  label,
  tone,
}: {
  href: string;
  label: string;
  tone: "primary" | "secondary" | "dark";
}) {
  const background = tone === "primary" ? careTheme.berry : tone === "dark" ? careTheme.ink : careTheme.card;
  const color = tone === "secondary" ? careTheme.ink : "#FFFFFF";
  const border = tone === "secondary" ? `1.5px solid ${careTheme.buttonLine}` : "0";
  const height = tone === "primary" ? 54 : 50;
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ marginTop: "10px" }}>
      <tbody>
        <tr>
          <td
            align="center"
            bgcolor={background}
            height={height}
            style={{
              backgroundColor: background,
              border,
              borderRadius: "999px",
              height: `${height}px`,
            }}
          >
            <a
              href={href}
              style={{
                display: "block",
                padding: tone === "primary" ? "18px 16px" : "16px 16px",
                color,
                fontFamily: careTheme.font,
                fontSize: "15px",
                fontWeight: 800,
                lineHeight: "18px",
                textAlign: "center",
                textDecoration: "none",
              }}
            >
              {label}
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
