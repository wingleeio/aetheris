import { createClient, loggerLink, wsLink } from "@aetheris/client";
import { createAetheris, router } from "@aetheris/server";

import { createHTTPHandler } from "@aetheris/server/adapters/http";
import { applyWSSHandler } from "@aetheris/server/adapters/ws";
import { createServer } from "http";
import pino from "pino";
import WebSocket from "ws";
import { z } from "zod";

const logger = pino({
    transport: {
        target: "pino-pretty",
    },
});

const createContext = () => ({ logger });

const aether = createAetheris<typeof createContext>();

const withLogger = aether.use(({ logger, path }) => {
    logger.info(path + " Request received");
});

export const app = router({
    helloWorld: withLogger.handler({
        input: z.object({
            name: z.string(),
        }),
        resolve: async ({ input }) => {
            return {
                message: `Hello from Aetheris, ${input.name}!`,
            };
        },
    }),
    counter: withLogger.subscription({
        input: z.number(),
        output: z.string(),
        resolve: async ({ emit, input }) => {
            let count = 1;
            const interval = setInterval(() => {
                emit(`Sent ${count++} messages!`);
            }, input);
            return () => {
                console.log("CLEARED");
                clearInterval(interval);
            };
        },
    }),
});

const handler = createHTTPHandler({
    app,
    createContext,
});

const server = createServer(handler);

const wss = new WebSocket.Server({ server });

applyWSSHandler({
    app,
    wss,
    createContext,
    keepAlive: {
        pingIntervalMs: 1000,
        pongWaitMs: 5000,
    },
});
type App = typeof app;

server.listen(3002, async () => {
    const client = createClient<App>({
        links: [
            loggerLink(),
            wsLink({
                baseUrl: "ws://localhost:3002",
                lazy: true,
            }),
        ],
    });

    // const unsubscribe = client.counter.subscribe({
    //     input: 1000,
    //     onMessage: (message) => {},
    // });

    // setTimeout(() => {
    //     unsubscribe();
    // }, 5000);

    // await client.helloWorld({
    //     name: "John",
    // });
});
