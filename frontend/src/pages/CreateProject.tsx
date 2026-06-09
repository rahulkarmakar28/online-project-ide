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
    "react-js":    { icon: <FaReact />,      label: "React JS",    color: "text-[#61dafb]" },
    "react-ts":    { icon: <SiTypescript />, label: "React TS",    color: "text-[#3178c6]" },
    "nextjs":      { icon: <FaCode />,       label: "Next.js",     color: "text-foreground" },
    "vue":         { icon: <SiVuedotjs />,   label: "Vue",         color: "text-[#42b883]" },
    "angular":     { icon: <SiAngular />,    label: "Angular",     color: "text-[#dd0031]" },
    "html-css-js": { icon: <FaCode />,       label: "HTML/CSS/JS", color: "text-[#e34c26]" },
    "nodejs":      { icon: <FaNodeJs />,     label: "Node.js",     color: "text-[#6cc24a]" },
    "hono":        { icon: <FaCode />,       label: "Hono",        color: "text-[#e36002]" },
    "python":      { icon: <FaPython />,     label: "Python",      color: "text-[#3776ab]" },
    "fastapi":     { icon: <SiFastapi />,    label: "FastAPI",     color: "text-[#009688]" },
    "flask":       { icon: <SiFlask />,      label: "Flask",       color: "text-foreground" },
    "django":      { icon: <SiDjango />,     label: "Django",      color: "text-[#44b78b]" },
    "spring-boot": { icon: <SiSpring />,     label: "Spring Boot", color: "text-[#6db33f]" },
    "go":          { icon: <SiGo />,         label: "Go",          color: "text-[#00add8]" },
    "rust":        { icon: <FaRust />,       label: "Rust",        color: "text-[#dea584]" },
    "java":        { icon: <FaJava />,       label: "Java",        color: "text-[#e76f00]" },
};

// ── Replit-style loading screen shown while project is being created ──────────
const CreatingScreen = ({ name, template }: { name: string; template: string }) => {
    const [step, setStep]   = useState(0);
    const [dots, setDots]   = useState("");
    const meta = TEMPLATE_ICONS[template];

    const steps = [
        "Initializing project",
        "Scaffolding template files",
        "Installing dependencies",
        "Setting up workspace",
        "Almost ready",
    ];

    useEffect(() => {
        const stepTimer = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 900);
        const dotTimer  = setInterval(() => setDots(d => d.length >= 3 ? "" : d + "."), 400);
        return () => { clearInterval(stepTimer); clearInterval(dotTimer); };
    }, []);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-sm text-center animate-fade-in">
                {/* Big animated icon */}
                <div className="relative w-24 h-24 mx-auto mb-8">
                    <div className="absolute inset-0 rounded-2xl gradient-brand opacity-20 animate-pulse" />
                    <div className="absolute inset-2 rounded-xl gradient-brand flex items-center justify-center">
                        <span className={`text-4xl ${meta?.color ?? "text-primary-foreground"}`}>
                            {meta?.icon ?? <FaCode />}
                        </span>
                    </div>
                    {/* Spinning ring */}
                    <svg className="absolute inset-0 w-full h-full animate-spin" viewBox="0 0 96 96">
                        <circle cx="48" cy="48" r="44" fill="none"
                            stroke="hsl(var(--primary))" strokeWidth="3"
                            strokeDasharray="60 220" strokeLinecap="round" />
                    </svg>
                </div>

                <h2 className="text-xl font-bold text-foreground mb-1">
                    Creating <span className="text-primary">{name}</span>
                </h2>
                <p className="text-sm text-muted-foreground mb-8">
                    {template} · {meta?.label}
                </p>

                {/* Step progress */}
                <div className="space-y-2 text-left mb-8">
                    {steps.map((s, i) => (
                        <div key={s} className={`flex items-center gap-2.5 text-sm transition-all duration-300
                            ${i < step  ? "text-primary"          : ""}
                            ${i === step ? "text-foreground font-medium" : ""}
                            ${i > step  ? "text-muted-foreground/40" : ""}`}
                        >
                            {i < step ? (
                                <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                                    <svg className="w-2.5 h-2.5 text-primary-foreground" viewBox="0 0 10 10" fill="none">
                                        <path d="M2 5l2.5 2.5L8 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                    </svg>
                                </span>
                            ) : i === step ? (
                                <span className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center flex-shrink-0">
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                                </span>
                            ) : (
                                <span className="w-4 h-4 rounded-full border border-muted-foreground/20 flex-shrink-0" />
                            )}
                            <span>
                                {s}{i === step ? dots : ""}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Progress bar */}
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full gradient-brand rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                    />
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────

const CreateProject = () => {
    const navigate = useNavigate();
    const { projects, setProjects } = useProjectStore();

    const [templates, setTemplates] = useState<string[]>(Object.keys(TEMPLATE_ICONS));
    const [selected,  setSelected]  = useState("react-js");
    const [name,      setName]      = useState("");
    const [loading,   setLoading]   = useState(false);
    const [creating,  setCreating]  = useState(false);  // locks the form
    const [projectId, setProjectId] = useState<string | null>(null);

    useEffect(() => {
        setLoading(true);
        listTemplatesApi()
            .then((list) => { if (list.length) setTemplates(list); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // Once we have the projectId and the loading screen has shown for at least
    // a beat, navigate to the playground
    useEffect(() => {
        if (!projectId) return;
        const t = setTimeout(() => navigate(`/projects/${projectId}`), 1200);
        return () => clearTimeout(t);
    }, [projectId]);

    const handleCreate = async () => {
        const trimmed = name.trim().replace(/\s+/g, "_");
        if (!trimmed) { toast.error("Please enter a project name"); return; }

        // Lock form — user cannot go back or change name while creating
        setCreating(true);

        try {
            const res = await createProjectApi({ template: selected, name: trimmed });
            if (!res.success) {
                toast.error("Failed to create project");
                setCreating(false);
                return;
            }
            setProjects([...projects, { ...res.data, starred: false }]);
            // Show the loading screen — navigate happens in useEffect above
            setProjectId(res.data.id);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to create project");
            setCreating(false);
        }
    };

    // ── Show Replit-style loading screen while creating ───────────────────────
    if (creating) {
        return <CreatingScreen name={name.trim()} template={selected} />;
    }

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
                    <p className="text-sm text-muted-foreground mb-6">
                        Name your project and choose a template.
                    </p>

                    {/* Project name */}
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                        Project Name <span className="text-destructive">*</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) handleCreate(); }}
                        placeholder="my-awesome-project"
                        maxLength={60}
                        autoFocus
                        className="w-full rounded-lg px-3 py-2.5 text-sm outline-none
                            border focus:ring-2 focus:ring-ring transition-all duration-200 mb-6"
                        style={{
                            background:  "hsl(var(--input))",
                            color:       "hsl(var(--foreground))",
                            borderColor: "hsl(var(--border))",
                        }}
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
                                                : "border-border hover:border-primary/40 hover:bg-accent/30"}`}
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
                        <span className={`text-xl flex-shrink-0 ${TEMPLATE_ICONS[selected]?.color ?? "text-muted-foreground"}`}>
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
                        disabled={!name.trim()}
                        className="w-full py-2.5 rounded-lg text-sm font-semibold gradient-brand
                            text-primary-foreground shadow-glow hover:opacity-90 transition-opacity
                            disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Create Project
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CreateProject;