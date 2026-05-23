import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { VscArrowLeft } from "react-icons/vsc";
import { FaReact, FaPython, FaJava, FaRust, FaNodeJs, FaCode } from "react-icons/fa";
import {
    SiTypescript, SiGo, SiVuedotjs, SiAngular,
    SiDjango, SiFlask, SiFastapi, SiSpring,
} from "react-icons/si";
import { createProjectApi, listTemplatesApi } from "@/apis/projects";
import { useProjectStore } from "@/store/projectStore";


const TEMPLATE_ICONS: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
    "react-js": { icon: <FaReact />, label: "React JS", color: "text-[#61dafb]" },
    "react-ts": { icon: <SiTypescript />, label: "React TS", color: "text-[#3178c6]" },
    "nextjs": { icon: <FaCode />, label: "Next.js", color: "text-foreground" },
    "vue": { icon: <SiVuedotjs />, label: "Vue", color: "text-[#42b883]" },
    "angular": { icon: <SiAngular />, label: "Angular", color: "text-[#dd0031]" },
    "html-css-js": { icon: <FaCode />, label: "HTML/CSS/JS", color: "text-[#e34c26]" },
    "nodejs": { icon: <FaNodeJs />, label: "Node.js", color: "text-[#6cc24a]" },
    "hono": { icon: <FaCode />, label: "Hono", color: "text-[#e36002]" },
    "python": { icon: <FaPython />, label: "Python", color: "text-[#3776ab]" },
    "fastapi": { icon: <SiFastapi />, label: "FastAPI", color: "text-[#009688]" },
    "flask": { icon: <SiFlask />, label: "Flask", color: "text-foreground" },
    "django": { icon: <SiDjango />, label: "Django", color: "text-[#092e20]" },
    "spring-boot": { icon: <SiSpring />, label: "Spring Boot", color: "text-[#6db33f]" },
    "go": { icon: <SiGo />, label: "Go", color: "text-[#00add8]" },
    "rust": { icon: <FaRust />, label: "Rust", color: "text-[#dea584]" },
    "java": { icon: <FaJava />, label: "Java", color: "text-[#e76f00]" },
};

const CreateProject = () => {
    const navigate = useNavigate();
    const { projects, setProjects } = useProjectStore();


    const [templates, setTemplates] = useState<string[]>(Object.keys(TEMPLATE_ICONS));
    const [selected, setSelected] = useState("react-js");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        setLoading(true);
        listTemplatesApi()
            .then((list) => { if (list.length) setTemplates(list); })
            .catch(() => {/* fallback to hardcoded list */ })
            .finally(() => setLoading(false));
    }, []);

    const handleCreate = async () => {
        const trimmed = name.trim().replace(/\s+/g, "_");
        if (!trimmed) { toast.error("Please enter a project name"); return; }
        setCreating(true);
        try {
            const res = await createProjectApi({ template: selected, name: trimmed });
            console.log(res);
            if (!res.success) { toast.error("Failed to create project"); return; }
            //store it in project store
            setProjects([...projects, { ...res.data, starred: false }])
            toast.success("Project created!");
            navigate(`/projects/${res.data.id}`);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to create project");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-2xl animate-slide-up">
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
                >
                    <VscArrowLeft /> Back to Dashboard
                </button>

                <div className="gradient-card border border-border rounded-2xl p-6 sm:p-8">
                    <h1 className="text-xl font-bold text-foreground mb-1">Create New Project</h1>
                    <p className="text-sm text-muted-foreground mb-6">Name your project and choose a template.</p>

                    {/* Project name input */}
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        Project Name <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="my-awesome-project"
                        maxLength={60}
                        className="
                            w-full
                            bg-gray-100 dark:bg-gray-800
                            border border-gray-300 dark:border-gray-600
                            rounded-lg
                            px-3 py-2.5
                            text-sm
                            text-gray-900 dark:text-white
                            placeholder:text-gray-500 dark:placeholder:text-gray-400
                            outline-none
                            focus:ring-2 focus:ring-blue-500
                            focus:border-blue-500
                            transition-all
                            duration-200
                            mb-6
                        "
                    />

                    {/* Template grid */}
                    <label className="block text-sm font-medium text-foreground mb-3">Template</label>

                    {loading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="h-20 rounded-xl border border-border bg-muted animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-8">
                            {templates.map((t) => {
                                const meta = TEMPLATE_ICONS[t] ?? { icon: <FaCode />, label: t, color: "text-muted-foreground" };
                                return (
                                    <button
                                        key={t}
                                        onClick={() => setSelected(t)}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-center
                                            ${selected === t
                                                ? "border-primary bg-primary/10 shadow-glow"
                                                : "border-border hover:border-muted-foreground/30 hover:bg-accent/30"
                                            }`}
                                    >
                                        <span className={`text-2xl ${meta.color}`}>{meta.icon}</span>
                                        <span className="text-xs text-foreground leading-tight">{meta.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Selected summary */}
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-accent/20 mb-6">
                        <span className={`text-xl ${TEMPLATE_ICONS[selected]?.color ?? "text-muted-foreground"}`}>
                            {TEMPLATE_ICONS[selected]?.icon ?? <FaCode />}
                        </span>
                        <div>
                            <p className="text-sm font-medium text-foreground">
                                {name.trim() || <span className="text-muted-foreground italic">untitled</span>}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Template: <code className="font-code">{selected}</code>
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={creating || !name.trim()}
                        className="w-full py-2.5 rounded-lg text-sm font-semibold gradient-brand text-primary-foreground shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {creating ? (
                            <span className="flex items-center justify-center gap-2">
                                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                                Creating project…
                            </span>
                        ) : (
                            "Create Project"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateProject;
