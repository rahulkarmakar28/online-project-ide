import { create } from "zustand";
import { listProjectsApi, deleteProjectApi, toggleStarApi } from "../apis/projects";

export interface Project {
    id: string; name: string; template: string; starred: boolean; createdAt: string;
}

const starDebounceMap = new Map<string, ReturnType<typeof setTimeout>>();

interface ProjectStore {
    projects: Project[]; loading: boolean;
    fetchProjects: () => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    toggleStar:    (id: string) => void;
    setProjects:   (p: Project[]) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
    projects: [], loading: false,

    fetchProjects: async () => {
        set({ loading: true });
        try {
            const res = await listProjectsApi();
            if (res.success) set({ projects: res.data.map((p: any) => ({ ...p, starred: p.starred ?? false })) });
        } finally { set({ loading: false }); }
    },

    deleteProject: async (id) => {
        await deleteProjectApi(id);
        set(s => ({ projects: s.projects.filter(p => p.id !== id) }));
    },

    toggleStar: (id) => {
        // Optimistic update immediately
        set(s => ({ projects: s.projects.map(p => p.id === id ? { ...p, starred: !p.starred } : p) }));

        // Debounce API call — cancel if toggled again within 600ms
        if (starDebounceMap.has(id)) { clearTimeout(starDebounceMap.get(id)!); starDebounceMap.delete(id); }

        const timer = setTimeout(async () => {
            starDebounceMap.delete(id);
            try {
                await toggleStarApi(id);
            } catch {
                // Revert on error
                set(s => ({ projects: s.projects.map(p => p.id === id ? { ...p, starred: !p.starred } : p) }));
            }
        }, 600);

        starDebounceMap.set(id, timer);
    },

    setProjects: (projects) => set({ projects }),
}));