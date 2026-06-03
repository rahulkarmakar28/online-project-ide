import { registerService, loginService } from "../service/authService.js";
import jwt from "jsonwebtoken";
import { JWT_REFRESH_SECRET } from "../../../shared/config/serverConfig.js";
import { signToken } from "../../../shared/utils/jwtUtils.js";

// Cookie options — secure:false so cookies work over HTTP (Docker/dev).
// In production behind HTTPS, change secure to true.
const COOKIE_OPTS = {
    httpOnly: true,
    secure:   false,   // FIX: was true — broke cookies over HTTP in Docker
    sameSite: "lax",
    maxAge:   7 * 24 * 60 * 60 * 1000,
};

const REFRESH_COOKIE_OPTS = {
    httpOnly: true,
    secure:   false,   // FIX: same
    sameSite: "lax",
    maxAge:   7 * 24 * 60 * 60 * 1000,
};

export const registerController = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await registerService({ email, password });
        return res
            .status(201)
            .cookie("token", result.token, COOKIE_OPTS)
            .cookie("refresh_token", result.refresh_token, REFRESH_COOKIE_OPTS)
            .json({ success: true, message: "Registered", data: result });
    } catch (err) {
        next(err);
    }
};

export const loginController = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await loginService({ email, password });
        return res
            .cookie("token", result.token, COOKIE_OPTS)
            .cookie("refresh_token", result.refresh_token, REFRESH_COOKIE_OPTS)
            .status(200)
            .json({ success: true, message: "Logged in", data: result });
    } catch (err) {
        next(err);
    }
};

export const refreshController = async (req, res, next) => {
    try {
        const token = req.cookies?.refresh_token || req.cookies?.refreshToken;

        if (!token) {
            return res.status(401).json({ success: false, message: "No token provided" });
        }

        const decoded     = jwt.verify(token, JWT_REFRESH_SECRET);
        const accessToken = signToken({ id: decoded.id, email: decoded.email });

        return res
            .cookie("token", accessToken, COOKIE_OPTS)
            .status(200)
            .json({ success: true, message: "Token refreshed", data: { token: accessToken } });
    } catch (err) {
        next(err);
    }
};

export const logoutController = async (req, res, next) => {
    try {
        res
            .clearCookie("token",         { httpOnly: true, secure: false, sameSite: "lax" })
            .clearCookie("refresh_token", { httpOnly: true, secure: false, sameSite: "lax" });
        return res.status(200).json({ success: true, message: "Logged out successfully" });
    } catch (err) {
        next(err);
    }
};