import { Router } from "express";
import { createProjectController, getProjectTreeController, deleteProjectController, listProjectsController, toggleStarController } from "../controllers/projectController.js";
import { authenticate } from "../../auth/middlewares/authenticate.js";

const projectRouter = Router();
projectRouter.use(authenticate);

projectRouter.get("/", listProjectsController);
projectRouter.post("/", createProjectController);
projectRouter.get("/:projectId", getProjectTreeController);
projectRouter.delete("/:projectId", deleteProjectController);
projectRouter.patch("/:projectId/star", toggleStarController);

export default projectRouter;