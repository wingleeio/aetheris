import { createAetheris } from "@aetheris/server";
import { z } from "zod";

export const createContext = async () => ({});

export const a = createAetheris<typeof createContext>();

export const router = a.router({
    helloWorld: a.procedure.handler({
        input: z.object({
            name: z.string(),
        }),
        resolve: async ({ input }) => {
            return {
                message: `Hello from Aetheris, ${input.name}!`,
            };
        },
    }),
});

export type Router = typeof router;
