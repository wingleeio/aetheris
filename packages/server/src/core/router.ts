import { ProcedureResponse } from "./procedure-response";

// TODO: Re-implement this type
// type TransformKey<Key> = Key extends `${infer Prefix}:` ? `${Prefix}:${string}` : Key;

type TransformResponse<R> = R extends Promise<ProcedureResponse<infer Data>> ? Promise<Data> : R;
type SubscriptionOptions<InputData, Message> = { input: InputData; onMessage: (message: Message) => void };
type RemapFunction<Fn, Key> = Fn extends (...args: [infer InputData, ...any[]]) => infer R
    ? Key extends "subscribe"
        ? (options: SubscriptionOptions<InputData, Awaited<TransformResponse<R>>>) => Unsubscriber
        : (input: InputData) => TransformResponse<R>
    : Fn;

type Resolver<IO extends { input: any; output: any }> = (input: IO["input"]) => Promise<IO["output"]>;
type Unsubscriber = () => void;
type Listener<IO extends { input: any; message: any }> = (
    options: IO["input"] extends void
        ? {
              onMessage: (message: IO["message"]) => void;
          }
        : {
              input: IO["input"];
              onMessage: (message: IO["message"]) => void;
          },
) => Unsubscriber;
type AetherRouter<Router> = Router extends object
    ? {
          [Key in keyof Router]: Router[Key] extends Function
              ? RemapFunction<Router[Key], Key> extends (input: infer Input) => Promise<infer Output>
                  ? Resolver<{ input: Input; output: Output }>
                  : RemapFunction<Router[Key], Key> extends (
                          options: SubscriptionOptions<infer Input, infer Message>,
                      ) => void
                    ? Listener<{ input: Input; message: Message }>
                    : RemapFunction<Router[Key], Key>
              : Router[Key] extends object
                ? AetherRouter<Router[Key]>
                : Router[Key];
      }
    : Router;

export const router = <Router extends any>(router: Router): AetherRouter<Router> => router as AetherRouter<Router>;
