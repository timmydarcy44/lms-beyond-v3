import { NextResponse } from "next/server";

export function publicJson(body: unknown, status = 200) {
  const response = NextResponse.json(body, { status });
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Accept");
  response.headers.set("Cache-Control", "public, max-age=60, s-maxage=60");
  response.headers.set("Content-Type", "application/json; charset=utf-8");
  return response;
}

export function publicCorsPreflight() {
  return publicJson(null, 204);
}
