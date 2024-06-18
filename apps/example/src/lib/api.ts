import type { Router } from "@/server";
import { createClient } from "@aether/client";

export const api = createClient<Router>({
    baseUrl: "http://localhost:3000/api/",
});
