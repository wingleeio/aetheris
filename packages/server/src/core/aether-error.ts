export class AetherError extends Error {
    constructor(
        public error: {
            status: number;
            message?: string;
            data?: any;
        },
    ) {
        super(error.message);
    }
}
