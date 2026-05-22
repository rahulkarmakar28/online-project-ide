import { Router } from "express";
import {
    createProjectController,
    getProjectTreeController,
    deleteProjectController,
    listProjectsController,
} from "../controllers/projectController.js";
import { authenticate } from "../../auth/middlewares/authenticate.js";

const projectRouter = Router();

projectRouter.use(authenticate);

projectRouter.get("/", listProjectsController);
projectRouter.post("/", createProjectController);
projectRouter.get("/:projectId", getProjectTreeController);
projectRouter.delete("/:projectId", deleteProjectController);

export default projectRouter;