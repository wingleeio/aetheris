import { createClient } from "@aetheris/client";
import { createAetheris } from "@aetheris/server";
import { createHTTPHandler } from "@aetheris/server/adapters/http";
import assert from "node:assert";
import { createServer } from "node:http";
import { describe, it } from "node:test";

describe("Testing @aether/server and @aether/client", () => {
    it("Basic hello world implementation.", async () => {
        const a = createAetheris();
        const router = a.router({
            helloWorld: a.procedure.handler({ resolve: () => "Hello, world!" }),
        });
        const client = createClient<typeof router>({
            baseUrl: "http://localhost:1234/",
        });

        const handler = createHTTPHandler({
            router,
        });

        const server = createServer(handler).listen(1234);

        const result = await client.helloWorld();

        assert.strictEqual(result, "Hello, world!");

        server.close();
    });
});
