"use client";

import { api } from "@/lib/api";
import { createAetherisReact } from "@aetheris/react-query";

export const { AetherisProvider, client, useAetherisContext } = createAetherisReact(api);
