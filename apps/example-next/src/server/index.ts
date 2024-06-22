import { createAetheris, router } from "@aetheris/server";

import { z } from "zod";

export const createContext = async () => ({});

export const aether = createAetheris<typeof createContext>();

export const app = router({
    helloWorld: aether.handler({
        input: z.object({
            name: z.string(),
        }),
        resolve: async ({ input, cookies }) => {
            console.log(cookies.get("random"));
            return {
                message: `Hello from Aetheris, ${input.name}!`,
            };
        },
    }),
});

export type App = typeof app;
