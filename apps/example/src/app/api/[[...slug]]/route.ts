import { createNextHandler } from "@aetheris/server/adapters/next";
import { router } from "@/server";

const handler = createNextHandler({
    router,
    prefix: "/api",
});

export const POST = handler;
