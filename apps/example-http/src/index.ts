import { createAetheris, router } from "@aetheris/server";
import { createClient, loggerLink, wsLink } from "@aetheris/client";

import WebSocket from "ws";
import { applyWSSHandler } from "@aetheris/server/adapters/ws";
import { createHTTPHandler } from "@aetheris/server/adapters/http";
import { createServer } from "http";
import pino from "pino";
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

server.listen(3002, () => {
    logger.info("Server listening on port 3002");

    const client = createClient<App>({
        links: [
            wsLink({
                baseUrl: "ws://localhost:3002/",
            }),
        ],
    });

    client
        .helloWorld({
            name: "hi",
        })
        .then((response) => {
            logger.info(response, "Response from server");
        })
        .catch(console.log);
});
