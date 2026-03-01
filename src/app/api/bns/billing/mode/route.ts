import { NextResponse } from "next/server";

import { getBillingMode, isMockBilling } from "@/lib/env/bns-billing-env";

export async function GET() {
  return NextResponse.json({ mode: getBillingMode(), isMock: isMockBilling() });
}

