import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import CreateProject from "./pages/CreateProject";
import ProjectPlayground from "./pages/ProjectPlayground";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});


const getToken = () => localStorage.getItem("token");

const ProtectedRoute = ({ children }: { children: React.ReactNode }) =>
    getToken() ? <>{children}</> : <Navigate to="/login" replace />;

const PublicRoute = ({ children }: { children: React.ReactNode }) =>
    getToken() ? <Navigate to="/" replace /> : <>{children}</>;


const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster richColors position="top-right" />
            <BrowserRouter>
                <Routes>
                    <Route path="/login"  element={<PublicRoute><Login /></PublicRoute>} />
                    <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

                    <Route path="/"
                        element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
                    />
                    <Route path="/projects/new"
                        element={<ProtectedRoute><CreateProject /></ProtectedRoute>}
                    />
                    <Route path="/projects/:projectId"
                        element={<ProtectedRoute><ProjectPlayground /></ProtectedRoute>}
                    />

                    <Route path="*" element={<NotFound />} />
                </Routes>
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;