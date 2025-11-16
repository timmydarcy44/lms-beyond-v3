"use client";

import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";

type AdminSidebarWrapperProps = {
  organizationLogo?: string | null;
};

export function AdminSidebarWrapper({ organizationLogo }: AdminSidebarWrapperProps) {
  const [open, setOpen] = useState(true);

  return <AdminSidebar open={open} onToggle={() => setOpen(!open)} organizationLogo={organizationLogo} />;
}

