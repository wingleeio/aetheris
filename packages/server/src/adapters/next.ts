import { createRouterMap, getMatch } from "../core";

import { NextRequest } from "next/server";
import { NextCookieManager } from "./cookies/next-cookie-manager";

export const createNextHandler = <Router extends object>({
    router,
    createContext = async () => ({}),
    prefix,
}: {
    router: Router;
    createContext?: (req: NextRequest) => Promise<any> | any;
    prefix?: string;
}) => {
    const map = createRouterMap(router);
    return async (req: NextRequest) => {
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
            const headers = new Headers();
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
