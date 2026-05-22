import { v4 as uuid } from "uuid";
import fs from "fs/promises";
import path from "node:path";
import directoryTree from "directory-tree/index.js";

import prisma from "../../../shared/db/prisma.js";
import { getStrategy, TEMPLATE_NAMES } from "../../templets/templateRegistry.js";
import { AppError } from "../../../shared/utils/errorHandler.js";

const PROJECTS_DIR = path.resolve(process.cwd(), "../projects");

export const createProjectService = async ({ userId, template, name }) => {
    if (!TEMPLATE_NAMES.includes(template)) {
        throw new AppError(
            `Invalid template "${template}". Valid options: ${TEMPLATE_NAMES.join(", ")}`,
            400,
        );
    }

    const projectId   = uuid();
    const projectName = name?.trim() || `${template}-${projectId.slice(0, 6)}`;
    const projectPath = path.join(PROJECTS_DIR, projectId);

    // Create with wide-open permissions so the container user can write freely
    await fs.mkdir(projectPath, { recursive: true });
    await fs.chmod(projectPath, 0o777);

    const strategy = getStrategy(template);
    await strategy.scaffold(projectId, projectPath, projectName);

    const project = await prisma.project.create({
        data: { id: projectId, name: projectName, userId, template },
    });

    return project;
};

export const getProjectTreeService = async ({ projectId, userId }) => {
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
    });
    if (!project) throw new AppError("Project not found", 404);

    const projectPath = path.join(PROJECTS_DIR, projectId);
    const tree = directoryTree(projectPath, {
        exclude: /node_modules|\.git|__pycache__|target\/debug/,
    });

    return { tree, template: project.template, name: project.name };
};

export const deleteProjectService = async ({ projectId, userId }) => {
    const project = await prisma.project.findFirst({
        where: { id: projectId, userId },
    });
    if (!project) throw new AppError("Project not found", 404);

    await prisma.project.delete({ where: { id: projectId } });

    const projectPath = path.join(PROJECTS_DIR, projectId);

    // force: true means no error if files are read-only or path doesn't exist.
    // No sudo needed — the Node process owns the projects/ folder.
    await fs.rm(projectPath, { recursive: true, force: true });

    return { projectId };
};

export const listProjectsService = async ({ userId }) => {
    return prisma.project.findMany({
        where:   { userId },
        orderBy: { createdAt: "desc" },
        select:  {
            id: true, name: true, template: true,
            starred: true, createdAt: true,
        },
    });
};