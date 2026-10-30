import { careTheme, type AppointmentCardModel } from "./theme";

export function AppointmentCard(card: AppointmentCardModel) {
  const cancelled = card.variant === "cancelled";
  const dateBg = cancelled ? careTheme.buttonLine : careTheme.berry;
  const dateColor = cancelled ? careTheme.muted : "#FFFFFF";
  const timeColor = cancelled ? careTheme.faint : careTheme.ink;
  const border = card.variant === "reminder" ? "1px solid #F2C6D8" : `1px solid ${careTheme.line}`;
  return (
    <table role="presentation" width="100%" cellPadding={0} cellSpacing={0} style={{ marginTop: "18px", opacity: cancelled ? 0.7 : 1 }}>
      <tbody>
        <tr>
          <td
            bgcolor={careTheme.card}
            style={{
              backgroundColor: careTheme.card,
              border,
              borderRadius: "22px",
              padding: "18px",
            }}
          >
            <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  <td width={58} valign="top">
                    <table role="presentation" cellPadding={0} cellSpacing={0}>
                      <tbody>
                        <tr>
                          <td
                            width={58}
                            height={64}
                            align="center"
                            valign="middle"
                            bgcolor={dateBg}
                            style={{
                              width: "58px",
                              height: "64px",
                              backgroundColor: dateBg,
                              borderRadius: "16px",
                              color: dateColor,
                              fontFamily: careTheme.font,
                            }}
                          >
                            <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.04em", lineHeight: "14px" }}>{card.weekday}</div>
                            <div style={{ fontSize: "24px", fontWeight: 800, lineHeight: "26px" }}>{card.day}</div>
                            <div style={{ fontSize: "12px", lineHeight: "14px" }}>{card.month}</div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                  <td valign="middle" style={{ paddingLeft: "14px" }}>
                    <p
                      style={{
                        margin: 0,
                        color: timeColor,
                        fontFamily: careTheme.font,
                        fontSize: "22px",
                        fontWeight: 800,
                        letterSpacing: "-0.4px",
                        lineHeight: "26px",
                        textDecoration: cancelled ? "line-through" : "none",
                      }}
                    >
                      {card.timeRange}
                    </p>
                    <p style={{ margin: "4px 0 0", color: careTheme.muted, fontFamily: careTheme.font, fontSize: "13px", lineHeight: "18px" }}>
                      {card.serviceLine}
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>
            <div style={{ borderTop: `1px solid ${careTheme.line}`, margin: "14px 0" }} />
            <PersonRow name={card.practitionerName} role={card.practitionerRole} initials={card.initials} avatarUrl={card.avatarUrl} />
            <div style={{ height: "12px", lineHeight: "12px" }}>&nbsp;</div>
            <PlaceRow title={card.placeTitle} detail={card.placeDetail} mapsUrl={cancelled ? null : card.mapsUrl} />
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function PersonRow({
  name,
  role,
  initials,
  avatarUrl,
}: {
  name: string;
  role: string;
  initials: string;
  avatarUrl: string | null;
}) {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0}>
      <tbody>
        <tr>
          <td width={40} valign="middle">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" width={40} height={40} style={{ display: "block", width: "40px", height: "40px", borderRadius: "20px", objectFit: "cover" }} />
            ) : (
              <table role="presentation" cellPadding={0} cellSpacing={0}>
                <tbody>
                  <tr>
                    <td
                      width={40}
                      height={40}
                      align="center"
                      valign="middle"
                      bgcolor={careTheme.blush}
                      style={{
                        width: "40px",
                        height: "40px",
                        backgroundColor: careTheme.blush,
                        borderRadius: "20px",
                        color: careTheme.berryDark,
                        fontFamily: careTheme.font,
                        fontSize: "13px",
                        fontWeight: 800,
                      }}
                    >
                      {initials}
                    </td>
                  </tr>
                </tbody>
              </table>
            )}
          </td>
          <td valign="middle" style={{ paddingLeft: "12px", fontFamily: careTheme.font }}>
            <p style={{ margin: 0, color: careTheme.ink, fontSize: "14px", fontWeight: 800, lineHeight: "18px" }}>{name}</p>
            <p style={{ margin: "2px 0 0", color: careTheme.muted, fontSize: "13px", lineHeight: "16px" }}>{role}</p>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function PlaceRow({ title, detail, mapsUrl }: { title: string; detail: string | null; mapsUrl: string | null }) {
  return (
    <table role="presentation" cellPadding={0} cellSpacing={0}>
      <tbody>
        <tr>
          <td width={40} valign="top">
            <table role="presentation" cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  <td
                    width={40}
                    height={40}
                    align="center"
                    valign="middle"
                    bgcolor={careTheme.place}
                    style={{
                      width: "40px",
                      height: "40px",
                      backgroundColor: careTheme.place,
                      borderRadius: "20px",
                      color: careTheme.muted,
                      fontFamily: careTheme.font,
                      fontSize: "16px",
                    }}
                  >
                    ⌖
                  </td>
                </tr>
              </tbody>
            </table>
          </td>
          <td valign="middle" style={{ paddingLeft: "12px", fontFamily: careTheme.font }}>
            <p style={{ margin: 0, color: careTheme.ink, fontSize: "14px", fontWeight: 800, lineHeight: "18px" }}>{title}</p>
            {detail ? <p style={{ margin: "2px 0 0", color: careTheme.muted, fontSize: "13px", lineHeight: "18px" }}>{detail}</p> : null}
            {mapsUrl ? (
              <p style={{ margin: "4px 0 0", fontSize: "13px", lineHeight: "18px" }}>
                <a href={mapsUrl} style={{ color: careTheme.berry, fontWeight: 800, textDecoration: "none" }}>
                  Itinéraire ›
                </a>
              </p>
            ) : null}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
