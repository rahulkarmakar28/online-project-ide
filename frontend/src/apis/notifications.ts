import axiosInstance from "../config/axiosConfig";

export const listNotificationsApi = async () => {
    const { data } = await axiosInstance.get("/api/v1/notifications"); return data;
};
export const markReadApi = async (id: string) => {
    const { data } = await axiosInstance.patch(`/api/v1/notifications/${id}/read`);
    return data;
};
export const markAllReadApi = async () => {
    const { data } = await axiosInstance.patch("/api/v1/notifications/read-all");
    return data;
};
export const deleteNotificationApi = async (id: string) => {
    const { data } = await axiosInstance.delete(`/api/v1/notifications/${id}`);
    return data;
};
export const clearAllApi = async () => {
    const { data } = await axiosInstance.delete("/api/v1/notifications/clear-all");
    return data;
};