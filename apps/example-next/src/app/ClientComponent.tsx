"use client";

import React from "react";

import { client } from "@/lib/client";

export const ClientComponent: React.FC = () => {
    // const { data } = client.helloWorld.useQuery({
    //     input: {
    //         name: "Sina",
    //     },
    // });
    const { mutateAsync } = client.helloWorld.useMutation();
    client.counter.useSubscription({
        input: 10000,
        onMessage: (message) => {
            console.log(1, message);
        },
    });
    client.counter.useSubscription({
        input: 10000,
        onMessage: (message) => {
            console.log(2, message);
        },
    });
    return (
        <div>
            <button
                className="px-4 py-2 bg-slate-900 text-white rounded-md"
                onClick={async () => {
                    await mutateAsync({
                        name: "Example",
                    });
                }}
            >
                Click Me
            </button>
        </div>
    );
};
