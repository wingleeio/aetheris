export const dynamic = "force-dynamic";

import { api, helpers } from "@/lib/api";

import { ClientComponent } from "@/app/ClientComponent";
import { InfiniteQueryComponent } from "@/app/InfiniteQueryComponent";
import { HydrationBoundary } from "@tanstack/react-query";

export default async function Home() {
    const response = await api.helloWorld({
        name: "Server Component",
    });

    await Promise.all([
        helpers.helloWorld.prefetch({
            input: {
                name: "Client Component",
            },
        }),
        helpers.posts.prefetchInfinite({
            input: {
                take: 10,
            },
            initialPageParam: 0,
        }),
    ]);

    return (
        <HydrationBoundary state={helpers.dehydrate()}>
            <main className="p-4">
                <div className="p-4">{response.message}</div>
                <ClientComponent />
                <InfiniteQueryComponent />
            </main>
        </HydrationBoundary>
    );
}
