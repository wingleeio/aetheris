import type { App } from "@/server";
import { createClient, httpLink, loggerLink, matchLink, wsLink } from "@aetheris/client";

export const api = createClient<App>({
    links: [
        loggerLink(),
        matchLink({
            match: () => {
                if (typeof window !== "undefined") {
                    return "ws";
                }
                return "http";
            },
            links: {
                ws: wsLink({
                    baseUrl: "ws://localhost:3002",
                }),
                http: httpLink({
                    baseUrl: "http://localhost:3002",
                }),
            },
        }),
    ],
});
