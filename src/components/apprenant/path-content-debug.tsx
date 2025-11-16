"use client";

import { useEffect } from "react";

export function PathContentDebug({ pathContent }: { pathContent: any }) {
  useEffect(() => {
    console.log("[CLIENT] PathContentDebug mounted", {
      pathContentExists: !!pathContent,
      courses: pathContent?.courses?.length ?? 0,
      tests: pathContent?.tests?.length ?? 0,
      resources: pathContent?.resources?.length ?? 0,
      fullPathContent: pathContent,
    });
  }, [pathContent]);

  return null;
}



