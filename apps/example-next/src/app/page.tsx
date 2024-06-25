export const dynamic = "force-dynamic";

import { ClientComponent } from "@/app/ClientComponent";
import { api } from "@/lib/api";

export default async function Home() {
    const response = await api.helloWorld({
        name: "Server Component",
    });
    return (
        <main className="p-20">
            <div className="p-4">{response.message}</div>
            <ClientComponent count={1} />
        </main>
    );
}
