export type LinkContext = {
    path: string;
    args: any;
    method: string;
    next: () => Promise<any> | any;
};
export type Link = (context: LinkContext) => Promise<any> | any;

export type TransportLinkConfiguration = {
    baseUrl?: string;
};

export const httpLink =
    (config?: TransportLinkConfiguration): Link =>
    async ({ path, args, next }) => {
        return fetch((config ? config.baseUrl ?? "" : "") + path, {
            method: "POST",
            body: JSON.stringify(args),
            headers: { "Content-Type": "application/json" },
            cache: "no-cache",
            credentials: "include",
        })
            .then((res) => res.json())
            .catch((err) => err);
    };

export const wsLink = (config?: TransportLinkConfiguration): Link => {
    let WebSocket: typeof globalThis.WebSocket;
    if (typeof window !== "undefined" && window.WebSocket) {
        WebSocket = window.WebSocket;
    } else {
        WebSocket = require("ws");
    }
    const ws = new WebSocket(config?.baseUrl ?? "");

    let nextId = 1;
    const pending = new Map<number, { resolve: Function; reject: Function }>();
    const subscriptions = new Map<number, Function>();

    ws.addEventListener("message", (event: any) => {
        const response = JSON.parse(event.data);
        const request = pending.get(response.id);
        const subscription = subscriptions.get(response.id);
        if (request) {
            if (response.body.status >= 200 && response.body.status < 300) {
                request.resolve(response.body.data);
            } else {
                request.reject(response);
            }
            pending.delete(response.id);
        }
        if (subscription) {
            subscription(response.body.data);
        }
    });

    const waitForWebSocketReady = (ws: WebSocket) => {
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

    return ({ path, args, method }) => {
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
            return waitForWebSocketReady(ws).then(() => {
                return new Promise((resolve, reject) => {
                    pending.set(id, { resolve, reject });
                    ws.send(JSON.stringify(message));
                });
            });
        }

        if (method === "SUBSCRIBE") {
            waitForWebSocketReady(ws).then(() => {
                subscriptions.set(id, args.onMessage);
                ws.send(JSON.stringify(message));
            });
            return () => {
                waitForWebSocketReady(ws).then(() => {
                    const message = {
                        id,
                        method: "UNSUBSCRIBE",
                        body: {
                            path,
                        },
                    };
                    ws.send(JSON.stringify(message));
                    subscriptions.delete(id);
                });
            };
        }
    };
};

export const loggerLink = (): Link => {
    let group = 0;
    return ({ path, args, method, next }) => {
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

        if (args.onMessage) {
            args.onMessage = (message: any) => {
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
                onMessage(message);
            };
        }

        if (method === "SUBSCRIBE") {
            const unsubscribe = next() as () => void;
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
            return Promise.resolve(next()).then((response) => {
                const elapsed = new Date().getTime() - now.getTime();
                console.groupCollapsed(
                    `%c#${current} %c%s %c%s %c(%dms)`,
                    styles.group,
                    styles.header,
                    "Outgoing",
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
