import { createAether } from "@aether/server";
import { z } from "zod";

export const createContext = async () => ({});

export const a = createAether<typeof createContext>();

export const router = a.router({
    helloWorld: a.procedure.handler({
        input: z.object({
            name: z.string(),
        }),
        resolve: async ({ input }) => {
            return {
                message: `Hello from Aether, ${input.name}!`,
            };
        },
    }),
});

export type Router = typeof router;
