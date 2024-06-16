import { createContext, router } from "@/server";
import { createNextHandler } from "@aether/server/adapters/next";

const handler = createNextHandler({
    router,
    createContext,
    prefix: "/api",
});

export const POST = handler;
