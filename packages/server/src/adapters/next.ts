import { NextRequest } from "next/server";
import { createRouterMap } from "../core";

export const createNextHandler = <Router extends object>({
    router,
    createContext,
    prefix,
}: {
    router: Router;
    createContext: (req: NextRequest) => Promise<any> | any;
    prefix?: string;
}) => {
    const map = createRouterMap(router);

    return async (req: NextRequest) => {
        const url = new URL(req.url!);
        const path = prefix ? url.pathname.replace(prefix, "") : url.pathname;
        const handler = map[path];

        if (typeof handler === "function") {
            const context = {
                path: url.pathname,
                ...(await createContext(req)),
            };

            const body = req.json().catch(() => void 0);

            const response = await handler(body, context);

            return Response.json(response, { status: 200 });
        } else {
            return Response.json("Not found", { status: 404 });
        }
    };
};
