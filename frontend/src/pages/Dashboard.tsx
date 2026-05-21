import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjectStore } from "@/store/projectStore";
import { useNotificationStore } from "@/store/notificationStore";
import { useUserStore } from "@/store/userStore";
import { useThemeApplier } from "@/hooks/useThemeApplier";
import { SettingsDialog } from "@/components/ide/SettingsDialog";
import { toast } from "sonner";
import {
    VscAdd,
    VscStarFull,
    VscStarEmpty,
    VscSearch,
    VscSettingsGear,
    VscBell,
    VscTrash,
    VscClose,
    VscCheck,
    VscInfo,
    VscWarning,
    VscError,
} from "react-icons/vsc";
import { FaCode, FaPython, FaJava, FaRust, FaNodeJs } from "react-icons/fa";
import { SiTypescript, SiGo } from "react-icons/si";

const templateIcon: Record<string, React.ReactNode> = {
    "react-js": <FaCode style={{ color: "#61dafb" }} />,
    "react-ts": <SiTypescript style={{ color: "#3178c6" }} />,
    nextjs: <FaCode style={{ color: "#000" }} />,
    vue: <FaCode style={{ color: "#42b883" }} />,
    angular: <FaCode style={{ color: "#dd0031" }} />,
    nodejs: <FaNodeJs style={{ color: "#6cc24a" }} />,
    hono: <FaCode style={{ color: "#e36002" }} />,
    python: <FaPython style={{ color: "#3776ab" }} />,
    fastapi: <FaPython style={{ color: "#009688" }} />,
    flask: <FaPython style={{ color: "#000" }} />,
    django: <FaPython style={{ color: "#092e20" }} />,
    go: <SiGo style={{ color: "#00add8" }} />,
    rust: <FaRust style={{ color: "#dea584" }} />,
    java: <FaJava style={{ color: "#e76f00" }} />,
    "spring-boot": <FaJava style={{ color: "#6db33f" }} />,
    "html-css-js": <FaCode style={{ color: "#e34c26" }} />,
};

const notifIcon = (type: string) => {
    switch (type) {
        case "success":
            return <VscCheck style={{ color: "#4ec9b0" }} />;
        case "warning":
            return <VscWarning style={{ color: "#cca700" }} />;
        case "error":
            return <VscError style={{ color: "#f44747" }} />;
        default:
            return <VscInfo style={{ color: "#569cd6" }} />;
    }
};

const Dashboard = () => {
    useThemeApplier();
    const navigate = useNavigate();
    const { user, logout, setUser, setToken } = useUserStore();

    const { projects, loading, fetchProjects, deleteProject, toggleStar } =
        useProjectStore();
    const { notifications, markAllRead, removeNotification } =
        useNotificationStore();

    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"all" | "starred">("all");
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [open, setOpen] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);

    const unreadCount = notifications.filter((n) => !n.read).length;

    const filtered = projects
        .filter((p) => (filter === "starred" ? p.starred : true))
        .filter((p) =>
            (p.name ?? "").toLowerCase().includes(search.toLowerCase()),
        );

    // ── Fetch projects on mount ──────────────────────────────────────────────
    // AFTER:
    useEffect(() => {
        const token = localStorage.getItem("token");
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (token) setToken(token);
        if (user) setUser(user);
        fetchProjects();
    }, []);

    const handleDelete = async (id: string) => {
        setDeleting(id);
        try {
            await deleteProject(id);
            toast.success("Project deleted");
        } catch {
            toast.error("Failed to delete project");
        } finally {
            setDeleting(null);
            setConfirmDeleteId(null);
        }
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg gradient-brand" />
                        <span className="text-lg font-bold text-foreground">
                            CloudIDE
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setNotifOpen(!notifOpen);
                                    if (!notifOpen) markAllRead();
                                }}
                                className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors relative"
                            >
                                <VscBell className="text-lg" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full gradient-brand text-[9px] font-bold text-primary-foreground flex items-center justify-center">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                            {notifOpen && (
                                <div className="absolute right-0 top-11 w-80 rounded-lg border border-border bg-card shadow-xl z-50 overflow-hidden">
                                    <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                                        <span className="text-sm font-semibold text-foreground">
                                            Notifications
                                        </span>
                                        <button
                                            onClick={() => setNotifOpen(false)}
                                            className="p-0.5 rounded hover:bg-accent text-muted-foreground"
                                        >
                                            <VscClose className="text-sm" />
                                        </button>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                                                No notifications
                                            </div>
                                        ) : (
                                            notifications.map((n) => (
                                                <div
                                                    key={n.id}
                                                    className={`flex items-start gap-2 px-3 py-2.5 border-b border-border/50 ${!n.read ? "bg-accent/10" : ""}`}
                                                >
                                                    <span className="mt-0.5">
                                                        {notifIcon(n.type)}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs font-medium text-foreground">
                                                            {n.title}
                                                        </div>
                                                        <div className="text-[11px] text-muted-foreground truncate">
                                                            {n.message}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() =>
                                                            removeNotification(
                                                                n.id,
                                                            )
                                                        }
                                                        className="p-0.5 rounded hover:bg-accent text-muted-foreground"
                                                    >
                                                        <VscClose className="text-[10px]" />
                                                    </button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => setSettingsOpen(true)}
                            className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <VscSettingsGear className="text-lg" />
                        </button>

                        {/* Avatar / logout */}
                        <div className="relative group">
                            <div
                                onClick={() => setOpen((prev) => !prev)}
                                className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center text-primary-foreground text-sm font-semibold cursor-pointer"
                            >
                                {user?.email?.[0]?.toUpperCase() ?? "U"}
                            </div>
                            {open && (
                                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl z-50 min-w-[140px] py-1">
                                    <div className="px-3 py-1.5 text-xs text-muted-foreground truncate">
                                        {user?.email}
                                    </div>

                                    <div className="h-px bg-border mx-2 my-1" />

                                    <button
                                        onClick={handleLogout}
                                        className="w-full text-left px-3 py-1.5 text-sm text-foreground hover:bg-accent"
                                    >
                                        Sign out
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                {/* Welcome */}
                <div className="mb-8 animate-fade-in">
                    <h1 className="text-2xl font-bold text-foreground mb-1">
                        Welcome back
                    </h1>
                    <p className="text-muted-foreground">
                        Your cloud workspace is ready.
                    </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    {[
                        {
                            label: "Projects",
                            value: projects.length,
                            icon: <FaCode />,
                        },
                        {
                            label: "Starred",
                            value: projects.filter((p) => p.starred).length,
                            icon: <VscStarFull className="text-warning" />,
                        },
                        {
                            label: "Templates",
                            value: [...new Set(projects.map((p) => p.template))]
                                .length,
                            icon: "🧩",
                        },
                        {
                            label: "Notifications",
                            value: unreadCount,
                            icon: <VscBell />,
                        },
                    ].map((s) => (
                        <div
                            key={s.label}
                            className="gradient-card border border-border rounded-xl p-4 animate-slide-up"
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-muted-foreground uppercase tracking-wider">
                                    {s.label}
                                </span>
                                <span className="text-muted-foreground">
                                    {s.icon}
                                </span>
                            </div>
                            <span className="text-xl font-bold text-foreground">
                                {s.value}
                            </span>
                        </div>
                    ))}
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-6">
                    <div className="flex gap-2">
                        {(["all", "starred"] as const).map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${filter === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"}`}
                            >
                                {f === "all" ? "All Projects" : "Starred"}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-64">
                            <VscSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search projects..."
                                className="w-full bg-input border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                        <button
                            onClick={() => navigate("/projects/new")}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium gradient-brand text-primary-foreground shadow-glow hover:opacity-90 transition-opacity whitespace-nowrap"
                        >
                            <VscAdd /> New Project
                        </button>
                    </div>
                </div>

                {/* Project grid */}
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div
                                key={i}
                                className="gradient-card border border-border rounded-xl p-4 animate-pulse"
                            >
                                <div className="h-4 bg-muted rounded mb-3 w-2/3" />
                                <div className="h-3 bg-muted rounded mb-2 w-1/3" />
                                <div className="h-3 bg-muted rounded w-1/2" />
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-muted-foreground">
                        <FaCode className="text-4xl mx-auto mb-3 opacity-20" />
                        <p className="font-medium">
                            {search
                                ? "No projects match your search"
                                : "No projects yet"}
                        </p>
                        {!search && (
                            <button
                                onClick={() => navigate("/projects/new")}
                                className="mt-3 text-primary text-sm hover:underline"
                            >
                                Create your first project →
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((project, i) => (
                            <div
                                key={project.id}
                                className="gradient-card border border-border rounded-xl p-4 hover:border-primary/40 transition-all cursor-pointer group animate-slide-up"
                                style={{ animationDelay: `${i * 40}ms` }}
                                onClick={() => {
                                    if (confirmDeleteId !== project.id)
                                        navigate(`/projects/${project.id}`);
                                }}
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <span className="text-lg flex-shrink-0">
                                            {templateIcon[project.template] ?? (
                                                <FaCode />
                                            )}
                                        </span>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors truncate text-sm">
                                                {project.name}
                                            </h3>
                                            <p className="text-[11px] text-muted-foreground truncate">
                                                {project.id.slice(0, 8)}…
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-0.5 flex-shrink-0">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                toggleStar(project.id);
                                            }}
                                            className="p-1 rounded hover:bg-accent transition-colors"
                                        >
                                            {project.starred ? (
                                                <VscStarFull className="text-warning text-sm" />
                                            ) : (
                                                <VscStarEmpty className="text-muted-foreground text-sm hover:text-warning" />
                                            )}
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setConfirmDeleteId(project.id);
                                            }}
                                            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <VscTrash className="text-sm" />
                                        </button>
                                    </div>
                                </div>

                                {confirmDeleteId === project.id && (
                                    <div
                                        className="flex items-center gap-2 p-2 rounded-lg border border-destructive/30 bg-destructive/5 mb-2"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <span className="text-xs text-destructive flex-1">
                                            Delete this project?
                                        </span>
                                        <button
                                            onClick={() =>
                                                handleDelete(project.id)
                                            }
                                            disabled={deleting === project.id}
                                            className="px-2 py-0.5 rounded text-xs font-medium bg-destructive text-white hover:bg-destructive/80 disabled:opacity-60"
                                        >
                                            {deleting === project.id
                                                ? "..."
                                                : "Delete"}
                                        </button>
                                        <button
                                            onClick={() =>
                                                setConfirmDeleteId(null)
                                            }
                                            className="px-2 py-0.5 rounded text-xs text-muted-foreground hover:bg-accent"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                    <span className="px-1.5 py-0.5 rounded bg-accent text-accent-foreground capitalize">
                                        {project.template}
                                    </span>
                                    <span>·</span>
                                    <span>
                                        {new Date(
                                            project.createdAt,
                                        ).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            <SettingsDialog
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
            />
        </div>
    );
};

export default Dashboard;
