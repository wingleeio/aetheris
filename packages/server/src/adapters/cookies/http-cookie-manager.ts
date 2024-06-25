import type { IncomingMessage, ServerResponse } from "http";
import { CookieManager, CookieOptions } from "../../core";

export class HttpCookieManager implements CookieManager {
    constructor(private req: IncomingMessage, private res: ServerResponse) {}

    parse(): Record<string, string> {
        const cookieHeader = this.req.headers.cookie;
        const cookies: Record<string, string> = {};
        if (cookieHeader) {
            cookieHeader.split(";").forEach((cookie) => {
                const [name, ...rest] = cookie.split("=");
                cookies[name.trim()] = rest.join("=").trim();
            });
        }
        return cookies;
    }

    get(name: string): string | undefined {
        const cookies = this.parse();
        return cookies[name];
    }

    getAll(): Record<string, string> {
        return this.parse();
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
        let cookieString = `${name}=${encodeURIComponent(value)}`;

        if (options.expires) {
            cookieString += `; Expires=${options.expires.toUTCString()}`;
        }

        if (options.maxAge !== undefined) {
            cookieString += `; Max-Age=${options.maxAge}`;
        }

        if (options.domain) {
            cookieString += `; Domain=${options.domain}`;
        }

        if (options.path) {
            cookieString += `; Path=${options.path}`;
        } else {
            cookieString += `; Path=/`;
        }

        if (options.secure) {
            cookieString += `; Secure`;
        }

        if (options.httpOnly) {
            cookieString += `; HttpOnly`;
        }

        if (options.sameSite) {
            cookieString += `; SameSite=${options.sameSite}`;
        }

        const existingSetCookieHeader = this.res.getHeader("Set-Cookie");
        if (existingSetCookieHeader) {
            if (Array.isArray(existingSetCookieHeader)) {
                this.res.setHeader("Set-Cookie", [...existingSetCookieHeader, cookieString]);
            } else {
                this.res.setHeader("Set-Cookie", [existingSetCookieHeader.toString(), cookieString]);
            }
        } else {
            this.res.setHeader("Set-Cookie", cookieString);
        }
    }

    delete(name: string, options: CookieOptions = {}): void {
        this.set(name, "", { ...options, expires: new Date(0) });
    }
}
