import { CookieManager, CookieOptions } from "../../core";

import type { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";

export class NextCookieManager implements CookieManager {
    private cookies: Map<string, string> = new Map();

    constructor(cookieStore: RequestCookies) {
        cookieStore.getAll().forEach((cookie) => {
            this.cookies.set(cookie.name, cookie.value);
        });
    }

    get(name: string): string | undefined {
        return this.cookies.get(name);
    }

    getAll(): Record<string, string> {
        const cookies: Record<string, string> = {};
        this.cookies.forEach((value, key) => {
            cookies[key] = value;
        });
        return cookies;
    }

    set(name: string, value: string, options: CookieOptions = {}): void {
        let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

        if (options.expires) {
            cookie += `; Expires=${options.expires.toUTCString()}`;
        }
        if (options.maxAge) {
            cookie += `; Max-Age=${options.maxAge}`;
        }
        if (options.domain) {
            cookie += `; Domain=${options.domain}`;
        }
        if (options.path) {
            cookie += `; Path=${options.path}`;
        }
        if (options.secure) {
            cookie += `; Secure`;
        }
        if (options.httpOnly) {
            cookie += `; HttpOnly`;
        }

        this.cookies.set(name, value);
    }

    delete(name: string): void {
        this.set(name, "", { expires: new Date(0) });
    }

    getSetCookieHeader(): string[] {
        const setCookieHeaders: string[] = [];
        this.cookies.forEach((value, name) => {
            let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
            setCookieHeaders.push(cookie);
        });
        return setCookieHeaders;
    }
}
