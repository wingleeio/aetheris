import { createRouterMap, getMatch } from "../core";

import { IncomingMessage, ServerResponse } from "http";
import WebSocket from "ws";
import { HttpCookieManager } from "./cookies/http-cookie-manager";

type Incoming = {
    path: string;
    input?: any;
};

type Outgoing = {
    status: number;
    data: any;
    path: string;
};

type Message<T> = {
    id: number;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "SUBSCRIBE" | "UNSUBSCRIBE";
    body: T;
};

export const applyWSSHandler = <Router extends object>({
    app,
    wss,
    createContext = async () => ({}),
    keepAlive,
}: {
    app: Router;
    wss: WebSocket.Server;
    createContext?: (req: IncomingMessage) => Promise<any> | any;
    keepAlive?: {
        pingIntervalMs: number;
        pongWaitMs: number;
    };
}) => {
    const map = createRouterMap(app);

    wss.on("connection", async (ws: WebSocket.WebSocket, req: IncomingMessage) => {
        const res = new ServerResponse(req);
        const cookies = new HttpCookieManager(req, res);
        const shouldKeepAlive = !!keepAlive;
        let isAlive = true;
        let lastPong = Date.now();

        if (shouldKeepAlive) {
            ws.on("pong", () => {
                isAlive = true;
                lastPong = Date.now();
            });

            const interval = setInterval(() => {
                if (!isAlive || Date.now() - lastPong > keepAlive.pongWaitMs) {
                    return ws.terminate();
                }
                isAlive = false;
                ws.ping();
            }, keepAlive.pingIntervalMs);

            ws.on("close", () => {
                clearInterval(interval);
            });
        }

        const unsubscribers = new Map<
            number,
            { resolve: (unsubscribe: Function) => void; promise: Promise<Function> }
        >();

        ws.on("message", async (buffer: Buffer) => {
            try {
                const message: Message<Incoming> = JSON.parse(buffer.toString());
                const { id, method } = message;
                const { path, input } = message.body;
                const { handler, params } = getMatch(map, path);

                if (typeof handler === "function" || "subscribe" in handler) {
                    const context = {
                        path,
                        params,
                        cookies,
                        ...(await createContext(req)),
                    };

                    if (method === "POST") {
                        const response = await handler(input ?? void 0, context);
                        const data = {
                            data: response.status < 400 ? response.data : null,
                            error: response.status >= 400 ? response.data : null,
                        };
                        let output: Message<Outgoing> = {
                            id,
                            method,
                            body: {
                                status: response.status,
                                path,
                                data: data ?? null,
                            },
                        };

                        ws.send(JSON.stringify(output));
                    }

                    if (method === "SUBSCRIBE") {
                        const unsubscriberPromise = new Promise<Function>((resolve) => {
                            const unsubscriber = handler.subscribe(input ?? void 0, context, (data: any) => {
                                let output: Message<Outgoing> = {
                                    id,
                                    method,
                                    body: {
                                        status: 200,
                                        path,
                                        data,
                                    },
                                };
                                ws.send(JSON.stringify(output));
                            });

                            resolve(unsubscriber);
                        });

                        unsubscribers.set(id, { promise: unsubscriberPromise, resolve: () => {} });
                        unsubscriberPromise.then((unsubscribe) => {
                            if (unsubscribers.has(id)) {
                                unsubscribers.get(id)!.resolve(unsubscribe);
                            }
                        });
                    }

                    if (method === "UNSUBSCRIBE") {
                        const subscription = unsubscribers.get(id);

                        if (subscription) {
                            const unsubscriber = await subscription.promise;
                            unsubscriber();
                            unsubscribers.delete(id);
                        }
                    }
                } else {
                    let output: Message<Outgoing> = {
                        id,
                        method,
                        body: {
                            status: 404,
                            path,
                            data: "Not found",
                        },
                    };
                    ws.send(JSON.stringify(output));
                }
            } catch (e) {
                ws.send(
                    JSON.stringify({
                        status: 500,
                        data: "Internal server error",
                    }),
                );
            }
        });

        ws.on("close", () => {
            unsubscribers.forEach(async (subscription) => {
                const unsubscriber = await subscription.promise;
                unsubscriber();
            });
        });
    });
};
