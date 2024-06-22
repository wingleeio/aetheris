export type LinkContext = {
    path: string;
    args: any;
    next: () => Promise<any>;
};
export type Link = (context: LinkContext) => Promise<any>;

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
    let WebSocket;
    if (typeof window !== "undefined" && window.WebSocket) {
        WebSocket = window.WebSocket;
    } else {
        WebSocket = require("ws");
    }
    const ws = new WebSocket(config?.baseUrl ?? "");
    return async ({ path, args, next }) => {
        await new Promise<void>((resolve, reject) => {
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

export const loggerLink = (): Link => {
    let group = 0;
    return async ({ path, args, next }) => {
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
            "Outgoing",
            styles.path,
            path,
            styles.pending,
            "pending",
        );
        console.log({
            input: args,
        });
        console.groupEnd();

        const response = await next();

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
    };
};
