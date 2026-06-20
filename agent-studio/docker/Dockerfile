# syntax=docker/dockerfile:1.7

# ═══════════════════════════════════════════════════════════════════════════════
# agent-studio all-in-one Docker image
#
# Combines three services into a single image:
#   1. Agent Server  — from ghcr.io/bezotcorp/agent-server (upstream SDK image)
#   2. Automation    — installed via pip from bezotcorp-automation
#   3. Frontend      — agent-studio static build served by Node.js
#
# The entrypoint starts all three services and an ingress proxy that unifies
# them behind a single port (default 8000):
#   /api/automation/*  → automation backend (:18001)
#   /api/*, /sockets   → agent server (:18000)
#   /* (default)       → static frontend + SPA fallback
# ═══════════════════════════════════════════════════════════════════════════════

# ── Build args ────────────────────────────────────────────────────────────────
# No hardcoded defaults — values are derived from config/defaults.json.
# CI passes these via --build-arg; for local builds use:
#   node scripts/docker-build.mjs          (recommended, reads JSON for you)
#   docker build --build-arg AGENT_SERVER_IMAGE=... --build-arg AUTOMATION_VERSION=... -f docker/Dockerfile .
ARG AGENT_SERVER_IMAGE
ARG AUTOMATION_VERSION

# ── Stage 1: Build frontend ──────────────────────────────────────────────────
FROM node:24-slim AS frontend-build

WORKDIR /build

# Cache-friendly: package files first
COPY package.json package-lock.json ./
RUN npm ci

# Copy everything needed for the build
COPY . .

# Build the static frontend.
# VITE_APP_ENV controls the PostHog telemetry key baked into the bundle:
#   "production" → prod key (set by CI for tagged releases)
#   anything else → staging key (default for PR / main / local builds)
# VITE_POSTHOG_CLIENT_KEY is the PostHog project key exposed via the web client
# config (option-service). Not a secret — it's a public, client-side key. CI
# passes the prod key for tagged releases and the staging key otherwise.
ARG VITE_APP_ENV=""
ARG VITE_POSTHOG_CLIENT_KEY=""
ENV VITE_APP_ENV=${VITE_APP_ENV}
ENV VITE_POSTHOG_CLIENT_KEY=${VITE_POSTHOG_CLIENT_KEY}
RUN npm run build

# ── Stage 1b: Generate shell-sourceable defaults from config/defaults.json ──
# This avoids needing jq/python at container runtime to parse the JSON.
FROM node:24-slim AS config-gen
COPY config/defaults.json /tmp/
RUN node -e " \
  const c = JSON.parse(require('fs').readFileSync('/tmp/defaults.json','utf-8')); \
  const lines = [ \
  'CONFIG_AGENT_SERVER_PORT=' + c.ports.agentServer, \
  'CONFIG_AUTOMATION_PORT=' + c.ports.automation, \
  'CONFIG_PROXY_PORT=' + c.ports.proxy, \
  'CONFIG_STATE_SUBDIR=' + c.paths.stateSubdir, \
  'CONFIG_CONVERSATIONS=' + c.paths.conversations, \
  'CONFIG_BASH_EVENTS=' + c.paths.bashEvents, \
  'CONFIG_AUTOMATION_DB=' + c.paths.automationDb, \
  ]; \
  require('fs').writeFileSync('/tmp/defaults.env', lines.join('\n') + '\n'); \
  "

# ── Stage 2: Combined image ──────────────────────────────────────────────────
FROM ${AGENT_SERVER_IMAGE} AS final

ARG AUTOMATION_VERSION
ARG BEZOTCORP_BUILD_GIT_SHA=unknown
ARG BEZOTCORP_BUILD_GIT_REF=unknown

ARG AGENT_CANVAS_VERSION=dev
LABEL org.opencontainers.image.title="agent-studio"
LABEL org.opencontainers.image.description="All-in-one agent-studio: Agent Server + Automation + Frontend"
LABEL org.opencontainers.image.source="https://github.com/BezotCorp/bezotcorp-studio"
LABEL org.opencontainers.image.version="${AGENT_CANVAS_VERSION}"
LABEL org.opencontainers.image.revision="${BEZOTCORP_BUILD_GIT_SHA}"

ENV AGENT_CANVAS_BUILD_GIT_SHA=${BEZOTCORP_BUILD_GIT_SHA}
ENV AGENT_CANVAS_BUILD_GIT_REF=${BEZOTCORP_BUILD_GIT_REF}

USER root

# Install system deps required by automation's transitive dependencies
# (asyncpg needs libpq, which the agent-server base image may not include).
RUN if command -v apt-get >/dev/null 2>&1; then \
  apt-get update && \
  apt-get install -y --no-install-recommends libpq-dev && \
  rm -rf /var/lib/apt/lists/*; \
  fi

# Install automation server via pip.
# Shared deps (bezotcorp-sdk, fastapi, uvicorn, pydantic, httpx, …) are
# already satisfied by the agent-server base image, so only automation-
# specific packages (asyncpg, sqlalchemy, boto3, gcloud, …) are added.
RUN uv pip install --system "bezotcorp-automation==${AUTOMATION_VERSION}" 2>/dev/null \
  || pip install --no-cache-dir "bezotcorp-automation==${AUTOMATION_VERSION}"

# Copy the frontend build output.
# react-router.config.ts unpacks build/client/ into build/ for non-Vercel builds.
COPY --from=frontend-build /build/build /opt/agent-studio/frontend

# Copy the static-server script (serves frontend + proxies to backends)
COPY scripts/static-server.mjs /opt/agent-studio/static-server.mjs

# Copy the runtime-services-info builder (entrypoint.sh runs it as a CLI to
# emit the agent's <RUNTIME_SERVICES> block; same builder the dev stack uses).
COPY scripts/runtime-services-info.mjs /opt/agent-studio/runtime-services-info.mjs

# Copy custom tools (e.g. canvas_ui_tool.py) so the agent-server can import
# them via tool_module_qualnames. OH_EXTRA_PYTHON_PATH is set in entrypoint.sh.
COPY tools/ /opt/agent-studio/tools/

# Copy generated defaults.env (from config/defaults.json via config-gen stage)
COPY --from=config-gen /tmp/defaults.env /opt/agent-studio/defaults.env

# Copy the entrypoint
COPY docker/entrypoint.sh /opt/agent-studio/entrypoint.sh
RUN chmod +x /opt/agent-studio/entrypoint.sh

# Pre-create persistence directories with correct ownership so the
# bezotcorp user can write to them even when Docker creates anonymous
# volumes (which default to root).
RUN mkdir -p /home/bezotcorp/.bezotcorp/agent-studio/conversations \
  /home/bezotcorp/.bezotcorp/agent-studio/bash_events \
  /home/bezotcorp/.bezotcorp/automation \
  /projects && \
  chown -R bezotcorp:bezotcorp /home/bezotcorp/.bezotcorp /projects

USER bezotcorp

# Persistence volumes:
#   /home/bezotcorp/.bezotcorp — settings, secrets, conversations, automation DB
#   /projects                  — user code the agent can read/edit
# Bind-mount these for data to survive container restarts:
#   docker run -v ~/.bezotcorp:/home/bezotcorp/.bezotcorp -v ~/projects:/projects ...
VOLUME ["/home/bezotcorp/.bezotcorp", "/projects"]

# The entrypoint starts all services and the ingress proxy.
# Port 8000 is the unified entry point.
EXPOSE 8000

ENTRYPOINT ["tini", "--", "/opt/agent-studio/entrypoint.sh"]
