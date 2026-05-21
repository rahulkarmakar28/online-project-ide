import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { loginApi } from "@/apis/auth";
import { useUserStore } from "@/store/userStore";

const Login = () => {
    const navigate = useNavigate();
    const { setUser, setToken } = useUserStore();
    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await loginApi(form);
            if (!res.success) {
                toast.error(res.message || "Login failed");
                return;
            }

            localStorage.setItem("token", res.data.accessToken);
            localStorage.setItem("user", JSON.stringify(res.data.user));
            setToken(res.data.accessToken);
            setUser(res.data.user);
            toast.success("Welcome back!");
            // console.log(res);
            console.log("Saving token:", res.data.accessToken);
            navigate("/");
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-sm animate-slide-up">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 rounded-2xl gradient-brand mx-auto mb-4 shadow-glow" />
                    <h1 className="text-2xl font-bold text-foreground">
                        Welcome back
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Sign in to CloudIDE
                    </p>
                </div>

                <div className="gradient-card border border-border rounded-2xl p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Email
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                required
                                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">
                                Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                className="w-full bg-input border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 rounded-lg text-sm font-semibold gradient-brand text-primary-foreground shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>
                    <p className="text-center text-xs text-muted-foreground mt-4">
                        Don&apos;t have an account?{" "}
                        <Link
                            to="/signup"
                            className="text-primary hover:underline"
                        >
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;
