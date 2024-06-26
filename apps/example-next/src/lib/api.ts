import { createClient, httpLink, loggerLink } from "@aetheris/client";

import type { App } from "@/server";
import { createServerHelpers } from "@aetheris/react-query/server";

export const api = createClient<App>({
    links: [
        loggerLink({
            enabled: typeof window !== "undefined",
        }),
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

export const helpers = createServerHelpers(api);
