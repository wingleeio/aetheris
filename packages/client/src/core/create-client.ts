export type CreateClientConfiguration = {
    baseUrl: string;
};

export const createClient = <Router extends object>(config?: CreateClientConfiguration): Router => {
    const buildClient = <T>(props: string[]): T => {
        const fn = function () {
            return props;
        } as unknown as T & (() => string[]);

        return new Proxy(fn, {
            get: (target, prop: string) => {
                if (prop === "then") {
                    return undefined;
                }
                return buildClient([...props, prop]);
            },
            apply: async (target, thisArg, args) => {
                const path: string[] = target();
                return fetch((config ? config.baseUrl ?? "" : "") + path.join("/"), {
                    method: "POST",
                    body: JSON.stringify(args[0]),
                    headers: { "Content-Type": "application/json" },
                    cache: "no-cache",
                    credentials: "include",
                })
                    .then((res) => res.json())
                    .catch((err) => err);
            },
        });
    };
    return buildClient<Router>([]);
};
