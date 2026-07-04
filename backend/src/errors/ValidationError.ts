import { AppError } from "./AppError";

export class ValidationError extends AppError {
    constructor(message = "Validation failed") {
        super(400, "VALIDATION_ERROR", message);
    }
}
