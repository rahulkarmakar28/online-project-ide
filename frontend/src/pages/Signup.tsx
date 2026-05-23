import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { registerApi } from "@/apis/auth";
import { useUserStore } from "@/store/userStore";

const Signup = () => {
    const navigate = useNavigate();
    const { setUser, setToken } = useUserStore();
    const [form, setForm] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
        setLoading(true);
        try {
            const res = await registerApi(form);
            console.log(res);
            if (!res.success) { toast.error(res.message || "Registration failed"); return; }

            localStorage.setItem("token", res.data.accessToken);
            localStorage.setItem("user", JSON.stringify(res.data.user));
            setToken(res.data.accessToken);
            setUser(res.data.user);
            toast.success("Account created!");
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
                    <h1 className="text-2xl font-bold text-foreground">Create account</h1>
                    <p className="text-sm text-muted-foreground mt-1">Get started with CloudIDE</p>
                </div>

                <div className="gradient-card border border-border rounded-2xl p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Email</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                required
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
                                    transition
                                "
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
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
                                    transition
                                "
                            />
                        </div>
                        <button
                            type="submit" disabled={loading}
                            className="w-full py-2.5 rounded-lg text-sm font-semibold gradient-brand text-primary-foreground shadow-glow hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? "Creating account..." : "Create Account"}
                        </button>
                    </form>
                    <p className="text-center text-xs text-muted-foreground mt-4">
                        Already have an account?{" "}
                        <Link to="/login" className="text-primary hover:underline">Sign in</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
