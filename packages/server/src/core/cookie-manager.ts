export type CookieOptions = {
    expires?: Date;
    maxAge?: number;
    domain?: string;
    path?: string;
    secure?: boolean;
    httpOnly?: boolean;
};

export interface CookieManager {
    get(name: string): string | undefined;
    getAll(): Record<string, string>;
    set(name: string, value: string, options?: CookieOptions): void;
    delete(name: string): void;
}
