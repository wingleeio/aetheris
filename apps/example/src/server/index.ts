import { createAether } from "@aether/server";
import { z } from "zod";

export const createContext = async () => ({});

export const procedure = createAether<typeof createContext>();

export const router = {
    helloWorld: procedure.handler({
        input: z.object({
            name: z.string(),
        }),
        resolve: async ({ input }) => {
            return {
                message: `Hello from Aether, ${input.name}!`,
            };
        },
    }),
};

export type Router = typeof router;
