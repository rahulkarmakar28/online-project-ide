import { verifyToken } from "../../../shared/utils/jwtUtils.js";
import { AppError } from "../../../shared/utils/errorHandler.js";
import prisma from "../../../shared/db/prisma.js";

export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization || req.cookies?.token;

        if (!authHeader) {
            throw new AppError("No token provided", 401);
        }

        // Cookie stores raw token, header stores "Bearer <token>"
        const token = authHeader.startsWith("Bearer ")
            ? authHeader.split(" ")[1]
            : authHeader;

        if (!token || token === "undefined" || token === "null") {
            throw new AppError("Invalid token", 401);
        }

        const decoded = verifyToken(token);

        // FIX: verify user actually exists in DB — prevents FK violations
        // when the DB was wiped but the browser still has an old JWT
        const user = await prisma.user.findUnique({
            where:  { id: decoded.id },
            select: { id: true, email: true },
        });

        if (!user) {
            throw new AppError("User not found — please log in again", 401);
        }

        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
            return next(new AppError("Invalid or expired token", 401));
        }
        next(err);
    }
};