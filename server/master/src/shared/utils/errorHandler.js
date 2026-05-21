export const errorHandler = (err, req, res, next) => {
    const status = err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error(`[ERROR] ${status} — ${message}`, err.message);

    return res.status(status).json({
        success: false,
        message,
    });
};

export class AppError extends Error {
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}
