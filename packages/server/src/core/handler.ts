export type Handler<Return, Context, Input = void> = (context: Context & { input: Input }) => Return | Promise<Return>;
