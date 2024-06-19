import type { Router } from "@/server";
import { createClient } from "@aetheris/client";

export const api = createClient<Router>({
    baseUrl: "http://localhost:3000/api/",
});
