import { ProcedureResponse } from "@aether/server";

type TransformKey<Key> = Key extends `${infer Prefix}:` ? `${Prefix}:${string}` : Key;

type TransformResponse<R> = R extends Promise<ProcedureResponse<infer Data, any>> ? Promise<Data> : R;

type RemapFunction<Fn> = Fn extends (...args: [infer InputData, ...infer Rest]) => infer R
    ? Rest extends [any?]
        ? (input: InputData) => TransformResponse<R>
        : Fn
    : Fn;

type RemoveDefaultContext<Router> = Router extends object
    ? {
          [Key in keyof Router as TransformKey<Key>]: Router[Key] extends Function
              ? RemapFunction<Router[Key]>
              : RemoveDefaultContext<Router[Key]>;
      }
    : Router;

type AetherRouter<Router> = RemoveDefaultContext<{
    [Key in keyof Router as TransformKey<Key>]: Router[Key] extends Function
        ? RemapFunction<Router[Key]>
        : Router[Key] extends object
          ? AetherRouter<Router[Key]>
          : Router[Key];
}>;

export type CreateClientConfiguration = {
    baseUrl: string;
};

export const createClient = <Router extends object>(config?: CreateClientConfiguration): AetherRouter<Router> => {
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
    return buildClient<AetherRouter<Router>>([]);
};
