import { Router } from "express";
import authRouter         from "../../modules/auth/routes/auth.js";
import templetRouter      from "../../modules/templets/routes/templets.js";
import projectRouter      from "../../modules/project/routes/projects.js";
import notificationRouter from "../../modules/notifications/routes/notifications.js";

const router = Router();

router.use("/auth",          authRouter);
router.use("/templates",     templetRouter);
router.use("/projects",      projectRouter);
router.use("/notifications", notificationRouter);

export default router;