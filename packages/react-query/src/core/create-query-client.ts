import {
    UseMutationOptions,
    UseMutationResult,
    UseQueryOptions,
    UseQueryResult,
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
    } & OptionalInput<IO["input"]>
) => {
    unsubscribe: () => void;
};

type UseQuery<IO extends { input: any; response: any }> = (
    options: Omit<UseQueryOptions, "queryKey"> & OptionalInput<IO["input"]>
) => UseQueryResult<IO["response"], Error> & { queryKey: any[] };

type UseMutation<IO extends { input: any; response: any }> = (
    options?: UseMutationOptions
) => UseMutationResult<IO["response"], Error, IO["input"]>;

export type AetherQueryClient<T> = T extends Listener<{ input: infer Input; message: infer Message }>
    ? {
          useSubscription: UseSubscription<{ input: Input; message: Message }>;
      }
    : {
          [K in keyof T]: T[K] extends (inputData: infer Input) => Promise<infer R>
              ? {
                    useQuery: UseQuery<{ input: Input; response: R }>;
                    useMutation: UseMutation<{ input: Input; response: R }>;
                }
              : AetherQueryClient<T[K]>;
      };

export const createQueryClient = <Router extends object>(
    client: Router,
    useAetherContext: UseAetherisContext
): AetherQueryClient<Router> => {
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
                                        data: any
                                    ) => Promise<any>;
                                    return method(options.input);
                                },
                                ...options,
                            },
                            queryClient
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
                                        data: any
                                    ) => Promise<any>;
                                    return method(data);
                                },
                                ...options,
                            },
                            queryClient
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
    return buildQueryHook<AetherQueryClient<Router>>([]);
};