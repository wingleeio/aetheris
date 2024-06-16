import { createAether } from "@aether/server";

export const createContext = async () => ({});

export const aether = createAether<typeof createContext>();

export const procedure = aether;

export const router = {
    helloWorld: procedure.handler({
        resolve: async () => {
            return {
                message: `Hello from Aether!`,
            };
        },
    }),
};

export type Router = typeof router;
