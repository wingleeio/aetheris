import "./globals.css";

import { ClientProvider } from "@/components/client-provider";
import { Inter } from "next/font/google";
import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Example Aether App",
    description: "App showcasing Aether's capabilities",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <ClientProvider>
            <html lang="en">
                <body className={inter.className}>{children}</body>
            </html>
        </ClientProvider>
    );
}
