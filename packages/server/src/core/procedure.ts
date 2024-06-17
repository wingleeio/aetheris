import { ZodType, z } from "zod";
import { Handler } from "./handler";
import { Middleware } from "./middleware";

export type AetherContext<
    InputSchema extends ZodType<any, any, any> | void = void,
    ParamsSchema extends ZodType<any, any, any> | void = void,
> = {
    path: string;
    input: InputSchema extends ZodType<any, any, any> ? z.infer<InputSchema> : any;
    params: ParamsSchema extends ZodType<any, any, any> ? z.infer<ParamsSchema> : Record<string, string>;
};

export class Procedure<Context extends AetherContext> {
    constructor(
        private context: Context = {} as Context,
        private middlewares: Array<Middleware<Context>> = [],
    ) {}

    public use<NewContext extends object | void>(
        createContext: (context: Context) => Partial<NewContext> | Promise<Partial<NewContext>>,
    ) {
        const newMiddlewares = [...this.middlewares, (context: Context) => createContext(context) ?? {}] as Array<
            (context: Context) => Partial<Context & NewContext> | Promise<Partial<Context & NewContext>>
        >;
        return new Procedure<Context & NewContext>(this.context as Context & NewContext, newMiddlewares);
    }

    private async applyMiddlewares(context: Context): Promise<Context> {
        let accumulatedContext = context;
        for (const middleware of this.middlewares) {
            const partialContext = await middleware(accumulatedContext);
            accumulatedContext = { ...accumulatedContext, ...partialContext };
        }
        return accumulatedContext;
    }

    public handler<
        R,
        InputSchema extends ZodType<any, any, any> | void = void,
        OutputSchema extends ZodType<any, any, any> | void = void,
        ParamsSchema extends ZodType<any, any, any> | void = void,
        HandlerContext = AetherContext<InputSchema, ParamsSchema> & Omit<Context, "input" | "params">,
    >(config: {
        input?: InputSchema;
        output?: OutputSchema;
        params?: ParamsSchema;
        resolve: Handler<HandlerContext, OutputSchema extends ZodType<any, any, any> ? z.infer<OutputSchema> : R>;
    }) {
        const { input, output, params, resolve } = config;
        return async (
            data: InputSchema extends ZodType<any, any, any> ? z.infer<InputSchema> : void,
            defaultContext: Context,
        ) => {
            const context = {
                ...defaultContext,
                ...(await this.applyMiddlewares({ ...this.context, defaultContext })),
            };

            if (input) {
                const result = input.safeParse(data);
                if (!result.success) {
                    const errorDetails = result.error.errors.map((err) => ({
                        path: err.path,
                        message: err.message,
                    }));
                    throw new Error(JSON.stringify(errorDetails));
                }
            }

            //TODO: Can we do this without ts-ignore?
            //@ts-ignore
            const response = await resolve({ ...context, input: data });

            if (output) {
                const outputResult = output.safeParse(response);
                if (!outputResult.success) {
                    const errorDetails = outputResult.error.errors.map((err) => ({
                        path: err.path,
                        message: err.message,
                    }));
                    throw new Error(JSON.stringify(errorDetails));
                }
                return response;
            } else {
                return response;
            }
        };
    }
}
