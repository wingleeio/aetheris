"use client";

import { api } from "@/lib/api";
import { createAetherisReact } from "@aetheris/react-query";
import { QueryClient } from "@tanstack/react-query";
import { useState } from "react";

export const { AetherisProvider, client, useAetherisContext } = createAetherisReact(api);

export const ClientProvider = ({ children }: { children: React.ReactNode }) => {
    const [queryClient] = useState(() => new QueryClient());
    return <AetherisProvider queryClient={queryClient}>{children}</AetherisProvider>;
};
