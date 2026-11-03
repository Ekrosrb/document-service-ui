# document-service-ui

A browser UI for mcp-document-service: it browses,
reads, edits and deletes the documents and memories that agents and people keep in that store. It is a
Vue 3 single-page app that talks to the service's REST API, so anything an agent saved through MCP can be
read and corrected by a person.

There is no build step at runtime and no server-side logic: the deployment is static files served by nginx,
which also proxies `/api/v1` to mcp-document-service, so the browser only ever talks to one origin.

## What it shows

The app is one page with five screens. There is no router; the header switches between them.

| Screen        | What it does                                                                        |
|---------------|-------------------------------------------------------------------------------------|
| **Overview**  | Workspace counts (documents, memories, trash), recently updated entries, per-project counts and counts per type. |
| **Documents** | The browsable list: full-text query, filters, paging. A row opens the entry.          |
| **Detail**    | One entry: its content rendered for its type, its metadata, its relations, and the entries that reference it. Edit, delete and restore live here. |
| **Editor**    | Create or change an entry: kind, scope, project, type, name, summary, content, and its relations. |
| **Trash**     | Deleted entries, most recently deleted first. Restore, or remove for good.           |

Searching and filtering mirror the service's own search:

- The query is the service's English full-text search over name, summary and content.
- Filters: kind (document or memory), scope, author, memory type, project. They combine with AND.
- **Include superseded** turns on entries that a newer one replaced; they are marked `Superseded`.
  Relations are only requested when superseded entries are included.
- Typing is debounced, so the list follows the query without a search button.

Content is rendered per the entry's type:

| Type                   | How it is shown                                                 |
|------------------------|-----------------------------------------------------------------|
| `TEXT`, `HLD`, `CUSTOM`| Plain text, line by line.                                       |
| `JSON`, `CSS`, `TOON`  | Syntax highlighted (highlight.js).                              |
| `XML`                  | A collapsible tree, with a toggle to the raw text.              |
| `MARKDOWN`             | Rendered (markdown-it) and sanitized (DOMPurify), with a toggle to the raw text. |
| `HTML`                 | Rendered in a sandboxed iframe, with a toggle to the raw text.   |

Light and dark themes are both supported; dark is the default and the choice is kept in `localStorage`.

## What it calls

Everything goes through the service's REST API under `/api/v1`. No other host is contacted.

| Method and path                                              | Used for                              |
|--------------------------------------------------------------|---------------------------------------|
| `POST /document/search`                                      | The documents list and the overview.  |
| `GET /document/{id}`                                         | The detail screen.                    |
| `POST /document`                                             | Creating an entry.                    |
| `PUT /document/{id}`                                         | Saving an edit.                        |
| `DELETE /document/{id}`                                      | Deleting (soft delete).               |
| `GET /document/deleted`, `GET /document/deleted/{id}`        | Trash and reading a deleted entry.    |
| `POST /document/{id}/restore`                                | Restoring from trash.                 |
| `DELETE /document/{id}/permanent`                            | Removing for good.                    |
| `POST /document/relation`, `DELETE /document/relation/{id}/{relatedId}` | Linking and unlinking entries. |
| `GET /project/info`                                          | The project filter and project counts.|
| `GET /metric/count/type`                                     | The per-type counts.                  |

The API has no authentication, and neither does the UI. Run both only on a network you trust.

## Prerequisites

To deploy with the script:
- Docker with BuildKit and Docker Compose v2 (the `docker compose` command). Any Docker Desktop or
  Docker Engine release from 2024 on has both.
- bash. On Windows, use Git Bash or WSL.

To build or run without Docker:
- Node.js `^22.18.0 || >=24.12.0` and npm.

A reachable mcp-document-service. The UI is useless without it, but it is not deployed here — deploy it
from its own repository and point the UI at it.

## Runbook

### Deploy

```bash
./deploy.sh
```

That is all a first deployment needs; every setting has a default. The script:
1. Checks that Docker and Docker Compose are available.
2. Builds the image from the local sources: `npm ci` and `npm run build` run inside the build stage, so
   the result is a production build with no devtools overlay. The first build takes a few minutes.
3. Starts the container, waits until it is healthy and prints the URLs. If it does not start, the script
   prints the container logs and exits with an error.

By default the UI listens on port `5431` and proxies `/api/v1` to `host.docker.internal:55535`, which is
mcp-document-service on the machine running Docker, deployed with its own defaults. Nothing needs to be
configured when both run on the same host.

Run the same command again to deploy a new version of the code.

If `./deploy.sh` reports "Permission denied", run `bash deploy.sh` or `chmod +x deploy.sh`.

### Open the UI

```text
http://<host>:5431
```

Replace `<host>` with the host name or IP address of the machine running the container; on that machine
itself, `http://localhost:5431`.

### Day-to-day commands

Run these from the repository root.

| Task                  | Command                                                                        |
|-----------------------|--------------------------------------------------------------------------------|
| Status                | `docker compose -f deploy/docker-compose.yaml ps`                              |
| Logs                  | `docker compose -f deploy/docker-compose.yaml logs -f document-service-ui`     |
| Stop                  | `docker compose -f deploy/docker-compose.yaml stop`                            |
| Start again           | `./deploy.sh`                                                                  |
| Remove the container  | `docker compose -f deploy/docker-compose.yaml down`                            |
| Check the rendered proxy config | `docker exec document-service-ui cat /etc/nginx/conf.d/default.conf` |

### Troubleshooting

- **The UI loads but every list shows an error.** The proxy cannot reach the API. Check `API_HOST` and
  `API_PORT`, and remember both are resolved inside the container: `localhost` there is the container
  itself, not your machine. Confirm the service answers with
  `docker exec document-service-ui wget -qO- http://$API_HOST:$API_PORT/api/v1/project/info`.
- **502 from `/api/v1/...`.** nginx reached no backend at all: mcp-document-service is not running, or its
  port is not published on the host the UI points at.
- **The container does not become healthy.** The script prints its logs. A broken proxy target is not a
  cause — the health check only asks nginx for the page.
- **Port 5431 is already in use.** Set `UI_PORT` to a free port and deploy again.

## Configuration

Every setting has a default, so nothing needs to be configured to start. To change a setting, either:
- copy `deploy/.env.example` to `deploy/.env` and edit the values there (`deploy/.env` is not committed), or
- set environment variables when running the script, for example `UI_PORT=3000 ./deploy.sh`.

Environment variables take precedence over `deploy/.env`.

| Variable            | Default                 | Meaning                                                                 |
|---------------------|-------------------------|-------------------------------------------------------------------------|
| `API_HOST`          | `host.docker.internal`  | Host the UI proxies `/api/v1` to. The default is the machine running Docker, where mcp-document-service publishes its port. Resolved inside the container. |
| `API_PORT`          | `55535`                 | Port of mcp-document-service on that host.                              |
| `UI_BIND_ADDRESS`   | `0.0.0.0`               | Host address the UI port is published on. `127.0.0.1` keeps it off the network. |
| `UI_PORT`           | `5431`                  | Host port of the UI.                                                    |
| `UI_CONTAINER_NAME` | `document-service-ui`   | Name of the container.                                                  |
| `UI_IMAGE`          | `document-service-ui`   | Name of the built image. The tag is the `package.json` version.         |
| `UI_VERSION`        | `package.json` version  | Image tag to build and run.                                             |

Notes:
- **Changing a setting needs a redeploy** (`./deploy.sh`), which recreates the container. The proxy target
  is rendered into the nginx config when the container starts, not baked into the image, so a changed
  `API_HOST` or `API_PORT` does not rebuild anything.
- **mcp-document-service on another machine.** Set `API_HOST` to its host name or IP address and
  `API_PORT` to its port. The browser is unaffected: it keeps calling the UI's own `/api/v1`.
- **mcp-document-service in the same Docker network.** Set `API_HOST` to its container name
  (`mcp-document-service`) and `API_PORT` to `55535`, its port inside the network, and attach this
  container to that network in `deploy/docker-compose.yaml`.
- **The browser never calls the API directly**, so the API does not need CORS and does not need to be
  reachable from the browser's machine — only from the UI container.

When the app is built outside Docker it reads `VITE_API_BASE_URL` (default `/api/v1`) at build time. Set it
only when the API is not proxied under the same origin; the API must then allow the UI's origin with CORS.

## Build it yourself

Install the dependencies (needs Node.js, see Prerequisites):

```bash
npm install
```

Run the dev server. It serves the app on `http://localhost:5531` and proxies `/api/v1` to
`http://localhost:55535`, so a locally deployed mcp-document-service works with no configuration:

```bash
npm run dev
```

Build the production bundle into `dist/`:

```bash
npm run build
```

The devtools overlay is part of the dev server only; `npm run build` leaves it out.

Serve that bundle locally to check it:

```bash
npm run preview
```

Run the unit tests (Vitest, jsdom). `--run` makes it one pass instead of watch mode:

```bash
npm run test:unit -- --run
```

Build only the Docker image (needs only Docker; the build runs inside a container):

```bash
docker build -t document-service-ui:0.0.0 .
```

Start it with Docker Compose directly, without the script:

```bash
docker compose -f deploy/docker-compose.yaml up -d --build
```

## How it is put together

| Path                 | What is in it                                                                      |
|----------------------|------------------------------------------------------------------------------------|
| `src/views/`         | `HomeView.vue`, which owns the view state and swaps the screens.                   |
| `src/components/`    | The screens (`overview/`, `documents/`, `document/`, `trash/`), the header (`layout/`) and the shadcn-vue primitives (`ui/`). |
| `src/api/`           | The only place that talks HTTP: one axios instance, one module per resource, the enums. |
| `src/composables/`   | `useWorkspace.js` (project list and counts), `useTheme.js` (light/dark).           |
| `src/lib/`           | Display and rendering helpers: markdown, XML, highlighting, formatting.            |
| `src/validation/`    | Form and search validation.                                                        |
| `src/assets/main.css`| The theme, as CSS variables.                                                       |
| `deploy/`            | `docker-compose.yaml`, the nginx config template, `.env.example`.                  |

Tests sit in a `__tests__` folder next to the code they cover, with a `*TestData.js` holding the fixtures.
