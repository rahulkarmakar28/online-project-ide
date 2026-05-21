export const TEMPLATE_IMAGE = {
    "react-js":    "online-editor-node",
    "react-ts":    "online-editor-node",
    "vue":         "online-editor-node",
    "nextjs":      "online-editor-node",
    "angular":     "online-editor-node",
    "html-css-js": "online-editor-node",
    "nodejs":      "online-editor-node",
    "hono":        "online-editor-node",

    "python":      "online-editor-python",
    "fastapi":     "online-editor-python",
    "flask":       "online-editor-python",
    "django":      "online-editor-python",

    "go":          "online-editor-go",

    "rust":        "online-editor-rust",

    "java":        "online-editor-jvm",
    "spring-boot": "online-editor-jvm",
};

export const TEMPLATE_PORTS = {

    "react-js":    5173,
    "react-ts":    5173,
    "vue":         5173,

    "nextjs":      3000,

    "angular":     4200,

    "html-css-js": 5500,

    "nodejs":      3000,
    "hono":        3000,

    "python":      8000,
    "fastapi":     8000,
    "flask":       5000,
    "django":      8000,

    "go":          8080,

    "rust":        8080,

    "java":        8080,
    "spring-boot": 8080,
};

export const DEV_CMD_REWRITES = {

    // ── VITE ─────────────────────────────────────────────
    "vite":
        "vite --host 0.0.0.0",

    "npx vite":
        "npx vite --host 0.0.0.0",

    "npm run dev":
        "npm run dev -- --host 0.0.0.0",

    "npm start":
        "npm start -- --host 0.0.0.0",

    // ── NEXT ─────────────────────────────────────────────
    "next dev":
        "next dev -H 0.0.0.0",

    // ── ANGULAR ──────────────────────────────────────────
    "ng serve":
        "ng serve --host 0.0.0.0",

    "npx ng serve":
        "npx ng serve --host 0.0.0.0",

    // ── PYTHON ───────────────────────────────────────────
    "python main.py":
        "python main.py --host 0.0.0.0",

    "python3 main.py":
        "python3 main.py --host 0.0.0.0",

    // ── FASTAPI ──────────────────────────────────────────
    "uvicorn main:app":
        "uvicorn main:app --host 0.0.0.0 --port 8000 --reload",

    "uvicorn main:app --reload":
        "uvicorn main:app --host 0.0.0.0 --port 8000 --reload",

    // ── FLASK ────────────────────────────────────────────
    "flask run":
        "flask run --host=0.0.0.0 --port=5000",

    // ── DJANGO ───────────────────────────────────────────
    "python manage.py runserver":
        "python manage.py runserver 0.0.0.0:8000",

    "python3 manage.py runserver":
        "python3 manage.py runserver 0.0.0.0:8000",

    // ── GO ───────────────────────────────────────────────
    "air":
        "air -h 0.0.0.0",

    // ── HONO ─────────────────────────────────────────────
    "bun run dev":
        "bun run dev --host 0.0.0.0",
};

export const TEMPLATE_RUNTIME = {

    "react-js":    "node",
    "react-ts":    "node",
    "vue":         "node",
    "nextjs":      "node",
    "angular":     "node",
    "html-css-js": "node",
    "nodejs":      "node",
    "hono":        "node",

    "python":      "python",
    "fastapi":     "python",
    "flask":       "python",
    "django":      "python",

    "go":          "go",

    "rust":        "rust",

    "java":        "java",
    "spring-boot": "java",
};