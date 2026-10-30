import { careTheme, type CareBadgeKind } from "./theme";

const BADGES: Record<CareBadgeKind, { label: string; background: string; color: string }> = {
  confirmed: { label: "✓ Confirmé", background: "#E3F6EC", color: "#126B3B" },
  reminder: { label: "Demain", background: careTheme.blush, color: careTheme.berryDark },
  cancelled: { label: "Annulé", background: careTheme.place, color: careTheme.muted },
  moved: { label: "Déplacé", background: "#FFF1DC", color: "#9A5B00" },
  document: { label: "Nouveau document", background: "#EDE9FB", color: "#4B3BB5" },
};

export function StatusBadge({ kind }: { kind: CareBadgeKind }) {
  const badge = BADGES[kind];
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0}>
      <tbody>
        <tr>
          <td
            bgcolor={badge.background}
            style={{
              backgroundColor: badge.background,
              color: badge.color,
              fontFamily: careTheme.font,
              fontSize: "12px",
              fontWeight: 800,
              lineHeight: "16px",
              borderRadius: "999px",
              padding: "6px 10px",
            }}
          >
            {badge.label}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
