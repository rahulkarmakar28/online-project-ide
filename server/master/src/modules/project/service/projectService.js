import { v4 as uuid } from "uuid";
import fs from "fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import directoryTree from "directory-tree";

import prisma from "../../../shared/db/prisma.js";
import { getStrategy, TEMPLATE_NAMES } from "../../templets/templateRegistry.js";
import { AppError } from "../../../shared/utils/errorHandler.js";

const __filename    = fileURLToPath(import.meta.url);
const __dirname     = path.dirname(__filename);
const PROJECTS_ROOT = path.resolve(__dirname, "../../../../../", "projects");

export const createProjectService = async ({ userId, template, name }) => {
    if (!TEMPLATE_NAMES.includes(template)) {
        throw new AppError(`Invalid template "${template}". Valid: ${TEMPLATE_NAMES.join(", ")}`, 400);
    }
    const projectId   = uuid();
    const projectName = name?.trim() || `${template}-${projectId.slice(0, 6)}`;
    const projectPath = path.join(PROJECTS_ROOT, projectId);

    await fs.mkdir(projectPath, { recursive: true });
    await fs.chmod(projectPath, 0o777);

    const strategy = getStrategy(template);
    await strategy.scaffold(projectId, projectPath, projectName);

    const project = await prisma.project.create({
        data: { id: projectId, name: projectName, userId, template },
    });

    await prisma.notification.create({
        data: { userId, title: "Project created", message: `"${projectName}" is ready using the ${template} template.`, type: "success" },
    }).catch(() => {});

    return project;
};

export const getProjectTreeService = async ({ projectId, userId }) => {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw new AppError("Project not found", 404);

    const tree = directoryTree(path.join(PROJECTS_ROOT, projectId), {
        exclude: /node_modules|\.git|__pycache__|target\/debug/,
    });
    return { tree, template: project.template, name: project.name };
};

export const deleteProjectService = async ({ projectId, userId }) => {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw new AppError("Project not found", 404);

    await prisma.project.delete({ where: { id: projectId } });
    // No sudo needed — Node owns the folder it created
    await fs.rm(path.join(PROJECTS_ROOT, projectId), { recursive: true, force: true });

    await prisma.notification.create({
        data: { userId, title: "Project deleted", message: `"${project.name}" has been permanently deleted.`, type: "info" },
    }).catch(() => {});

    return { projectId };
};

export const listProjectsService = async ({ userId }) =>
    prisma.project.findMany({
        where:   { userId },
        orderBy: { createdAt: "desc" },
        select:  { id: true, name: true, template: true, starred: true, createdAt: true },
    });

export const toggleStarService = async ({ projectId, userId }) => {
    const project = await prisma.project.findFirst({ where: { id: projectId, userId } });
    if (!project) throw new AppError("Project not found", 404);
    return prisma.project.update({
        where:  { id: projectId },
        data:   { starred: !project.starred },
        select: { id: true, starred: true },
    });
};