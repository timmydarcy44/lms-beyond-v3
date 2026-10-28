import { describe, expect, it } from "vitest";
import {
  careAbsoluteUrl,
  careAppToPublicPath,
  carePublicToAppPath,
  isByoundCareHostname,
  requestHost,
  toCareHref,
} from "../host";

describe("care host paths", () => {
  it("maps internal /care routes to public URLs", () => {
    expect(careAppToPublicPath("/care")).toBe("/");
    expect(careAppToPublicPath("/care/praticiens/lea")).toBe("/praticiens/lea");
    expect(carePublicToAppPath("/praticiens")).toBe("/care/praticiens");
    expect(isByoundCareHostname("www.byoundcare.fr")).toBe(true);
    expect(requestHost({ headers: { get: (name) => (name === "x-forwarded-host" ? "byoundcare.fr" : null) } })).toBe(
      "byoundcare.fr",
    );
  });

  it("rewrites in-app hrefs on the Care domain", () => {
    expect(toCareHref("/care/praticiens", true)).toBe("/praticiens");
    expect(toCareHref("/care#methode", true)).toBe("/#methode");
    expect(toCareHref("/care/praticiens", false)).toBe("/care/praticiens");
    expect(careAbsoluteUrl("/care/reservation/abc?token=x")).toBe(
      "https://byoundcare.fr/reservation/abc?token=x",
    );
  });
});
