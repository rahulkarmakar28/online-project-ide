import axiosInstance from "../config/axiosConfig";

export interface AuthPayload {
    email:    string;
    password: string;
    name?:    string;
}

// FIX: backend returns { data: { token, user } } not { data: { accessToken, user } }
export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        user:  { id: string; email: string; name?: string; createdAt: string };
        token: string;  // ← was "accessToken" — doesn't match what backend sends
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