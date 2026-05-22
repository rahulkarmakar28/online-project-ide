import {
    createProjectService,
    getProjectTreeService,
    deleteProjectService,
    listProjectsService,
} from "../service/projectService.js";

export const createProjectController = async (req, res, next) => {
    try {
        const { template, name } = req.body;
        const userId  = req.user.id;
        const project = await createProjectService({ userId, template, name });
        return res.status(201).json({
            success: true,
            message: "Project created",
            data:    project,
        });
    } catch (err) {
        next(err);
    }
};

export const getProjectTreeController = async (req, res, next) => {
    try {
        console.log("[getProjectTreeController] called with params:", req.params);
        const { projectId } = req.params;
        const userId = req.user.id;
        const data   = await getProjectTreeService({ projectId, userId });
        return res.status(200).json({
            success: true,
            message: "Successfully fetched the tree",
            data,
        });
    } catch (err) {
        next(err);
    }
};

export const deleteProjectController = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        const data   = await deleteProjectService({ projectId, userId });
        return res
            .status(200)
            .json({ success: true, message: "Project deleted", data });
    } catch (err) {
        next(err);
    }
};

export const listProjectsController = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const data   = await listProjectsService({ userId });
        return res.status(200).json({ success: true, data });
    } catch (err) {
        next(err);
    }
};
