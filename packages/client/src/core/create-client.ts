import { WebSocket } from "ws";

type LinkContext = {
    path: string;
    args: any;
    next: () => Promise<any>;
};
type Link = (context: LinkContext) => Promise<any>;

type TransportLinkConfiguration = {
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

export const wsLink = (config?: TransportLinkConfiguration): Link => {
    const ws = new WebSocket(config?.baseUrl ?? "");
    return async ({ path, args, next }) => {
        await waitForOpenConnection(ws);
        const message = {
            path,
            method: "POST",
            input: args,
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
    };
};

export const loggerLink =
    (): Link =>
    async ({ path, args, next }) => {
        console.log("%c\n=== Request ===", "color: blue; font-weight: bold; font-size: 16px;");
        console.log("%cPath: %c" + path, "color: cyan; font-weight: bold;", "color: green; font-weight: bold;");
        console.log(
            "%cInput: %c" + JSON.stringify(args, null, 2),
            "color: cyan; font-weight: bold;",
            "color: yellow; font-weight: bold;",
        );

        const response = await next();

        console.log("%c\n=== Response ===", "color: blue; font-weight: bold; font-size: 16px;");
        console.log("%cPath: %c" + path, "color: cyan; font-weight: bold;", "color: green; font-weight: bold;");
        console.log(
            "%cData: %c" + JSON.stringify(response, null, 2),
            "color: cyan; font-weight: bold;",
            "color: yellow; font-weight: bold;",
        );

        return response;
    };

export type CreateClientConfiguration = {
    links: Link[];
};

export const createClient = <Router extends object>(config: CreateClientConfiguration): Router => {
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

                let index = -1;
                const executeLink = async (i: number): Promise<any> => {
                    if (i <= index) throw new Error("next() called multiple times");
                    index = i;
                    const link = config.links[i];
                    if (link) {
                        return link({
                            path: "/" + path.join("/"),
                            args: args[0],
                            next: () => executeLink(i + 1),
                        });
                    }
                    return Promise.resolve(null);
                };

                return executeLink(0);
            },
        });
    };
    return buildClient<Router>([]);
};
