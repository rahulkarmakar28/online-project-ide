import { registerService, loginService } from "../service/authService.js";
import jwt, { decode } from "jsonwebtoken";
import { JWT_REFRESH_SECRET } from "../../../shared/config/serverConfig.js";
import {signToken} from "../../../shared/utils/jwtUtils.js"


export const registerController = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await registerService({ email, password });
        return res
            .status(201)
            .cookie("token", result.token, {
                httpOnly: true,
                secure: true,
                sameSite: "lax",
            })
            .cookie("refresh_token", result.refresh_token, {
                httpOnly: true,
                secure: true,
                sameSite: "lax",
            })
            .json({ success: true, message: "Registered", data: result });
    } catch (err) {
        next(err);
    }
};

export const loginController = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await loginService({ email, password });
        // console.log("Login successful, preparing response...", result);
        return res
            .cookie("token", result.token, {
                httpOnly: true,
                secure: true,
                sameSite: "lax",
            })
            .cookie("refresh_token", result.refresh_token, {
                httpOnly: true,
                secure: true,
                sameSite: "lax",
            })
            .status(200)
            .json({ success: true, message: "Logged in", data: result });
    } catch (err) {
        next(err);
    }
};

export const refreshController = async (req, res, next) => {
    try {
        const token = req.cookies?.refresh_token||req.cookies?.refreshToken; // refresh token from cookie

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No token provided",
            });
        }

        // verify refresh token
        const decoded = jwt.verify(token, JWT_REFRESH_SECRET);

        // generate new access token
        const accessToken = signToken({id:decoded.id, email:decoded.email});

        return res
            .cookie("token", accessToken, {
                httpOnly: true,
                secure: true,
                sameSite: "lax",
            })
            .status(200)
            .json({
                success: true,
                message: "Token refreshed",
                data: { token:accessToken },
            });
    } catch (err) {
        next(err);
    }
};

export const logoutController = async (req, res, next) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
        }).clearCookie("refresh_token", {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (err) {
        next(err);
    }
};
