import { CORSOptions, createRouterMap, getMatch } from "../core";
import { IncomingMessage, ServerResponse } from "http";

import { HttpCookieManager } from "./cookies/http-cookie-manager";

export const createHTTPHandler = <Router extends object>({
    app,
    createContext = async () => ({}),
    prefix,
    cors = {},
}: {
    app: Router;
    createContext?: (req: IncomingMessage, res: ServerResponse) => Promise<any> | any;
    prefix?: string;
    cors?: CORSOptions;
}) => {
    const map = createRouterMap(app);

    return async (req: IncomingMessage, res: ServerResponse) => {
        cors.origin && res.setHeader("Access-Control-Allow-Origin", cors.origin);
        cors.methods && res.setHeader("Access-Control-Allow-Methods", cors.methods);
        cors.allowedHeaders && res.setHeader("Access-Control-Allow-Headers", cors.allowedHeaders);
        cors.exposedHeaders && res.setHeader("Access-Control-Expose-Headers", cors.exposedHeaders);
        cors.credentials && res.setHeader("Access-Control-Allow-Credentials", "true");
        cors.maxAge && res.setHeader("Access-Control-Max-Age", cors.maxAge.toString());

        if (req.method === "OPTIONS") {
            res.writeHead(204);
            res.end();
            return;
        }

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
