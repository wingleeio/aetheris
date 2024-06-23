export type ProcedureResponse<Data> =
    | {
          status: number;
          data: Data;
      }
    | {
          status: number;
          data: any;
      };
