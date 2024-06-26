import {
    DehydratedState,
    FetchInfiniteQueryOptions,
    FetchQueryOptions,
    QueryClient,
    dehydrate,
} from "@tanstack/react-query";

type Prefetch<Input> = (input: Omit<FetchQueryOptions, "queryKey"> & { input: Input }) => Promise<void>;
type PrefetchInfinite<Input> = (
    options: Omit<FetchInfiniteQueryOptions, "queryKey"> & { input: Input },
) => Promise<void>;

export type AetherisServerHelpers<T> = T extends object
    ? {
          [K in keyof T as T[K] extends { subscribe: any } ? never : K]: T[K] extends (
              inputData: infer Input,
          ) => Promise<any>
              ? {
                    prefetch: Prefetch<Input>;
                    prefetchInfinite: PrefetchInfinite<Omit<Input, "cursor">>;
                }
              : AetherisServerHelpers<T[K]>;
      }
    : T;

export const createServerHelpers = <Router extends object>(
    client: Router,
): AetherisServerHelpers<Router> & { dehydrate: () => DehydratedState } => {
    const queryClient = new QueryClient();

    const buildServerHelpers = <T>(props: string[]): T => {
        const fn = function () {
            return props;
        } as unknown as T & (() => string[]);

        return new Proxy(fn, {
            get: (target, prop: string) => {
                if (prop === "then") {
                    return undefined;
                }

                if (prop === "dehydrate") {
                    return () => {
                        return dehydrate(queryClient);
                    };
                }

                if (prop === "prefetch") {
                    return (options: any) => {
                        const queryKey = ["aether", props.join("."), JSON.stringify(options.input)];

                        return queryClient.prefetchQuery({
                            ...options,
                            queryKey,
                            queryFn: async () => {
                                const method = props.reduce((acc, key) => (acc as any)[key], client) as (
                                    data: any,
                                ) => Promise<any>;
                                return method(options.input);
                            },
                        });
                    };
                }

                if (prop === "prefetchInfinite") {
                    return (options: any) => {
                        const queryKey = ["aether", props.join("."), JSON.stringify(options.input)];

                        return queryClient.prefetchInfiniteQuery({
                            ...options,
                            queryKey,
                            queryFn: async ({ pageParam }) => {
                                const method = props.reduce((acc, key) => (acc as any)[key], client) as (
                                    data: any,
                                ) => Promise<any>;
                                return method({
                                    ...options.input,
                                    cursor: pageParam,
                                });
                            },
                        });
                    };
                }

                return buildServerHelpers([...props, prop]);
            },
        });
    };
    return buildServerHelpers<AetherisServerHelpers<Router>>([]) as AetherisServerHelpers<Router> & {
        dehydrate: () => DehydratedState;
    };
};
