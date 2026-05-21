import { verifyToken } from "../../../shared/utils/jwtUtils.js";
import { AppError } from "../../../shared/utils/errorHandler.js";

export const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || req.cookies?.token;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            throw new AppError("No token provided", 401);
        }

        const token = authHeader.split(" ")[1];
        const decoded = verifyToken(token);

        req.user = decoded; // { id, email, iat, exp }
        next();
    } catch (err) {
        if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
            return next(new AppError("Invalid or expired token", 401));
        }
        next(err);
    }
};
