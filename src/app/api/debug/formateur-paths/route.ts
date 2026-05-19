import { NextResponse } from "next/server";
import { getFormateurPaths } from "@/lib/queries/formateur";

export async function GET() {
  try {
    const paths = await getFormateurPaths();
    return NextResponse.json({
      count: Array.isArray(paths) ? paths.length : null,
      sample: Array.isArray(paths)
        ? paths.slice(0, 5).map((p: any) => ({
            id: p.id,
            title: p.title,
            status: p.status,
          }))
        : null,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "debug failed", details: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    );
  }
}

