import { IncomingMessage, ServerResponse } from "http";
import { createRouterMap, getMatch } from "../core";

import { HttpCookieManager } from "./cookies/http-cookie-manager";

export const createHTTPHandler = <Router extends object>({
    app,
    createContext = async () => ({}),
    prefix,
}: {
    app: Router;
    createContext?: (req: IncomingMessage, res: ServerResponse) => Promise<any> | any;
    prefix?: string;
}) => {
    const map = createRouterMap(app);

    return async (req: IncomingMessage, res: ServerResponse) => {
        const url = req.url!;
        const path = prefix ? url.replace(prefix, "") : url;

        const { handler, params } = getMatch(map, path);

        if (typeof handler === "function") {
            const context = {
                path: url,
                params,
                cookies: new HttpCookieManager(req, res),
                ...(await createContext(req, res)),
            };

            const body = await new Promise<string>((resolve) => {
                let data = "";
                req.on("data", (chunk) => {
                    data += chunk;
                });
                req.on("end", () => {
                    resolve(data);
                });
            });

            const response = await handler(body ? JSON.parse(body) : void 0, context);

            res.statusCode = response.status;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(response.data ?? null));
        } else {
            res.statusCode = 404;
            res.end("Not found");
        }
    };
};
