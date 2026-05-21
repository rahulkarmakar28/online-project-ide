import { create } from "zustand";

interface User {
    id:        string;
    email:     string;
    name?:     string;
    createdAt?: string;
}

interface UserStore {
    user:     User | null;
    token:    string | null;
    setUser:  (user: User | null) => void;
    setToken: (token: string | null) => void;
    logout:   () => void;
}

export const useUserStore = create<UserStore>((set) => ({
    user:  null,
    token: null,

    setUser:  (user)  => set({ user }),
    setToken: (token) => set({ token }),

    logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        set({ user: null, token: null });
    },
}));
