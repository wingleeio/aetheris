import { Server, WebSocket } from "ws";
import { createRouterMap, getMatch } from "../core";

import { IncomingMessage } from "http";

type Message = {
    path: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "SUBSCRIBE" | "UNSUBSCRIBE";
    input: any;
};

export const createWebSocketHandler = <Router extends object>({
    router,
    wss,
    createContext = async () => ({}),
}: {
    router: Router;
    wss: Server;
    createContext?: (req: IncomingMessage) => Promise<any> | any;
}) => {
    const map = createRouterMap(router);

    wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
        ws.on("message", async (message: Message) => {
            const { handler, params } = getMatch(map, message.path);

            if (typeof handler === "function") {
                const context = {
                    path: message.path,
                    params,
                    ...(await createContext(req)),
                };

                const response = await handler(message.input ? JSON.parse(message.input) : void 0, context);

                ws.send(
                    JSON.stringify({
                        status: response.status,
                        data: response.data ?? null,
                    })
                );
            } else {
                ws.send(
                    JSON.stringify({
                        status: 404,
                        data: "Not found",
                    })
                );
            }
        });
    });
};
