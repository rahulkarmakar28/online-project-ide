import { create } from "zustand";
import { listProjectsApi, deleteProjectApi } from "../apis/projects";

export interface Project {
    id:        string;
    name:      string;      // real name from backend
    template:  string;
    starred?:  boolean;
    createdAt: string;
}

interface ProjectStore {
    projects: Project[];
    loading:  boolean;
    fetchProjects:  () => Promise<void>;
    deleteProject:  (id: string) => Promise<void>;
    toggleStar:     (id: string) => void;
    setProjects:    (projects: Project[]) => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
    projects: [],
    loading:  false,

    fetchProjects: async () => {
        set({ loading: true });
        try {
            const res = await listProjectsApi();
            if (res.success) {
                // Use real name from backend; fall back only if absent (legacy rows)
                const enriched = res.data.map((p) => ({
                    ...p,
                    name:    p.name || `${p.template}-${p.id.slice(0, 6)}`,
                    starred: p.starred ?? false,
                }));
                set({ projects: enriched });
            }
        } finally {
            set({ loading: false });
        }
    },

    deleteProject: async (id: string) => {
        await deleteProjectApi(id);
        set((s) => ({ projects: s.projects.filter((p) => p.id !== id) }));
    },

    toggleStar: (id: string) =>
        set((s) => ({
            projects: s.projects.map((p) =>
                p.id === id ? { ...p, starred: !p.starred } : p,
            ),
        })),

    setProjects: (projects) => set({ projects }),
}));
