import { ZodType, z } from "zod";
import { Handler } from "./handler";
import { Middleware } from "./middleware";

export type DefaultContext = {
    path: string;
};

export class Procedure<Context extends DefaultContext> {
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

    public handler<R, InputSchema = void, OutputSchema extends ZodType<any, any, any> | void = void>(config: {
        input?: ZodType<InputSchema>;
        output?: OutputSchema;
        resolve: Handler<OutputSchema extends ZodType<any, any, any> ? z.infer<OutputSchema> : R, Context, InputSchema>;
    }) {
        const { input, output, resolve } = config;
        return async (data: InputSchema, defaultContext: object) => {
            try {
                const context = {
                    ...defaultContext,
                    ...(await this.applyMiddlewares({ ...this.context, ...(defaultContext as Context) })),
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
                    data = result.data;
                }

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
            } catch (e) {
                const message = e instanceof Error ? e.message : e;
                return { error: message };
            }
        };
    }
}
