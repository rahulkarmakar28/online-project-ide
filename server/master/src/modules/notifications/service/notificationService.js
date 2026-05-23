import prisma from "../../../shared/db/prisma.js";
import { AppError } from "../../../shared/utils/errorHandler.js";

export const listNotificationsService = ({ userId }) =>
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });

export const markReadService = async ({ notificationId, userId }) => {
    const n = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
    if (!n) throw new AppError("Not found", 404);
    return prisma.notification.update({ where: { id: notificationId }, data: { read: true } });
};

export const markAllReadService = async ({ userId }) => {
    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
    return { success: true };
};

export const deleteNotificationService = async ({ notificationId, userId }) => {
    const n = await prisma.notification.findFirst({ where: { id: notificationId, userId } });
    if (!n) throw new AppError("Not found", 404);
    await prisma.notification.delete({ where: { id: notificationId } });
    return { notificationId };
};

export const clearAllNotificationsService = async ({ userId }) => {
    await prisma.notification.deleteMany({ where: { userId } });
    return { success: true };
};