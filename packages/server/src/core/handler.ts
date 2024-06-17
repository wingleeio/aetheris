export type Handler<Context, Return> = (context: Context) => Return | Promise<Return>;
