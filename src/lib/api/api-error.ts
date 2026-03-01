import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "INVALID_JSON"
  | "INVALID_PAYLOAD"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "SUPABASE"
  | "INTERNAL";

export const jsonError = (
  code: ApiErrorCode,
  status: number,
  errorId: string,
  payload: Record<string, unknown> = {},
) => {
  return NextResponse.json(
    {
      ok: false,
      error: code,
      errorId,
      ...payload,
    },
    { status },
  );
};
