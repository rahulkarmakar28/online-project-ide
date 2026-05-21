import express from "express";
import { createServer } from "node:http";
import cors from "cors";
import cookieParser from "cookie-parser";

import routes from "./routes/index.js";
import { PORT } from "./shared/config/serverConfig.js";
import { errorHandler } from "./shared/utils/errorHandler.js";

const app = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());
app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:8080",
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    }),
);

app.use("/api", routes);
app.get("/health", (req, res) => {
    res.send("Hello World!");
});
app.use(errorHandler);

server.listen(PORT, () =>
    console.log(`Master server running on port: ${PORT}`),
);
