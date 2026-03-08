import { NextResponse } from "next/server";

export async function GET() {
  const classement = [
    { pos: 1, club: "US Alençon", pts: 52, j: 22, v: 16, n: 4, d: 2, bp: 48, bc: 18, diff: "+30" },
    { pos: 2, club: "FC Lisieux", pts: 45, j: 22, v: 13, n: 6, d: 3, bp: 38, bc: 22, diff: "+16" },
    {
      pos: 3,
      club: "SU Dives Cabourg",
      pts: 41,
      j: 22,
      v: 12,
      n: 5,
      d: 5,
      bp: 35,
      bc: 24,
      diff: "+11",
      isClub: true,
    },
    { pos: 4, club: "SO Caennais", pts: 38, j: 22, v: 11, n: 5, d: 6, bp: 33, bc: 28, diff: "+5" },
    { pos: 5, club: "AS Hérouville", pts: 35, j: 22, v: 10, n: 5, d: 7, bp: 31, bc: 30, diff: "+1" },
    { pos: 6, club: "FC Bayeux", pts: 32, j: 22, v: 9, n: 5, d: 8, bp: 28, bc: 32, diff: "-4" },
    { pos: 7, club: "US Vire", pts: 29, j: 22, v: 8, n: 5, d: 9, bp: 26, bc: 34, diff: "-8" },
    { pos: 8, club: "FC Flers", pts: 26, j: 22, v: 7, n: 5, d: 10, bp: 24, bc: 36, diff: "-12" },
    { pos: 9, club: "Caen B", pts: 23, j: 22, v: 6, n: 5, d: 11, bp: 22, bc: 38, diff: "-16" },
    { pos: 10, club: "FC Avranches B", pts: 20, j: 22, v: 5, n: 5, d: 12, bp: 19, bc: 40, diff: "-21" },
    { pos: 11, club: "ES Falaise", pts: 17, j: 22, v: 4, n: 5, d: 13, bp: 16, bc: 42, diff: "-26" },
    { pos: 12, club: "FC Cherbourg B", pts: 14, j: 22, v: 3, n: 5, d: 14, bp: 13, bc: 44, diff: "-31" },
    {
      pos: 13,
      club: "US Granville B",
      pts: 11,
      j: 22,
      v: 2,
      n: 5,
      d: 15,
      bp: 10,
      bc: 46,
      diff: "-36",
      relegate: true,
    },
    {
      pos: 14,
      club: "FC Coutances",
      pts: 8,
      j: 22,
      v: 1,
      n: 5,
      d: 16,
      bp: 8,
      bc: 48,
      diff: "-40",
      relegate: true,
    },
  ];

  return NextResponse.json({
    classement,
    updatedAt: new Date().toISOString(),
    groupe: "N3 — Normandie",
    source: "mock",
  });
}
