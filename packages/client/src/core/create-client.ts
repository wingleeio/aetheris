import { WebSocket } from "ws";

export type CreateClientConfiguration = {
    baseUrl: string;
};

export const createClient = <Router extends object>(config?: CreateClientConfiguration): Router => {
    const buildClient = <T>(props: string[]): T => {
        const fn = function () {
            return props;
        } as unknown as T & (() => string[]);

        return new Proxy(fn, {
            get: (target, prop: string) => {
                if (prop === "then") {
                    return undefined;
                }
                return buildClient([...props, prop]);
            },
            apply: async (target, thisArg, args) => {
                const path: string[] = target();
                return fetch((config ? config.baseUrl ?? "" : "") + path.join("/"), {
                    method: "POST",
                    body: JSON.stringify(args[0]),
                    headers: { "Content-Type": "application/json" },
                    cache: "no-cache",
                    credentials: "include",
                })
                    .then((res) => res.json())
                    .catch((err) => err);
            },
        });
    };
    return buildClient<Router>([]);
};

const waitForOpenConnection = (ws: WebSocket): Promise<void> => {
    return new Promise((resolve, reject) => {
        if (ws.readyState === WebSocket.OPEN) {
            resolve();
        } else {
            const onOpen = () => {
                ws.removeEventListener("open", onOpen);
                resolve();
            };
            ws.addEventListener("open", onOpen);
        }
    });
};

export const createWSSClient = <Router extends object>(config: CreateClientConfiguration): Router => {
    const ws = new WebSocket(config.baseUrl);
    const buildClient = <T>(props: string[]): T => {
        const fn = function () {
            return props;
        } as unknown as T & (() => string[]);

        return new Proxy(fn, {
            get: (target, prop: string) => {
                if (prop === "then") {
                    return undefined;
                }
                return buildClient([...props, prop]);
            },
            apply: async (target, thisArg, args) => {
                await waitForOpenConnection(ws);
                const path: string[] = target();
                const message = {
                    path: "/" + path.join("/"),
                    method: "POST", // Assuming method is POST, you can adapt as needed
                    input: args[0],
                };

                return new Promise((resolve, reject) => {
                    const listener = (event: any) => {
                        const response = JSON.parse(event.data);
                        if (response.status >= 200 && response.status < 300) {
                            resolve(response.data);
                        } else {
                            reject(response);
                        }
                        ws.removeEventListener("message", listener);
                    };

                    ws.addEventListener("message", listener);

                    ws.send(JSON.stringify(message));
                });
            },
        });
    };
    return buildClient<Router>([]);
};
