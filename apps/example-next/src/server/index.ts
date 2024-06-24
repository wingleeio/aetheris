import { createAetheris, router } from "@aetheris/server";

import { z } from "zod";

export const createContext = async () => ({});

export const aether = createAetheris<typeof createContext>();

export const app = router({
    helloWorld: aether.handler({
        input: z.object({
            name: z.string(),
        }),
        resolve: async ({ input }) => {
            return {
                message: `Hello from Aetheris, ${input.name}!`,
            };
        },
    }),
    counter: aether.subscription({
        input: z.number(),
        output: z.string(),
        resolve: async ({ emit, input }) => {
            let count = 1;
            const interval = setInterval(() => {
                emit(`Sent ${count++} messages!`);
            }, input);
            return () => {
                clearInterval(interval);
            };
        },
    }),
});

export type App = typeof app;
