import {
    createProjectService, getProjectTreeService,
    deleteProjectService, listProjectsService, toggleStarService,
} from "../service/projectService.js";

export const createProjectController = async (req, res, next) => {
    try {
        const project = await createProjectService({ userId: req.user.id, template: req.body.template, name: req.body.name });
        res.status(201).json({ success: true, message: "Project created", data: project });
    } catch (e) {
        next(e);
    }
};

export const getProjectTreeController = async (req, res, next) => {
    try {
        const data = await getProjectTreeService({ projectId: req.params.projectId, userId: req.user.id });
        res.status(200).json({ success: true, data });
    } catch (e) {
        next(e);
    }
};

export const deleteProjectController = async (req, res, next) => {
    try {
        const data = await deleteProjectService({ projectId: req.params.projectId, userId: req.user.id });
        res.status(200).json({ success: true, data });
    } catch (e) {
        next(e);
    }
};

export const listProjectsController = async (req, res, next) => {
    try {
        const data = await listProjectsService({ userId: req.user.id });
        res.status(200).json({ success: true, data });
    } catch (e) {
        next(e);
    }
};

export const toggleStarController = async (req, res, next) => {
    try {
        const data = await toggleStarService({ projectId: req.params.projectId, userId: req.user.id });
        res.status(200).json({ success: true, data });
    } catch (e) {
        next(e);
    }
};