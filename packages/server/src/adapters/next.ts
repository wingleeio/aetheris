import { CORSOptions, createRouterMap, getMatch } from "../core";

import { NextCookieManager } from "./cookies/next-cookie-manager";
import { NextRequest } from "next/server";

export const createNextHandler = <Router extends object>({
    app,
    createContext = async () => ({}),
    prefix,
    cors = {},
}: {
    app: Router;
    createContext?: (req: NextRequest) => Promise<any> | any;
    prefix?: string;
    cors?: CORSOptions;
}) => {
    const map = createRouterMap(app);
    return async (req: NextRequest) => {
        const headers = new Headers();

        cors.origin && headers.append("Access-Control-Allow-Origin", cors.origin);
        cors.methods && headers.append("Access-Control-Allow-Methods", cors.methods);
        cors.allowedHeaders && headers.append("Access-Control-Allow-Headers", cors.allowedHeaders);
        cors.exposedHeaders && headers.append("Access-Control-Expose-Headers", cors.exposedHeaders);
        cors.credentials && headers.append("Access-Control-Allow-Credentials", "true");
        cors.maxAge && headers.append("Access-Control-Max-Age", cors.maxAge.toString());

        if (req.method === "OPTIONS") {
            return new Response(null, { status: 204 });
        }

        const url = new URL(req.url!);
        const path = prefix ? url.pathname.replace(prefix, "") : url.pathname;

        const { handler, params } = getMatch(map, path);

        if (typeof handler === "function") {
            const cookies = new NextCookieManager(req.cookies);
            const context = {
                path: url,
                params,
                cookies,
                ...(await createContext(req)),
            };

            const body = await req.json().catch(() => void 0);

            const response = await handler(body, context);
            for (const cookie of cookies.getSetCookieHeader()) {
                headers.append("Set-Cookie", cookie);
            }

            return Response.json(response.data ?? null, {
                status: response.status,
                headers,
            });
        } else {
            return Response.json("Not found", { status: 404 });
        }
    };
};
