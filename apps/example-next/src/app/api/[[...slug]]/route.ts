import { app } from "@/server";
import { createNextHandler } from "@aetheris/server/adapters/next";

const handler = createNextHandler({
    app,
    prefix: "/api",
});

export const POST = handler;
