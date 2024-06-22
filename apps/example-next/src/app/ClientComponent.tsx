"use client";

import React, { useEffect, useState } from "react";

import { api } from "@/lib/api";

export const ClientComponent: React.FC = () => {
    const [cookieValue, setCookieValue] = useState<string | null>(null);

    useEffect(() => {
        // Function to get the cookie value
        const getCookie = (name: string): string | null => {
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
            return null;
        };

        // Function to check for cookie changes
        const checkCookieChange = () => {
            const currentCookieValue = getCookie("random");
            if (currentCookieValue !== cookieValue) {
                setCookieValue(currentCookieValue);
                console.log("Cookie value changed:", currentCookieValue);
                // Perform any actions you need when the cookie changes
            }
        };

        // Set up an interval to check for cookie changes
        const intervalId = setInterval(checkCookieChange, 1000); // Check every second

        // Clean up the interval on component unmount
        return () => clearInterval(intervalId);
    }, [cookieValue]);
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
