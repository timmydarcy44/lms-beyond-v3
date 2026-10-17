"use client";
import { Suspense } from "react";
import { SalariesDirectory } from "@/components/enterprise/salaries-directory";

export default function SalariesPage() {
  return <Suspense fallback={<div className="min-h-screen bg-white" />}><SalariesDirectory /></Suspense>;
}
