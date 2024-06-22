import { Aetheris, AetherisContext } from "./aetheris";

type Resolved<T> = T extends PromiseLike<infer U> ? U : T;

export const createAetheris = <ContextCreator extends (...args: any[]) => {}>() => {
    return new Aetheris<Resolved<ReturnType<ContextCreator>> & AetherisContext>();
};
