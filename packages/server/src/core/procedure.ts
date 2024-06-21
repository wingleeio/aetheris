import { ZodType, z } from "zod";

import { AetherisError } from "./aetheris-error";
import { CookieManager } from "./cookie-manager";
import { Handler } from "./handler";
import { Middleware } from "./middleware";

export type ProcedureResponse<Data> =
    | {
          status: number;
          data: Data;
      }
    | {
          status: number;
          data: any;
      };

export type AetherisContext<
    InputSchema extends ZodType<any, any, any> | void = void,
    ParamsSchema extends ZodType<any, any, any> | void = void,
> = {
    path: string;
    cookies: CookieManager;
    input: InputSchema extends ZodType<any, any, any> ? z.infer<InputSchema> : any;
    params: ParamsSchema extends ZodType<any, any, any> ? z.infer<ParamsSchema> : Record<string, string>;
};

export class Procedure<Context extends AetherisContext> {
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

    public validate<Schema extends ZodType<any, any, any> | void = void>(schema: Schema, data: any) {
        if (schema) {
            const result = schema.safeParse(data);
            if (!result.success) {
                const errorDetails = result.error.errors.map((err) => ({
                    path: err.path,
                    message: err.message,
                }));
                throw new AetherisError({
                    status: 400,
                    message: "Error validating input",
                    data: errorDetails,
                });
            }
        }
    }

    public handler<
        R,
        InputSchema extends ZodType<any, any, any> | void = void,
        OutputSchema extends ZodType<any, any, any> | void = void,
        ParamsSchema extends ZodType<any, any, any> | void = void,
        HandlerContext = AetherisContext<InputSchema, ParamsSchema> & Omit<Context, "input" | "params">,
    >(config: {
        input?: InputSchema;
        output?: OutputSchema;
        params?: ParamsSchema;
        resolve: Handler<HandlerContext, OutputSchema extends ZodType<any, any, any> ? z.infer<OutputSchema> : R>;
    }) {
        const { input, output, params, resolve } = config;
        return async (
            data: InputSchema extends ZodType<any, any, any> ? z.infer<InputSchema> : void,
            defaultContext: HandlerContext,
        ): Promise<ProcedureResponse<OutputSchema extends ZodType<any, any, any> ? z.infer<OutputSchema> : R>> => {
            try {
                const context = {
                    ...defaultContext,
                    ...(await this.applyMiddlewares({ ...this.context, ...defaultContext })),
                };

                this.validate(input, data);
                this.validate(params, context.params);

                const response = await resolve({ ...context, input: data });

                this.validate(output, response);

                return {
                    status: 200,
                    data: response,
                };
            } catch (e) {
                if (e instanceof AetherisError) {
                    return {
                        status: e.error.status,
                        data: {
                            message: e.message,
                            details: e.error.data,
                        },
                    };
                }
                return {
                    status: 500,
                    data: {
                        message: (e as Error).message,
                    },
                };
            }
        };
    }
}
