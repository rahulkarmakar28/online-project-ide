import { useNavigate } from "react-router-dom";

const NotFound = () => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center animate-fade-in">
                <div className="text-8xl font-bold text-muted mb-4">404</div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Page not found</h1>
                <p className="text-muted-foreground mb-6">The page you're looking for doesn't exist.</p>
                <button
                    onClick={() => navigate("/")}
                    className="px-6 py-2.5 rounded-lg text-sm font-semibold gradient-brand text-primary-foreground hover:opacity-90 transition-opacity"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default NotFound;
