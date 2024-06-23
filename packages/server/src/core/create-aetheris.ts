import { z } from "zod";
import { Aetheris, AetherisContext } from "./aetheris";
import { router } from "./router";

type Resolved<T> = T extends PromiseLike<infer U> ? U : T;

export const createAetheris = <ContextCreator extends (...args: any[]) => {}>() => {
    return new Aetheris<Resolved<ReturnType<ContextCreator>> & AetherisContext>();
};

const aether = createAetheris();

const app = router({
    helloWorld: aether.handler({
        resolve: async () => {
            return {
                message: `Hello from Aetheris!`,
            };
        },
    }),
    test: aether.subscription({
        output: z.object({
            message: z.string(),
        }),
        resolve: async ({ emit }) => {
            emit({ message: "Hello from Aetheris!" });
        },
    }),
});
