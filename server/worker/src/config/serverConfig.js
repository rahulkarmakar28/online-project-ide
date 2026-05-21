import { config } from "dotenv";
config();

export const TERMINAL_PORT = process.env.TERMINAL_PORT || 4000;
export const EDITOR_PORT   = process.env.EDITOR_PORT   || 5000;
export const PROJECTS_DIR  = process.env.PROJECTS_DIR  || "../projects";