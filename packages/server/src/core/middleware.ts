export type Middleware<Context> = (context: Context) => Partial<Context> | Promise<Partial<Context>>;
