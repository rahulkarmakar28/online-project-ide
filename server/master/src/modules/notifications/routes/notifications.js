import { Router } from "express";
import { listNotificationsController, markReadController, markAllReadController, deleteNotificationController, clearAllController } from "../controllers/notificationController.js";
import { authenticate } from "../../auth/middlewares/authenticate.js";

const notificationRouter = Router();
notificationRouter.use(authenticate);

notificationRouter.get("/",             listNotificationsController);
notificationRouter.patch("/read-all",   markAllReadController);
notificationRouter.patch("/:id/read",   markReadController);
notificationRouter.delete("/clear-all", clearAllController);
notificationRouter.delete("/:id",       deleteNotificationController);

export default notificationRouter;