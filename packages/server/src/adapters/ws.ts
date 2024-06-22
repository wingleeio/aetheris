import { createRouterMap, getMatch } from "../core";

import { IncomingMessage } from "http";
import WebSocket from "ws";

type Message = {
    path: string;
    method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "SUBSCRIBE" | "UNSUBSCRIBE";
    input: any;
};

export const applyWSSHandler = <Router extends object>({
    app,
    wss,
    createContext = async () => ({}),
}: {
    app: Router;
    wss: WebSocket.Server;
    createContext?: (req: IncomingMessage) => Promise<any> | any;
}) => {
    const map = createRouterMap(app);

    wss.on("connection", async (ws: WebSocket.WebSocket, req: IncomingMessage) => {
        ws.on("message", async (buffer: Buffer) => {
            try {
                const message: Message = JSON.parse(buffer.toString());
                console.log(message);
                const { handler, params } = getMatch(map, message.path);

                if (typeof handler === "function") {
                    const context = {
                        path: message.path,
                        params,
                        ...(await createContext(req)),
                    };

                    const response = await handler(message.input ?? void 0, context);

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
            } catch (e) {
                ws.send(
                    JSON.stringify({
                        status: 500,
                        data: "Internal server error",
                    })
                );
            }
        });
    });
};
