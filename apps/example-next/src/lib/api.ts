import type { App } from "@/server";
import { createClient, httpLink, loggerLink } from "@aetheris/client";

export const api = createClient<App>({
    links: [
        loggerLink(),
        httpLink({
            baseUrl: "http://localhost:3000/api",
            headers: async () => {
                if (typeof window === "undefined") {
                    return import("next/headers").then(({ headers }) => headers());
                }
            },
        }),
    ],
});
