export type CustomError = {
    code: ErrorCode,
    message: string
}

class CustomException extends Error {
    code: ErrorCode;

    constructor(code: ErrorCode, message: string) {
        super(message);
        this.code = code;
    }
};

export enum ErrorCode {
    INVALID_RESULT,
    INVALID_PARAM,
    UNEXPECTED_ERROR,
    OPERATION_CANCELED,
    SERVICE_UNAVAILABLE
}

export function throw_if_error(sbj: any, Throwable: any): void {
    if (!sbj || typeof sbj !== 'object') return
    if ("code" in sbj && "message" in sbj) throw new Throwable(sbj.code, sbj.message);
}


export class PaymentError extends CustomException { };
export class RefundError extends CustomException { };
export class SetupError extends CustomException { };