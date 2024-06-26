# Aetheris Monorepo

Welcome to the Aetheris monorepo! Aetheris is split into two main packages: `@aetheris/server` and `@aetheris/client`. The server package is used to define your API in the backend and the client package is used to call your API on the frontend. Depending on your project, you may want to install these packages into their respective applications.

## System Requirements

-   Node.js 18.17 or later

## Installation

To install the necessary packages, run the following command:

```bash
pnpm add @aetheris/server @aetheris/client
```

## Quick Start

Setting up Aetheris is simple and doesn't require much boilerplate. Let's break down everything we need to do to get started.

### Creating the Router

In an existing Next.js project, create a new file. This can be anywhere in your project, but for this example we will create a new directory and create an `index.ts` file.

In this file, import `createAetheris` to create a new Aetheris server.

```typescript
// src/server/index.ts
import { createAetheris } from "@aetheris/server";

export const aether = createAetheris();
```

This function returns a class containing utilities to assist in building your application. These will be used to define your API. Let's begin with creating our base router.

```typescript
// src/server/index.ts
import { createAetheris, router } from "@aetheris/server";

const aether = createAetheris();

export const app = router({});

export type App = typeof app;
```

We also export the inferred type of the router so that we can import it in the future to create our API client.

Next, we can create our first procedure. For now, we'll create a basic hello world procedure.

```typescript
// src/server/index.ts
import { createAetheris, router } from "@aetheris/server";

const aether = createAetheris();

export const app = router({
    helloWorld: aether.handler({
        resolve: async () => {
            return "Hello, World!";
        },
    }),
});

export type App = typeof app;
```

### Creating a Route Handler

Now that we've created a basic procedure, we can expose this API by creating a Next.js route handler.

Create the new file in a directory like `src/app/api/[[...slug]]/route.ts`.

Import the `router` object we created earlier and the `createNextHandler` function from the `@aetheris/server` package.
The `createNextHandler` function will create a new Next.js route handler that you can assign to the POST method of your route.

```typescript
// src/app/api/[[...slug]]/route.ts
import { createNextHandler } from "@aetheris/server/adapters/next";
import { app } from "@/server";

const handler = createNextHandler({
    app,
    // We have to set a prefix to let Aetheris know where the route is located.
    prefix: "/api",
});

export const POST = handler;
```

### Creating the API Client

After creating this file, we still need a method to call the API.

Create a new file in a directory like `src/lib/api.ts`.

Import the `createClient` function from the `@aetheris/client` package.

This function takes a generic type that represents the router object. We can import the `App` type we exported earlier to use as the generic type. For this example, we will hardcode the base URL, but you will likely need some additional logic to determine the base URL based on the environment.

```typescript
// src/lib/api.ts
import type { App } from "@/server";
import { createClient } from "@aetheris/client";

export const api = createClient<App>({
    // You will need to change this URL in your project.
    baseUrl: "http://localhost:3000/api/",
});
```

### Calling our API

That's it! We've done everything we need to get started with Aetheris. You can now call the API from anywhere in your project by importing the `api` object we created earlier. If everything is set up correctly, the API client should be fully typed and will reflect any procedures you define in the server.

```typescript
// src/app/page.tsx
export default async function Page() {
    const response = await api.helloWorld(); // Hello World!

    return (
      <div>{response}</div>
    );
}
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

---
