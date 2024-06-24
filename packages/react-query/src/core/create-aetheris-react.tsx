import type { QueryClient } from "@tanstack/react-query";
import React from "react";
import { createQueryClient } from "./create-query-client";

type AetherisProviderProps = {
    queryClient: QueryClient;
    children: React.ReactNode;
};

type AetherisProvider = (props: AetherisProviderProps) => JSX.Element;

type AetherisContextState = {
    queryClient: QueryClient;
};

export type UseAetherisContext = () => AetherisContextState;

export const createAetherisReact = <Router extends object>(app: Router) => {
    const Context = React.createContext<AetherisContextState>(null as any);
    const AetherisProvider: AetherisProvider = ({ children, queryClient }) => {
        const context = React.useMemo(
            () => ({
                queryClient,
            }),
            [queryClient]
        );
        return <Context.Provider value={context}>{children}</Context.Provider>;
    };
    const useAetherisContext = () => React.useContext(Context);
    return {
        AetherisProvider,
        client: createQueryClient(app, useAetherisContext),
        useAetherisContext,
    };
};
