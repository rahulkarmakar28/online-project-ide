# CloudIDE

A browser-based IDE that lets you create, edit, and run projects in isolated Docker containers — directly in your browser.

---

## Architecture

```
┌─────────────┐     REST API      ┌─────────────┐     PostgreSQL    ┌──────────┐
│  Frontend   │ ──────────────►   │   Master    │ ───────────────►  │    DB    │
│  (Vite/TS)  │                   │  (Express)  │                   │(Postgres)│
└──────┬──────┘                   └─────────────┘                   └──────────┘
       │  Socket.io (editor)              │ shared ./projects volume
       │  WebSocket  (terminal)           ▼
       │                          ┌─────────────┐     Docker API    ┌──────────────┐
       └────────────────────────► │   Worker    │ ───────────────►  │  Sandbox     │
                                  │  (WS/IO)    │                   │ Containers   │
                                  └─────────────┘                   │(node/py/go…) │
                                                                    └──────────────┘
```

| Service    | Port | Purpose                                        |
|------------|------|------------------------------------------------|
| `frontend` | 8080 | Vite SPA served by `serve`                     |
| `master`   | 3000 | REST API: auth, projects, notifications        |
| `worker`   | 4000 | Terminal WebSocket — spawns sandbox containers |
| `worker`   | 5000 | Editor Socket.io — file read/write/tree watch  |
| `db`       | 5432 | PostgreSQL                                     |

---

## Prerequisites

- **Docker** with daemon running (`docker ps` should work)
- **Node.js 22+** (for local dev without Docker Compose)

---

## Quick Start (Docker Compose)

```bash
# 1. Clone
git clone <repo-url> && cd online-project-ide

# 2. Build sandbox images (one-time, on the host)
cd server/worker && bash build-images.sh && cd ../..

# 3. Create projects directory (bind-mounted into containers)
mkdir -p projects

# 4. Set your JWT secrets
cp server/master/.env.docker.example server/master/.env.docker
# Edit server/master/.env.docker — set JWT_SECRET and JWT_REFRESH_SECRET

# 5. Find your Docker socket GID (Fedora/Linux)
stat -c '%g' /var/run/docker.sock   # e.g. 985

# 6. Create root .env for docker compose
echo "DOCKER_GID=985" > .env       # use your actual GID

# 7. Start everything
docker compose up --build
```

Open **http://localhost:8080** in your browser.

> **Important:** After `docker compose down`, clear your browser's localStorage
> before logging in again, otherwise old JWTs cause FK errors:
> ```js
> // Run in browser DevTools console
> localStorage.clear(); location.reload();
> ```

---

## Local Development (without Docker Compose)

### 1. Database
```bash
docker run -d --name ide-db \
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
cp .env.example .env     # fill in values
npm install
npm run dev
```

### 4. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev              # serves on http://localhost:5173
```

---

## Environment Variables

### `server/master/.env` / `.env.docker`

| Variable                 | Description                             | Example                                            |
|--------------------------|-----------------------------------------|----------------------------------------------------|
| `PORT`                   | Master server port                      | `3000`                                             |
| `DATABASE_URL`           | PostgreSQL connection string            | `postgresql://johndoe:pass@localhost:5432/mydb`    |
| `JWT_SECRET`             | Access token secret (32+ chars)         | `your_long_random_secret`                          |
| `JWT_EXPIRES_IN`         | Access token lifetime                   | `1d`                                               |
| `JWT_REFRESH_SECRET`     | Refresh token secret (32+ chars)        | `your_long_refresh_secret`                         |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime                  | `7d`                                               |
| `FRONTEND_URL`           | Frontend URL for CORS                   | `http://localhost:8080`                            |
| `PROJECTS_DIR`           | Absolute path to projects folder        | `/app/projects`                                    |

### `server/worker/.env` / `.env.docker`

| Variable            | Description                                       | Example                             |
|---------------------|---------------------------------------------------|-------------------------------------|
| `TERMINAL_PORT`     | Terminal WebSocket port                           | `4000`                              |
| `EDITOR_PORT`       | Editor Socket.io port                             | `5000`                              |
| `SANDBOX_MODE`      | `docker` or `kubernetes`                          | `docker`                            |
| `DOCKER_HOST`       | Docker socket path                                | `unix:///var/run/docker.sock`       |
| `PROJECTS_DIR`      | Path inside worker container                      | `/app/projects`                     |
| `HOST_PROJECTS_DIR` | Path on HOST machine (for sandbox bind mounts)    | `/home/user/online-project-ide/projects` |

### `frontend/.env` / `.env.docker`

| Variable                   | Description                     | Example                    |
|----------------------------|---------------------------------|----------------------------|
| `VITE_API_URL`             | Master REST API URL             | `http://localhost:3000`    |
| `VITE_WORKER_TERMINAL_URL` | Worker terminal WebSocket URL   | `ws://localhost:4000`      |
| `VITE_WORKER_EDITOR_URL`   | Worker editor Socket.io URL     | `http://localhost:5000`    |

---

## Sandbox Images

Build once on the Docker host before starting the worker:

```bash
cd server/worker
bash build-images.sh            # docker (default)
BUILDER=podman bash build-images.sh   # podman
```

| Image                  | Base                           | Templates                                              |
|------------------------|--------------------------------|--------------------------------------------------------|
| `online-editor-node`   | `node:22-slim`                 | react-js, react-ts, vue, nextjs, angular, nodejs, hono, html-css-js |
| `online-editor-python` | `python:3.12-slim`             | python, fastapi, flask, django                         |
| `online-editor-go`     | `golang:1.22-bookworm`         | go                                                     |
| `online-editor-jvm`    | `eclipse-temurin:21-jdk-jammy` | java, spring-boot                                      |
| `online-editor-rust`   | `rust:1.78-slim-bookworm`      | rust                                                   |

---

## Supported Templates

| Template       | Runtime | Dev Port | Run Command                                    |
|----------------|---------|----------|------------------------------------------------|
| `react-js`     | Node    | 5173     | `npm run dev` (auto-adds `--host`)             |
| `react-ts`     | Node    | 5173     | `npm run dev` (auto-adds `--host`)             |
| `vue`          | Node    | 5173     | `npm run dev` (auto-adds `--host`)             |
| `nextjs`       | Node    | 3000     | `npm run dev` (auto-adds `-H 0.0.0.0`)         |
| `angular`      | Node    | 4200     | `ng serve --host 0.0.0.0`                      |
| `html-css-js`  | Node    | 5500     | `npx serve`                                    |
| `nodejs`       | Node    | 3000     | `node index.js`                                |
| `hono`         | Node    | 3000     | `node src/index.js`                            |
| `python`       | Python  | —        | `python3 main.py`                              |
| `fastapi`      | Python  | 8000     | `uvicorn main:app --host 0.0.0.0 --reload`     |
| `flask`        | Python  | 5000     | `flask run --host=0.0.0.0`                     |
| `django`       | Python  | 8000     | `python3 manage.py runserver 0.0.0.0:8000`     |
| `go`           | Go      | 8080     | `go run main.go`                               |
| `rust`         | Rust    | —        | `cargo run`                                    |
| `java`         | JVM     | —        | `javac Main.java && java Main`                 |
| `spring-boot`  | JVM     | 8080     | `mvn spring-boot:run`                          |

---

## Container Lifecycle

Sandbox containers are automatically managed:

| Event | Behaviour |
|---|---|
| User opens project | Container starts (or reuses existing) |
| User closes browser tab | Container removed **immediately** (`beforeunload` → `close-now` message) |
| User navigates to dashboard | Container kept alive for **2 minutes** — user can return and reconnect |
| 2-minute timer expires | Container stopped and removed |

---

## Features

- **Multi-language sandboxes** — isolated Docker container per project
- **Real terminal** — full bash shell, xterm.js via WebSocket
- **Monaco editor** — syntax highlighting, Ctrl+S instant save, auto-save after 2s
- **File explorer** — create, rename, delete files/folders; live refresh from terminal changes
- **Browser preview** — live iframe pointing at the running dev server port
- **Project starring** — debounced API call (600ms)
- **Notifications** — persistent per-user: project created/deleted events
- **Refresh token auth** — access token auto-refreshed via httpOnly cookie

---

## API Reference

### Auth `POST /api/v1/auth/...`
| Method | Path        | Description     |
|--------|-------------|-----------------|
| POST   | `/register` | Register        |
| POST   | `/login`    | Login           |
| POST   | `/refresh`  | Refresh token   |
| POST   | `/logout`   | Logout          |

### Projects `GET|POST|DELETE|PATCH /api/v1/projects/...`
| Method | Path              | Description      |
|--------|-------------------|------------------|
| GET    | `/`               | List projects    |
| POST   | `/`               | Create project   |
| GET    | `/:id`            | Get file tree    |
| DELETE | `/:id`            | Delete project   |
| PATCH  | `/:id/star`       | Toggle star      |

### Notifications `GET|PATCH|DELETE /api/v1/notifications/...`
| Method | Path          | Description      |
|--------|---------------|------------------|
| GET    | `/`           | List             |
| PATCH  | `/read-all`   | Mark all read    |
| PATCH  | `/:id/read`   | Mark one read    |
| DELETE | `/clear-all`  | Clear all        |
| DELETE | `/:id`        | Delete one       |

---

## Troubleshooting

**`Error: failed to start container`**
```bash
# Check sandbox images exist
docker images | grep online-editor-
# If missing:
cd server/worker && bash build-images.sh

# Check Docker socket permissions
stat -c '%g' /var/run/docker.sock   # get GID
echo "DOCKER_GID=<gid>" > .env      # set in root .env
```

**`Foreign key constraint violated: Project_userId_fkey`**
The DB was wiped but the browser still has the old JWT. Clear localStorage:
```js
localStorage.clear(); location.reload();
```

**`EACCES: permission denied` on vite.config.js.timestamp**
```bash
# Remove old containers — new ones use correct ownership
docker ps -a --filter "name=project-" --format "{{.Names}}" | xargs -r docker rm -f
```

**Terminal shows extra characters (z, 3, ), |)**
Make sure `handleTerminalCreation.js` has the `demuxDockerStream` function.
Also rebuild sandbox images with the latest `entrypoint.sh`:
```bash
cd server/worker && bash build-images.sh
docker ps -a --filter "name=project-" --format "{{.Names}}" | xargs -r docker rm -f
```

**Browser preview not loading**
- Start your dev server in the terminal first
- Make sure you ran `npm install` before `npm run dev`
- The worker auto-rewrites `npm run dev` to include `--host` so Vite binds `0.0.0.0`

**`/workspace` is empty in terminal**
The `./projects` bind mount isn't reaching the sandbox container.
Check that `HOST_PROJECTS_DIR` in docker-compose points to the actual host path:
```bash
echo ${PWD}/projects   # this is what HOST_PROJECTS_DIR should be
```

**`I have no name!` in terminal**
Rebuild sandbox images — the new `entrypoint.sh` fixes `/etc/passwd` at runtime:
```bash
cd server/worker && bash build-images.sh
```