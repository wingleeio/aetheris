import { createClient, httpLink, loggerLink } from "@aetheris/client";

import type { App } from "@/server";

export const api = createClient<App>({
    links: [
        loggerLink(),
        httpLink({
            baseUrl: "http://localhost:3000/api/",
        }),
    ],
});
