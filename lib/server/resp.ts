import { NextResponse } from "next/server";

export function ok<T>(data: T, init: number | ResponseInit = 200) {
  return NextResponse.json({ ok: true, data }, typeof init === "number" ? { status: init } : init);
}

export function bad(message = "BAD_REQUEST", status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export function unAuth(message = "UNAUTH") { 
  return bad(message, 401); 
}

export function notFound(message = "NOT_FOUND") { 
  return bad(message, 404); 
}

export function serverErr(message = "SERVER_ERROR") { 
  return bad(message, 500); 
}
