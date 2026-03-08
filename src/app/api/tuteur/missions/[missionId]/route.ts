import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ missionId: string }> }
) {
  const { missionId } = await params;

  // TODO: fetch mission depuis Supabase
  return NextResponse.json({
    id: missionId,
    message: "Mission endpoint",
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ missionId: string }> }
) {
  const { missionId } = await params;
  await request.json();

  // TODO: update mission dans Supabase
  return NextResponse.json({
    id: missionId,
    updated: true,
  });
}
