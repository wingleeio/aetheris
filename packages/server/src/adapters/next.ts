import { createRouterMap, getMatch } from "../core";

import { NextRequest } from "next/server";

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
            const context = {
                path: url,
                params,
                ...(await createContext(req)),
            };

            const body = await req.json().catch(() => void 0);

            const response = await handler(body, context);

            return Response.json(response.data ?? response.error, { status: response.status });
        } else {
            return Response.json("Not found", { status: 404 });
        }
    };
};
