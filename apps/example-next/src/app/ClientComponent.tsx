"use client";

import React from "react";

import { api } from "@/lib/api";

export const ClientComponent: React.FC = () => {
    return (
        <div>
            <button
                className="px-4 py-2 bg-slate-900 text-white rounded-md"
                onClick={async () => {
                    await api.helloWorld({
                        name: "Example",
                    });
                }}
            >
                Click Me
            </button>
        </div>
    );
};
