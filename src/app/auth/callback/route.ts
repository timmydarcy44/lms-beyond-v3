import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.redirect(new URL("/", "https://www.beyond-noschool.fr"));
}
