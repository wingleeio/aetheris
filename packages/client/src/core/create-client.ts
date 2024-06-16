type RemoveDefaultContext<T> = T extends object
    ? {
          [K in keyof T]: T[K] extends (...args: infer Args) => infer R
              ? Args extends [infer InputData, ...infer Rest]
                  ? Rest extends [any?]
                      ? (input: InputData) => R
                      : T[K]
                  : T[K]
              : RemoveDefaultContext<T[K]>;
      }
    : T;

type AetherClient<T> = RemoveDefaultContext<{
    [K in keyof T]: T[K] extends (...args: infer Args) => infer R
        ? Args extends [infer InputData, ...infer Rest]
            ? Rest extends [any?]
                ? (input: InputData) => R
                : T[K]
            : T[K] extends object
              ? AetherClient<T[K]>
              : T[K]
        : T[K];
}>;

export type CreateClientConfiguration = {
    baseUrl: string;
};

export const createClient = <Router extends object>(config?: CreateClientConfiguration): AetherClient<Router> => {
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
                }).then((res) => res.json());
            },
        });
    };
    return buildClient<AetherClient<Router>>([]);
};
