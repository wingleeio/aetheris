export type LinkContext = {
    path: string;
    args: any;
    method: string;
    next: (context: Omit<LinkContext, "next">) => Promise<any> | any;
};
export type Link = (context: LinkContext) => Promise<any> | any;

export type TransportLinkConfiguration = {
    baseUrl?: string;
};

export type HttpLinkConfiguration = TransportLinkConfiguration & {
    headers?: () => Promise<Headers | undefined> | Headers | undefined;
};

export type WebsocketLinkConfiguration = TransportLinkConfiguration & {
    reconnectIntervalMs?: number;
    maxReconnectionAttempts?: number;
    lazy?: boolean;
};

export const httpLink =
    (config?: HttpLinkConfiguration): Link =>
    async ({ path, args, next }) => {
        let headers = new Headers({
            "Content-Type": "application/json",
        });

        if (config?.headers) {
            const customHeaders = await config.headers();
            if (customHeaders) {
                customHeaders.forEach((value, key) => {
                    headers.set(key, value);
                });
            }
        }

        return fetch((config ? config.baseUrl ?? "" : "") + path, {
            method: "POST",
            body: JSON.stringify(args),
            headers,
            cache: "no-cache",
            credentials: "include",
        })
            .then((res) => res.json())
            .then((json) => {
                if (json.error) {
                    throw json.error;
                }
                return json.data;
            });
    };

export const wsLink = (config?: WebsocketLinkConfiguration): Link => {
    let WebSocket: typeof globalThis.WebSocket;
    if (typeof window !== "undefined" && window.WebSocket) {
        WebSocket = window.WebSocket;
    } else {
        WebSocket = require("ws");
    }

    let nextId = 1;
    const pending = new Map<number, { resolve: Function; reject: Function }>();
    const subscriptions = new Map<
        number,
        {
            message: any;
            onMessage: Function;
        }
    >();
    let ws: WebSocket;

    const reconnectInterval = config?.reconnectIntervalMs ?? 5000;
    const maxReconnectAttempts = config?.maxReconnectionAttempts ?? 5;
    let reconnectAttempts = 0;

    const messageQueue: any[] = [];
    let isConnecting = false;

    const connect = () => {
        if (isConnecting) return;
        isConnecting = true;

        ws = new WebSocket(config?.baseUrl ?? "");

        ws.addEventListener("message", (event: any) => {
            const response = JSON.parse(event.data);
            const request = pending.get(response.id);
            const subscription = subscriptions.get(response.id);

            if (request) {
                console.log(response);
                if (!response.body.data.error) {
                    request.resolve(response.body.data.data);
                } else {
                    request.reject(response.body.data.error);
                }
                pending.delete(response.id);
            }
            if (subscription) {
                subscription.onMessage(response.body.data);
            }
        });

        ws.addEventListener("open", () => {
            reconnectAttempts = 0;
            isConnecting = false;
            subscriptions.forEach(({ message }) => {
                ws.send(JSON.stringify(message));
            });
            flushMessageQueue();
        });

        ws.addEventListener("close", handleReconnect);
        ws.addEventListener("error", handleReconnect);
    };

    const flushMessageQueue = () => {
        while (messageQueue.length > 0 && ws.readyState === WebSocket.OPEN) {
            const message = messageQueue.shift();
            ws.send(JSON.stringify(message));
        }
    };

    const waitForWebSocketReady = () => {
        return new Promise<void>((resolve, reject) => {
            if (ws.readyState === WebSocket.OPEN) {
                resolve();
            } else {
                const onOpen = () => {
                    ws.removeEventListener("open", onOpen);
                    resolve();
                };
                const onError = (error: any) => {
                    ws.removeEventListener("error", onError);
                    reject(error);
                };
                ws.addEventListener("open", onOpen);
                ws.addEventListener("error", onError);
            }
        });
    };

    const handleReconnect = () => {
        if (reconnectAttempts < maxReconnectAttempts) {
            setTimeout(() => {
                reconnectAttempts++;
                connect();
            }, reconnectInterval);
        } else {
            console.error("Max reconnect attempts reached. Giving up.");
        }
    };

    const ensureConnected = () => {
        if (!ws || ws.readyState !== WebSocket.OPEN) {
            connect();
        }
    };

    if (config?.lazy !== true) {
        connect();
    }

    return ({ path, args, method }) => {
        if (config?.lazy === true) {
            ensureConnected();
        }

        let input;

        if (method === "POST") {
            input = args;
        }

        if (method === "SUBSCRIBE") {
            input = args.input;
        }
        let id = nextId++;
        const message = {
            id,
            method,
            body: {
                path,
                input,
            },
        };

        if (method === "POST") {
            return waitForWebSocketReady().then(() => {
                return new Promise((resolve, reject) => {
                    pending.set(id, { resolve, reject });
                    messageQueue.push(message);
                    flushMessageQueue();
                });
            });
        }

        if (method === "SUBSCRIBE") {
            waitForWebSocketReady().then(() => {
                subscriptions.set(id, {
                    message,
                    onMessage: args.onMessage,
                });
                messageQueue.push(message);
                flushMessageQueue();
            });
            return () => {
                waitForWebSocketReady().then(() => {
                    const unsubscribeMessage = {
                        id,
                        method: "UNSUBSCRIBE",
                        body: message.body,
                    };
                    messageQueue.push(unsubscribeMessage);
                    flushMessageQueue();
                    subscriptions.delete(id);
                });
            };
        }
    };
};

export const loggerLink = ({ enabled } = { enabled: true }): Link => {
    let group = 0;
    return ({ path, args, method, next }) => {
        if (!enabled) {
            return next({
                path,
                args,
                method,
            });
        }
        group++;
        const current = group;
        const now = new Date();
        const styles = {
            group: "background: #09090b; color: white; padding: 5px 16px 5px 16px;",
            header: "background: #0ea5e9; color: white; padding: 5px 16px 5px 16px;",
            path: "background: #6366f1; color: white; padding: 5px 16px 5px 16px;",
            pending: "background: #eab308; color: white; padding: 5px 16px 5px 16px;",
            complete: "background: #34d399; color: white; padding: 5px 16px 5px 16px;",
        };

        console.groupCollapsed(
            `%c#${current} %c%s %c%s %c(%s)`,
            styles.group,
            styles.header,
            method === "SUBSCRIBE" ? "Subscribing" : "Outgoing",
            styles.path,
            path,
            styles.pending,
            "pending",
        );
        const { onMessage, ...input } = Object.assign({ onMessage: undefined }, args);
        console.log({
            input,
        });
        console.groupEnd();

        if (method === "SUBSCRIBE") {
            const unsubscribe = next({
                path,
                args: {
                    ...args,
                    onMessage: (message: any) => {
                        console.groupCollapsed(
                            `%c#${current} %c%s %c%s %c(%s)`,
                            styles.group,
                            styles.header,
                            "Received Message",
                            styles.path,
                            path,
                            styles.complete,
                            "listening",
                        );
                        console.log(message);
                        console.groupEnd();
                        args.onMessage(message);
                    },
                },
                method,
            }) as () => void;
            return () => {
                const elapsed = new Date().getTime() - now.getTime();
                console.groupCollapsed(
                    `%c#${current} %c%s %c%s %c(%dms)`,
                    styles.group,
                    styles.header,
                    "Unsubscribing",
                    styles.path,
                    path,
                    styles.complete,
                    elapsed,
                );
                console.groupEnd();
                unsubscribe();
            };
        } else {
            return Promise.resolve(
                next({
                    path,
                    args,
                    method,
                }),
            ).then((response) => {
                const elapsed = new Date().getTime() - now.getTime();
                console.groupCollapsed(
                    `%c#${current} %c%s %c%s %c(%dms)`,
                    styles.group,
                    styles.header,
                    "Incoming",
                    styles.path,
                    path,
                    styles.complete,
                    elapsed,
                );
                console.log({
                    response,
                });
                console.groupEnd();
                return response;
            });
        }
    };
};

export type MatchLinkConfiguration = {
    match: (context: LinkContext) => string;
    links: { [key: string]: Link };
};

export const matchLink = (config: MatchLinkConfiguration): Link => {
    return (context: LinkContext) => {
        const key = config.match(context);
        const link = config.links[key];

        if (!link) {
            throw new Error(`No matching link found for key: ${key}`);
        }

        return link(context);
    };
};
