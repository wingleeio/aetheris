import { IncomingMessage, ServerResponse } from "http";
import { createRouterMap, getMatch } from "../core";

export const createHTTPHandler = <Router extends object>({
    router,
    createContext = async () => ({}),
    prefix,
}: {
    router: Router;
    createContext?: (req: IncomingMessage, res: ServerResponse) => Promise<any> | any;
    prefix?: string;
}) => {
    const map = createRouterMap(router);

    return async (req: IncomingMessage, res: ServerResponse) => {
        const url = req.url!;
        const path = prefix ? url.replace(prefix, "") : url;

        const { handler, params } = getMatch(map, path);

        if (typeof handler === "function") {
            const context = {
                path: url,
                params,
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
            res.end(JSON.stringify(response.data ?? response.error));
        } else {
            res.statusCode = 404;
            res.end("Not found");
        }
    };
};
