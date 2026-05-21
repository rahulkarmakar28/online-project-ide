import axiosInstance from "../config/axiosConfig";

export interface AuthPayload {
    email:    string;
    password: string;
    name?:    string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        user:        { id: string; email: string; name?: string; createdAt: string };
        accessToken: string;
    };
}

export const loginApi = async (payload: AuthPayload): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post("/api/v1/auth/login", payload, {
        withCredentials: true,
    });
    return data;
};

export const registerApi = async (payload: AuthPayload): Promise<AuthResponse> => {
    const { data } = await axiosInstance.post("/api/v1/auth/register", payload, {
        withCredentials: true,
    });
    return data;
};

export const refreshApi = async (): Promise<{ token: string }> => {
    const { data } = await axiosInstance.post(
        "/api/v1/auth/refresh",
        {},
        { withCredentials: true },
    );
    return data.data;
};

export const logoutApi = async (): Promise<void> => {
    await axiosInstance.post("/api/v1/auth/logout", {}, { withCredentials: true });
};
