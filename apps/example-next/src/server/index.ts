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
            const count = cookies.get("count") || 0;
            return {
                message: `Hello from Aetheris, ${input.name}! The count is ${count}.`,
            };
        },
    }),
    addCount: aether.handler({
        input: z.number(),
        resolve: async ({ input, cookies }) => {
            const count = Number(cookies.get("count") || 0);
            cookies.set("count", (count + input).toString(), {
                httpOnly: true,
                path: "/",
            });
        },
    }),
});

export type App = typeof app;
