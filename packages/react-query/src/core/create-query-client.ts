import {
    InfiniteData,
    UseInfiniteQueryOptions,
    UseInfiniteQueryResult,
    UseMutationOptions,
    UseMutationResult,
    UseQueryOptions,
    UseQueryResult,
    useInfiniteQuery,
    useMutation,
    useQuery,
} from "@tanstack/react-query";

import React from "react";
import { UseAetherisContext } from "./create-aetheris-react";

type Listener<IO extends { input: any; message: any }> = {
    subscribe: (options: { input: IO["input"]; onMessage: (message: IO["message"]) => void }) => () => void;
};

type OptionalInput<T> = unknown extends T ? {} : T extends void | undefined ? {} : { input: T };

type UseSubscription<IO extends { input: any; message: any }> = (
    options: {
        onMessage: (message: IO["message"]) => void;
    } & OptionalInput<IO["input"]>,
) => {
    unsubscribe: () => void;
};

type UseQueryOptionsWithoutKey = Omit<UseQueryOptions, "queryKey">;

type UseQueryResultWithKey<T> = UseQueryResult<T, Error> & { queryKey: any[] };

type UseQueryWithInput<IO extends { input: any; response: any }> = (
    options: UseQueryOptionsWithoutKey & OptionalInput<IO["input"]>,
) => UseQueryResultWithKey<IO["response"]>;

type UseQueryWithoutInput<IO extends { input: any; response: any }> = (
    options?: UseQueryOptionsWithoutKey & OptionalInput<IO["input"]>,
) => UseQueryResultWithKey<IO["response"]>;

type UseQuery<IO extends { input: any; response: any }> = IO["input"] extends void
    ? UseQueryWithoutInput<IO>
    : UseQueryWithInput<IO>;

type UseInfiniteQueryInput<Input> = Omit<Input, "cursor">;

type UseInfiniteQuery<IO extends { input: any; response: any; cursor: any }> = (
    options: Omit<
        UseInfiniteQueryOptions<IO["response"], unknown, unknown, unknown, unknown[], IO["cursor"]>,
        "queryKey" | "queryFn"
    > &
        OptionalInput<IO["input"]>,
) => UseInfiniteQueryResult<InfiniteData<IO["response"]>, Error> & { queryKey: any[] };

type UseMutation<IO extends { input: any; response: any }> = (
    options?: UseMutationOptions<IO["response"]>,
) => UseMutationResult<IO["response"], Error, IO["input"]>;

export type AetherisQueryClient<T> =
    T extends Listener<{ input: infer Input; message: infer Message }>
        ? {
              useSubscription: UseSubscription<{ input: Input; message: Message }>;
          }
        : {
              [K in keyof T]: T[K] extends (inputData: infer Input) => Promise<infer R>
                  ? Input extends { cursor?: infer Cursor }
                      ? {
                            useQuery: UseQuery<{ input: Input; response: R }>;
                            useInfiniteQuery: UseInfiniteQuery<{
                                input: UseInfiniteQueryInput<Input>;
                                response: R;
                                cursor: Cursor;
                            }>;
                            useMutation: UseMutation<{ input: Input; response: R }>;
                        }
                      : Input extends { cursor: infer Cursor }
                        ? {
                              useQuery: UseQuery<{ input: Input; response: R }>;
                              useInfiniteQuery: UseInfiniteQuery<{
                                  input: UseInfiniteQueryInput<Input>;
                                  response: R;
                                  cursor: Cursor;
                              }>;
                              useMutation: UseMutation<{ input: Input; response: R }>;
                          }
                        : {
                              useQuery: UseQuery<{ input: Input; response: R }>;
                              useMutation: UseMutation<{ input: Input; response: R }>;
                          }
                  : AetherisQueryClient<T[K]>;
          };

export const createQueryClient = <Router extends object>(
    client: Router,
    useAetherContext: UseAetherisContext,
): AetherisQueryClient<Router> => {
    const subscriptions = new Map<
        string,
        { unsubscribe: () => void; count: number; callbacks: Set<(data: any) => void> }
    >();
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
                    const { queryClient } = useAetherContext();
                    return (options: any = { input: void 0 }) => {
                        const queryKey = ["aether", props.join("."), JSON.stringify(options.input)];
                        const query = useQuery(
                            {
                                queryKey,
                                queryFn: async () => {
                                    const method = props.reduce((acc, key) => (acc as any)[key], client) as (
                                        data: any,
                                    ) => Promise<any>;
                                    return method(options.input);
                                },
                                ...options,
                            },
                            queryClient,
                        );
                        return {
                            ...query,
                            queryKey,
                        };
                    };
                }

                if (prop === "useInfiniteQuery") {
                    const { queryClient } = useAetherContext();
                    return (options: any = { input: void 0 }) => {
                        const queryKey = ["aether", props.join("."), JSON.stringify(options.input)];
                        const query = useInfiniteQuery(
                            {
                                queryKey,
                                queryFn: async ({ pageParam }) => {
                                    const method = props.reduce((acc, key) => (acc as any)[key], client) as (
                                        data: any,
                                    ) => Promise<any>;
                                    return method({ ...options.input, cursor: pageParam });
                                },
                                ...options,
                            },
                            queryClient,
                        );
                        return {
                            ...query,
                            queryKey,
                        };
                    };
                }

                if (prop === "useMutation") {
                    const { queryClient } = useAetherContext();
                    return (options?: any) =>
                        useMutation(
                            {
                                mutationFn: async (data) => {
                                    const method = props.reduce((acc, key) => (acc as any)[key], client) as (
                                        data: any,
                                    ) => Promise<any>;
                                    return method(data);
                                },
                                ...options,
                            },
                            queryClient,
                        );
                }

                if (prop === "useSubscription") {
                    return (options: any) => {
                        const ref = React.useRef<() => void>();

                        React.useEffect(() => {
                            if (typeof window === "undefined") {
                                return;
                            }
                            const key = props.join(".") + JSON.stringify(options.input);

                            const handleMessage = (data: any) => {
                                const subscription = subscriptions.get(key);
                                if (subscription) {
                                    subscription.callbacks.forEach((cb) => cb(data));
                                }
                            };

                            if (subscriptions.has(key)) {
                                const subscription = subscriptions.get(key)!;
                                subscription.count++;
                                subscription.callbacks.add(options.onMessage);
                            } else {
                                const method = props.reduce((acc, key) => (acc as any)[key], client) as {
                                    subscribe: (data: any) => any;
                                };
                                const unsubscribe = method.subscribe({
                                    ...options,
                                    onMessage: handleMessage,
                                });
                                subscriptions.set(key, {
                                    unsubscribe,
                                    count: 1,
                                    callbacks: new Set([options.onMessage]),
                                });
                            }
                            ref.current = () => {
                                const subscription = subscriptions.get(key);
                                if (subscription) {
                                    subscription.count--;
                                    subscription.callbacks.delete(options.onMessage);
                                    if (subscription.count === 0) {
                                        subscription.unsubscribe();
                                        subscriptions.delete(key);
                                    }
                                }
                            };

                            return () => {
                                ref.current?.();
                            };
                        }, []);

                        return {
                            unsubscribe: ref.current,
                        };
                    };
                }

                return buildQueryHook([...props, prop]);
            },
        });
    };
    return buildQueryHook<AetherisQueryClient<Router>>([]);
};
