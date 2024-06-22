import { Link } from "./links";

export type CreateClientConfiguration = {
    links: Link[];
};

export const createClient = <Router extends object>(config: CreateClientConfiguration): Router => {
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

                let index = -1;
                const executeLink = async (i: number): Promise<any> => {
                    if (i <= index) throw new Error("next() called multiple times");
                    index = i;
                    const link = config.links[i];
                    if (link) {
                        return link({
                            path: "/" + path.join("/"),
                            args: args[0],
                            next: () => executeLink(i + 1),
                        });
                    }
                    return Promise.resolve(null);
                };

                return executeLink(0);
            },
        });
    };
    return buildClient<Router>([]);
};
