import { listNotificationsService, markReadService, markAllReadService, deleteNotificationService, clearAllNotificationsService } from "../service/notificationService.js";

export const listNotificationsController = async (req, res, next) => {
    try {
        res.json({ success: true, data: await listNotificationsService({ userId: req.user.id }) });
    } catch (e) {
        next(e);
    }
};

export const markReadController = async (req, res, next) => {
    try {
        res.json({ success: true, data: await markReadService({ notificationId: req.params.id, userId: req.user.id }) });
    } catch (e) {
        next(e);
    }
};

export const markAllReadController = async (req, res, next) => {
    try {
        res.json({ success: true, data: await markAllReadService({ userId: req.user.id }) });
    } catch (e) {
        next(e);
    }
};

export const deleteNotificationController = async (req, res, next) => {
    try {
        res.json({ success: true, data: await deleteNotificationService({ notificationId: req.params.id, userId: req.user.id }) });
    } catch (e) {
        next(e);
    }
};

export const clearAllController = async (req, res, next) => {
    try {
        res.json({ success: true, data: await clearAllNotificationsService({ userId: req.user.id }) });
    } catch (e) {
        next(e);
    }
};