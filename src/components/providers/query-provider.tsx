"use client";

import {
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from "@tanstack/react-query";
import { useState } from "react";

const defaultConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
};

export const QueryProvider = ({ children }: { children: React.ReactNode }) => {
  const [client] = useState(() => new QueryClient(defaultConfig));

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};










