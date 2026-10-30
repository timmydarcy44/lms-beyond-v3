import { careTheme } from "./theme";

export function InfoBox({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ marginTop: "16px" }}>
      <tbody>
        <tr>
          <td
            bgcolor={careTheme.panel}
            style={{
              backgroundColor: careTheme.panel,
              borderRadius: "18px",
              padding: "16px 18px",
              fontFamily: careTheme.font,
            }}
          >
            <p style={{ margin: "0 0 8px", color: careTheme.ink, fontSize: "13px", fontWeight: 800, lineHeight: "18px" }}>{title}</p>
            {items.map((item) => (
              <p key={item} style={{ margin: "0 0 6px", color: careTheme.body, fontSize: "13px", lineHeight: "18px" }}>
                <span style={{ color: careTheme.berry }}>· </span>
                {item}
              </p>
            ))}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
