import {
    UseMutationOptions,
    UseMutationResult,
    UseQueryOptions,
    UseQueryResult,
    useMutation,
    useQuery,
} from "@tanstack/react-query";

export type AetherQueryClient<T> = {
    [K in keyof T]: T[K] extends (inputData: infer U) => Promise<infer V>
        ? {
              useQuery: (options?: Omit<UseQueryOptions, "queryKey"> & { input: U }) => UseQueryResult<V, Error>;
              useMutation: (options: UseMutationOptions) => UseMutationResult<V, Error, U>;
          }
        : AetherQueryClient<T[K]>;
};

export const createQueryClient = <Router extends object>(client: Router): AetherQueryClient<Router> => {
    const buildQueryHook = <T>(props: string[]): T => {
        const fn = function () {
            return props;
        } as unknown as T & (() => string[]);

        return new Proxy(fn, {
            get: (target, prop: string) => {
                if (prop === "then") {
                    return undefined;
                }

                if (prop === "useQuery") {
                    return (options: any = { input: void 0 }) =>
                        useQuery({
                            queryKey: ["aether", ...props, options.input],
                            queryFn: async () => {
                                const method = props.reduce((acc, key) => (acc as any)[key], client) as (
                                    data: any,
                                ) => Promise<any>;
                                return method(options.input);
                            },
                            ...options,
                        });
                }

                if (prop === "useMutation") {
                    return (data: any, options?: any) =>
                        useMutation({
                            mutationFn: async () => {
                                const method = props.reduce((acc, key) => (acc as any)[key], client) as (
                                    data: any,
                                ) => Promise<any>;
                                return method(data);
                            },
                            ...options,
                        });
                }

                return buildQueryHook([...props, prop]);
            },
        });
    };
    return buildQueryHook<AetherQueryClient<Router>>([]);
};
