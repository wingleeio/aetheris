"use client";

import React from "react";

import { client, useAetherisContext } from "@/lib/client";

export const ClientComponent: React.FC = () => {
    const { queryClient } = useAetherisContext();
    const { data, queryKey } = client.helloWorld.useQuery({
        input: {
            name: "Client Component",
        },
    });

    const { mutateAsync } = client.addCount.useMutation({
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    return (
        <div className="pl-4">
            <div className="pb-4">{data ? data.message : "Loading..."}</div>
            <button
                className="px-4 py-2 bg-slate-900 text-white rounded-md"
                onClick={async () => {
                    await mutateAsync(1);
                }}
            >
                Add Count
            </button>
        </div>
    );
};
