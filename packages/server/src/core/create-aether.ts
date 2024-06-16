import { DefaultContext, Procedure } from "./procedure";

export type Unwrapped<T> = T extends PromiseLike<infer U> ? U : T;

export const createAether = <ContextCreator extends (...args: any[]) => any>() => {
    return new Procedure<Unwrapped<ReturnType<ContextCreator>> & DefaultContext>();
};
