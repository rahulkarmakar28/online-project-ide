import jwt from "jsonwebtoken";
import {
    JWT_SECRET,
    JWT_EXPIRES_IN,
    JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES_IN,
} from "../config/serverConfig.js";

export const signToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const signRefreshToken = (payload) => {
    return jwt.sign(payload, JWT_REFRESH_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN,
    });
};

export const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};

export const verifyRefreshToken = (token) => {
    return jwt.verify(token, JWT_REFRESH_SECRET);
};
