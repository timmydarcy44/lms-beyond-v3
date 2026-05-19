"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function OpenCourseButton({ courseId }: { courseId: string }) {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.push(`/dashboard/formateur/formations/${courseId}`)}
    >
      Ouvrir
    </Button>
  );
}

