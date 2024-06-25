import { CookieManager, CookieOptions } from "../../core";

import type { RequestCookies } from "next/dist/compiled/@edge-runtime/cookies";

export class NextCookieManager implements CookieManager {
    private cookies: Map<
        string,
        {
            value: string;
            options: CookieOptions;
            updated: boolean;
        }
    > = new Map();

    constructor(cookieStore: RequestCookies) {
        cookieStore.getAll().forEach((cookie) => {
            this.cookies.set(cookie.name, {
                value: cookie.value,
                options: {},
                updated: false,
            });
        });
    }

    get(name: string): string | undefined {
        return this.cookies.get(name)?.value;
    }

    getAll(): Record<string, string> {
        const cookies: Record<string, string> = {};
        this.cookies.forEach((cookie, key) => {
            cookies[key] = cookie.value;
        });
        return cookies;
    }

    set(name: string, value: string, _options: CookieOptions = {}): void {
        const options: CookieOptions = Object.assign(
            {
                path: "/",
                httpOnly: true,
                secure: true,
                sameSite: "Lax",
            },
            _options
        );
        this.cookies.set(name, { value, options, updated: true });
    }

    delete(name: string): void {
        this.set(name, "", { expires: new Date(0) });
    }

    getSetCookieHeader(): string[] {
        const setCookieHeaders: string[] = [];
        this.cookies.forEach((value, name) => {
            if (!value.updated) return;

            let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value.value)}`;

            if (value.options.expires) {
                cookie += `; Expires=${value.options.expires.toUTCString()}`;
            }
            if (value.options.maxAge) {
                cookie += `; Max-Age=${value.options.maxAge}`;
            }
            if (value.options.domain) {
                cookie += `; Domain=${value.options.domain}`;
            }
            if (value.options.path) {
                cookie += `; Path=${value.options.path}`;
            }
            if (value.options.secure) {
                cookie += `; Secure`;
            }
            if (value.options.httpOnly) {
                cookie += `; HttpOnly`;
            }
            if (value.options.sameSite) {
                cookie += `; SameSite=${value.options.sameSite}`;
            }
            setCookieHeaders.push(cookie);
        });
        return setCookieHeaders;
    }
}
