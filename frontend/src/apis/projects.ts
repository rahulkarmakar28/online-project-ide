import axiosInstance from "../config/axiosConfig";

export interface ProjectResponse {
    id:        string;
    name:      string;
    userId?:   string;
    template:  string;
    starred?:  boolean;
    createdAt: string;
}

export const createProjectApi = async (payload: {
    template: string;
    name:     string;
}): Promise<{ success: boolean; data: ProjectResponse }> => {
    const { data } = await axiosInstance.post("/api/v1/projects", payload);
    return data;
};

export const listProjectsApi = async (): Promise<{
    success: boolean;
    data:    ProjectResponse[];
}> => {
    const { data } = await axiosInstance.get("/api/v1/projects");
    return data;
};

export const getProjectTreeApi = async (projectId: string) => {
    // console.log("calling ...")
    const { data } = await axiosInstance.get(`/api/v1/projects/${projectId}`);
    return data?.data; // { tree, template, name }
};

export const deleteProjectApi = async (projectId: string) => {
    const { data } = await axiosInstance.delete(`/api/v1/projects/${projectId}`);
    return data;
};

export const listTemplatesApi = async (): Promise<string[]> => {
    const { data } = await axiosInstance.get("/api/v1/templates");
    return data?.data ?? [];
};

export const toggleStarApi = async (projectId: string) => {
    const { data } = await axiosInstance.patch(`/api/v1/projects/${projectId}/star`);
    return data;
};