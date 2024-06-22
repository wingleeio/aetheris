import type { App } from "@/server";
import { createClient } from "@aetheris/client";

export const api = createClient<App>({
    baseUrl: "http://localhost:3000/api/",
});
