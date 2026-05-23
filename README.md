# CloudIDE

A browser-based IDE that lets you create, edit, and run projects in isolated Docker containers — directly in your browser.

---

## Architecture

```
┌─────────────┐     REST API      ┌─────────────┐     PostgreSQL    ┌──────────┐
│  Frontend   │ ──────────────►  │   Master    │ ───────────────► │    DB    │
│  (Vite/TS)  │                   │  (Express)  │                   │(Postgres)│
└──────┬──────┘                   └─────────────┘                   └──────────┘
       │  Socket.io (editor)              │ shared /projects volume
       │  WebSocket  (terminal)           ▼
       │                          ┌─────────────┐     Docker API    ┌──────────────┐
       └────────────────────────► │   Worker    │ ───────────────► │  Sandbox     │
                                  │  (WS/IO)    │                   │ Containers   │
                                  └─────────────┘                   │(node/py/go…) │
                                                                     └──────────────┘
```

| Service    | Port  | Purpose                                           |
|------------|-------|---------------------------------------------------|
| `frontend` | 5173  | Vite dev server — the browser IDE                 |
| `master`   | 3000  | REST API: auth, projects, notifications           |
| `worker`   | 4000  | Terminal WebSocket — spawns Docker containers     |
| `worker`   | 5000  | Editor Socket.io — file read/write/tree watch     |
| `db`       | 5432  | PostgreSQL — users, projects, notifications       |

---

## Prerequisites

- **Docker** (with daemon running)
- **Node.js 22+** (for local dev without Docker)
- **Git**

---

## Quick Start (Docker Compose)

```bash
# 1. Clone the repo
git clone <repo-url> && cd online-project-ide

# 2. Build the per-language sandbox images (one-time)
cd server/worker && bash build-images.sh && cd ../..

# 3. Copy and fill in env
cp server/master/.env.example server/master/.env
# Edit server/master/.env — set JWT_SECRET and JWT_REFRESH_SECRET

# 4. Start everything
docker compose up --build
```

Open **http://localhost:5173** in your browser.

---

## Local Development (without Docker Compose)

### 1. Database
```bash
docker run -d \
  --name ide-db \
  -e POSTGRES_USER=johndoe \
  -e POSTGRES_PASSWORD=randompassword \
  -e POSTGRES_DB=mydb \
  -p 5432:5432 \
  postgres:16-alpine
```

### 2. Master server
```bash
cd server/master
cp .env.example .env     # fill in values
npm install
npx prisma migrate dev
npm run dev
```

### 3. Worker server
```bash
cd server/worker
cp .env.example .env
npm install
npm run dev
```

### 4. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

---

## Environment Variables

### `server/master/.env`

| Variable               | Description                                  | Example                        |
|------------------------|----------------------------------------------|--------------------------------|
| `PORT`                 | Master server port                           | `3000`                         |
| `DATABASE_URL`         | PostgreSQL connection string                 | `postgresql://...`             |
| `JWT_SECRET`           | Access token signing secret (32+ chars)      | `your_secret_here`             |
| `JWT_EXPIRES_IN`       | Access token lifetime                        | `1d`                           |
| `JWT_REFRESH_SECRET`   | Refresh token signing secret (32+ chars)     | `your_refresh_secret`          |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime                     | `7d`                           |
| `FRONTEND_URL`         | Frontend URL (for CORS)                      | `http://localhost:5173`        |

### `server/worker/.env`

| Variable          | Description                                         | Example                            |
|-------------------|-----------------------------------------------------|------------------------------------|
| `TERMINAL_PORT`   | Terminal WebSocket port                             | `4000`                             |
| `EDITOR_PORT`     | Editor Socket.io port                               | `5000`                             |
| `SANDBOX_MODE`    | `docker` or `kubernetes`                            | `docker`                           |
| `DOCKER_HOST`     | Docker socket path (auto-detected if blank)         | `unix:///var/run/docker.sock`      |

### `frontend/.env`

| Variable                    | Description                      | Example                    |
|-----------------------------|----------------------------------|----------------------------|
| `VITE_API_URL`              | Master REST API base URL         | `http://localhost:3000`    |
| `VITE_WORKER_TERMINAL_URL`  | Worker terminal WebSocket URL    | `ws://localhost:4000`      |
| `VITE_WORKER_EDITOR_URL`    | Worker editor Socket.io URL      | `http://localhost:5000`    |

---

## Sandbox Images

Before running the worker you must build the per-language images once:

```bash
cd server/worker
bash build-images.sh          # uses docker by default
# or: BUILDER=podman bash build-images.sh
```

| Image           | Base                          | Used for                                           |
|-----------------|-------------------------------|----------------------------------------------------|
| `sandbox-node`  | `node:22-slim`                | react-js, react-ts, vue, nextjs, angular, nodejs, hono, html-css-js |
| `sandbox-python`| `python:3.12-slim`            | python, fastapi, flask, django                     |
| `sandbox-go`    | `golang:1.22-bookworm`        | go                                                 |
| `sandbox-jvm`   | `eclipse-temurin:21-jdk-jammy`| java, spring-boot                                  |
| `sandbox-rust`  | `rust:1.78-slim-bookworm`     | rust                                               |

---

## Supported Templates

| Template       | Runtime   | Dev Port | Dev Command                          |
|----------------|-----------|----------|--------------------------------------|
| `react-js`     | Node      | 5173     | `npm run dev` → `vite --host`        |
| `react-ts`     | Node      | 5173     | `npm run dev` → `vite --host`        |
| `vue`          | Node      | 5173     | `npm run dev` → `vite --host`        |
| `nextjs`       | Node      | 3000     | `npm run dev` → `next dev -H 0.0.0.0`|
| `angular`      | Node      | 4200     | `ng serve --host 0.0.0.0`            |
| `html-css-js`  | Node      | 5500     | `npx serve`                          |
| `nodejs`       | Node      | 3000     | `node index.js`                      |
| `hono`         | Node      | 3000     | `node src/index.js`                  |
| `python`       | Python    | —        | `python3 main.py`                    |
| `fastapi`      | Python    | 8000     | `uvicorn main:app --host 0.0.0.0`    |
| `flask`        | Python    | 5000     | `flask run --host=0.0.0.0`           |
| `django`       | Python    | 8000     | `python3 manage.py runserver`        |
| `go`           | Go        | 8080     | `go run main.go`                     |
| `rust`         | Rust      | —        | `cargo run`                          |
| `java`         | JVM       | —        | `javac Main.java && java Main`       |
| `spring-boot`  | JVM       | 8080     | `mvn spring-boot:run`                |

---

## Features

- **Multi-language sandboxes** — each project runs in an isolated Docker container
- **Real terminal** — full bash shell via WebSocket, connected directly to the container
- **Code editor** — Monaco editor with syntax highlighting, Ctrl+S to save
- **File explorer** — create, rename, delete files and folders; auto-refreshes on terminal changes
- **Browser preview** — live preview of running dev servers at the correct container port
- **Project starring** — star/unstar with debounced API calls
- **Notifications** — persistent per-user notifications for project create/delete events
- **Refresh token auth** — 15m access token auto-refreshed via httpOnly cookie

---

## API Reference

### Auth
| Method | Path                   | Description        |
|--------|------------------------|--------------------|
| POST   | `/api/v1/auth/register`| Register           |
| POST   | `/api/v1/auth/login`   | Login              |
| POST   | `/api/v1/auth/refresh` | Refresh token      |
| POST   | `/api/v1/auth/logout`  | Logout             |

### Projects
| Method | Path                          | Description         |
|--------|-------------------------------|---------------------|
| GET    | `/api/v1/projects`            | List projects       |
| POST   | `/api/v1/projects`            | Create project      |
| GET    | `/api/v1/projects/:id`        | Get file tree       |
| DELETE | `/api/v1/projects/:id`        | Delete project      |
| PATCH  | `/api/v1/projects/:id/star`   | Toggle star         |

### Notifications
| Method | Path                               | Description         |
|--------|------------------------------------|---------------------|
| GET    | `/api/v1/notifications`            | List notifications  |
| PATCH  | `/api/v1/notifications/read-all`   | Mark all read       |
| PATCH  | `/api/v1/notifications/:id/read`   | Mark one read       |
| DELETE | `/api/v1/notifications/:id`        | Delete one          |
| DELETE | `/api/v1/notifications/clear-all`  | Clear all           |

---

## Troubleshooting

**`Error: failed to start container`**
- Make sure Docker is running: `docker ps`
- Check the socket: `ls -la /var/run/docker.sock`
- On Fedora set `DOCKER_HOST=unix:///var/run/docker.sock` in `server/worker/.env`

**`EACCES permission denied` on vite.config.js.timestamp**
- The sandbox container doesn't own the project files. Ensure you're using the latest `entrypoint.sh` and `handleContainerCreate.js` which `chown -R sandbox:sandbox /workspace` on start.

**`I have no name!` in terminal**
- Rebuild the `sandbox-node` image: `cd server/worker && bash build-images.sh`
- The new `entrypoint.sh` rewrites `/etc/passwd` at runtime to fix this.

**Terminal shows random prefix letters (m, n, r, v)**
- Same fix — rebuild images. The new `entrypoint.sh` writes PS1 via heredoc at runtime instead of `echo` in the Dockerfile.

**Browser preview not loading**
- The dev server must be running inside the container. Check the terminal.
- Make sure you're using `--host 0.0.0.0` (the worker auto-rewrites common commands).
- The port shown in the browser preview is the Docker-mapped host port — it's correct.
