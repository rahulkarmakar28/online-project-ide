import { config } from "dotenv";
config();

export const PORT                   = process.env.PORT || 3000;
export const JWT_SECRET             = process.env.JWT_SECRET;
export const JWT_EXPIRES_IN         = process.env.JWT_EXPIRES_IN || "1d";
export const JWT_REFRESH_SECRET     = process.env.JWT_REFRESH_SECRET;
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "7d";
export const FRONTEND_URL           = process.env.FRONTEND_URL || "http://localhost:5173";
export const DATABASE_URL           = process.env.DATABASE_URL;
export const PROJECTS_DIR           = process.env.PROJECTS_DIR || "../projects";