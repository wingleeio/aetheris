import { ProcedureResponse } from "./procedure-response";

// TODO: Re-implement this type
// type TransformKey<Key> = Key extends `${infer Prefix}:` ? `${Prefix}:${string}` : Key;

type TransformResponse<R> = R extends Promise<ProcedureResponse<infer Data>> ? Promise<Data> : R;

type RemapFunction<Fn> = Fn extends (...args: [infer InputData, ...infer Rest]) => infer R
    ? Rest extends [any?]
        ? (input: InputData) => TransformResponse<R>
        : Fn
    : Fn;

type Resolver<IO extends { input: any; output: any }> = (input: IO["input"]) => Promise<IO["output"]>;

type AetherRouter<Router> = Router extends object
    ? {
          [Key in keyof Router]: Router[Key] extends Function
              ? RemapFunction<Router[Key]> extends (input: infer Input) => Promise<infer Output>
                  ? Resolver<{ input: Input; output: Output }>
                  : RemapFunction<Router[Key]>
              : Router[Key] extends object
                ? AetherRouter<Router[Key]>
                : Router[Key];
      }
    : Router;

export const router = <Router extends any>(router: Router): AetherRouter<Router> => router as AetherRouter<Router>;
