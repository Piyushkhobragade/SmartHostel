<p align="center">
  <img src="https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" />
  <img src="https://img.shields.io/badge/AWS_EC2-FF9900?style=for-the-badge&logo=amazonec2&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white" />
  <img src="https://img.shields.io/badge/Prometheus-E6522C?style=for-the-badge&logo=prometheus&logoColor=white" />
  <img src="https://img.shields.io/badge/Kustomize-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" />
</p>

<h1 align="center">&#9729;&#65039; SmartHostel</h1>

<p align="center">
  <b>A production-grade, cloud-native hostel management platform demonstrating<br/>end-to-end DevOps, container orchestration, and CI/CD automation.</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square" />
  <img src="https://img.shields.io/badge/K8s_Manifests-22_files-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/Docker_Images-2_services-blue?style=flat-square" />
  <img src="https://img.shields.io/badge/CI/CD-Fully_Automated-purple?style=flat-square" />
  <img src="https://img.shields.io/badge/License-ISC-green?style=flat-square" />
</p>

---

## &#127919; What This Project Demonstrates

This is not a tutorial project. SmartHostel is a fully functional multi-tenant platform &mdash; **containerized, orchestrated, and deployed** using industry-standard DevOps practices.

| Skill Area | What's Implemented |
|---|---|
| **Containerization** | Multi-stage Docker builds, non-root containers, layer caching, minimal images |
| **Orchestration** | Kubernetes Deployments, Services, Ingress, HPA, Network Policies, RBAC, Kustomize |
| **CI/CD** | GitHub Actions pipeline &rarr; GHCR registry &rarr; Auto-deploy to AWS EC2 via SSH |
| **Observability** | Prometheus metrics endpoint, structured JSON logging (Pino), Kubernetes health probes |
| **Security** | Pod security contexts, network segmentation, least-privilege RBAC, Helmet, rate limiting |
| **Cloud Deployment** | AWS EC2 production deployment with automated provisioning scripts |
| **Reliability** | Graceful shutdown, DB connection retries, health-based dependency ordering |

---

## &#127959;&#65039; Architecture

```
                    ┌───────────────────────────────────────────────────────┐
                    │                   KUBERNETES CLUSTER                  │
                    │                  namespace: smart-hostel              │
                    │                                                       │
   Internet ──────▶│  ┌─────────┐     ┌──────────────┐     ┌───────────┐  │
                    │  │ Ingress │────▶│   Frontend   │     │ PostgreSQL│  │
                    │  │ (Nginx) │     │  (2 replicas)│     │  (PVC)    │  │
                    │  │         │     │  nginx:1.27  │     │  16-alpine│  │
                    │  │         │     └──────────────┘     └─────▲─────┘  │
                    │  │         │                                │        │
                    │  │         │     ┌──────────────┐          │        │
                    │  │         │────▶│   Backend    │──────────┘        │
                    │  │         │/api │ (2-10 replicas)                   │
                    │  └─────────┘     │  node:20-slim │                   │
                    │                  │  HPA @ 70% CPU│                   │
                    │                  └──────────────┘                    │
                    │                                                       │
                    │  ┌──────────────────────────────────────────────┐    │
                    │  │          NETWORK POLICIES                     │    │
                    │  │  ● Default deny all ingress/egress            │    │
                    │  │  ● Frontend → Backend :3000 only              │    │
                    │  │  ● Backend → PostgreSQL :5432 only            │    │
                    │  │  ● Backend → kube-dns :53 only                │    │
                    │  └──────────────────────────────────────────────┘    │
                    └───────────────────────────────────────────────────────┘
```

---

## &#128051; Container Strategy

### Multi-Stage Builds

Both services use optimized multi-stage Dockerfiles to minimize image size and attack surface.

**Backend** &mdash; 3-stage build (`deps` &rarr; `builder` &rarr; `runtime`):

```dockerfile
# Stage 1: Install dependencies (cached layer)
FROM node:20-slim AS deps
RUN npm ci --ignore-scripts

# Stage 2: Generate Prisma client + compile TypeScript
FROM node:20-slim AS builder
COPY --from=deps /app/node_modules ./node_modules
RUN npx prisma generate && npm run build

# Stage 3: Production runtime (minimal)
FROM node:20-slim AS runtime
RUN npm ci --omit=dev --ignore-scripts    # Production deps only
USER node                                  # Non-root execution
CMD ["node", "dist/startup.js"]
```

**Frontend** &mdash; 2-stage build:

```dockerfile
# Stage 1: Build Vite SPA
FROM node:20-alpine AS builder
RUN npm ci && npm run build

# Stage 2: Serve with Nginx
FROM nginx:1.27-alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
```

| Image | Base | Final Size | Non-Root |
|---|---|---|---|
| Backend | `node:20-slim` | ~415 MB | &#9989; `USER node` |
| Frontend | `nginx:1.27-alpine` | ~76 MB | &#9989; nginx worker |

### Docker Compose (Development / EC2)

```yaml
services:
  postgres:
    image: postgres:16-alpine
    healthcheck:                          # Kubernetes-style readiness
      test: ["CMD-SHELL", "pg_isready -U smarthostel"]
      interval: 10s
      retries: 5

  backend:
    depends_on:
      postgres:
        condition: service_healthy        # Waits for DB readiness
    healthcheck:
      test: [HTTP GET localhost:3000]
      start_period: 60s                   # Grace period for cold start

  frontend:
    depends_on:
      backend:
        condition: service_healthy        # Cascading health gates
```

**Key design decisions:**
- &#9989; Health-check gated startup ordering (`service_healthy`)
- &#9989; Named volumes for PostgreSQL persistence
- &#9989; Internal bridge network (no unnecessary port exposure)
- &#9989; Restart policy: `unless-stopped`

---

## &#9784;&#65039; Kubernetes Manifests

### 22 Production-Ready Manifests

```
k8s/
├── kustomization.yaml              ← Kustomize root
├── namespace/namespace.yaml        ← Dedicated namespace isolation
├── config/
│   ├── configmap.yaml              ← Non-sensitive configuration
│   └── secret.yaml                 ← Base64-encoded secrets
├── postgres/
│   ├── deployment.yaml             ← Persistent database pod
│   ├── service.yaml                ← ClusterIP :5432
│   └── pvc.yaml                    ← Persistent Volume Claim
├── backend/
│   ├── deployment.yaml             ← 2 replicas, resource limits, security contexts
│   └── service.yaml                ← ClusterIP :3000
├── frontend/
│   ├── deployment.yaml             ← 2 replicas, static serving
│   └── service.yaml                ← ClusterIP :80
├── ingress/
│   └── ingress.yaml                ← Nginx ingress with path-based routing
├── autoscaling/
│   └── backend-hpa.yaml            ← HPA: 2→10 pods @ 70% CPU
├── networkpolicy/
│   ├── default-deny.yaml           ← Zero-trust baseline
│   ├── backend-policy.yaml         ← Backend ↔ Postgres only
│   ├── frontend-policy.yaml        ← Frontend → Backend only
│   └── postgres-policy.yaml        ← Postgres accepts backend only
├── rbac/
│   ├── serviceaccounts.yaml        ← Per-service service accounts
│   ├── role.yaml                   ← Least-privilege role definition
│   └── rolebinding.yaml            ← SA → role binding
└── migrate-job.yaml                ← One-shot Prisma migration Job
```

### Pod Security Hardening

```yaml
securityContext:
  runAsNonRoot: true
  seccompProfile:
    type: RuntimeDefault

containers:
  - securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop: [ALL]

    resources:
      requests:
        cpu: "250m"
        memory: "256Mi"
      limits:
        cpu: "500m"
        memory: "512Mi"
```

Every pod runs with:

&#9989; Non-root user &nbsp;&nbsp; &#9989; Read-only filesystem &nbsp;&nbsp; &#9989; All capabilities dropped &nbsp;&nbsp; &#9989; Seccomp enabled &nbsp;&nbsp; &#9989; Resource limits enforced

### Horizontal Pod Autoscaler

```yaml
apiVersion: autoscaling/v2
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2           # Always highly available
  maxReplicas: 10          # Scale ceiling
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

### Network Policies (Zero-Trust Model)

```
Default:  DENY ALL ingress + egress (every pod is isolated)

Explicit allow rules:
  Ingress Controller  →  Frontend :80
  Frontend            →  Backend :3000
  Backend             →  PostgreSQL :5432
  Backend             →  kube-dns :53 (DNS resolution)

Everything else:  BLOCKED
```

---

## &#128260; CI/CD Pipeline

```
┌──────────┐      ┌───────────────────────────────────┐      ┌──────────────┐
│  Developer│      │        GitHub Actions              │      │   Production  │
│           │      │                                     │      │   (AWS EC2)   │
│  git push │─────▶│  ┌─────────┐  ┌─────────────────┐ │      │               │
│  to main  │      │  │   CI    │  │  Publish & Deploy│ │      │               │
│           │      │  │         │  │                   │ │      │               │
└──────────┘      │  │ Lint    │  │ Build images     │─┼─────▶│ docker compose│
                   │  │ Type ✓  │  │ Push to GHCR     │ │ SSH  │ up -d         │
                   │  │ Build   │  │ SSH deploy       │ │      │               │
                   │  │ Docker ✓│  │ Seed database    │ │      │               │
                   │  └────┬────┘  └─────────────────┘ │      └──────────────┘
                   │       │              ▲              │
                   │       └──────────────┘              │
                   │      CI gate must pass first        │
                   └───────────────────────────────────┘
```

### Workflow 1: `ci.yml` &mdash; Quality Gate

Triggers on every push and PR to `main` and `dev` branches.

| Step | Backend | Frontend |
|---|---|---|
| Install | `npm ci` with lockfile cache | `npm ci` with lockfile cache |
| Lint | &mdash; | `eslint` |
| Typecheck | `tsc --noEmit` | `tsc --noEmit` |
| Build | TypeScript compilation | Vite production build |
| Docker | BuildKit build validation with GHA cache | Compose config validation |

Features: **concurrency groups** (auto-cancel stale runs), **reusable workflows** (`workflow_call`).

### Workflow 2: `docker-publish.yml` &mdash; Build, Publish, Deploy

Triggers on push to `main` only. Runs **after** CI gate passes.

| Stage | Details |
|---|---|
| **CI Gate** | Reuses `ci.yml` as a required prerequisite (`workflow_call`) |
| **Publish** | Parallel matrix build of both services &rarr; Push to GitHub Container Registry |
| **Deploy** | SSH into AWS EC2 &rarr; `git pull` &rarr; `bash setup-aws.sh` &rarr; zero-downtime restart |

**Image tagging strategy:**
```
ghcr.io/<owner>/smarthostel-backend:latest       ← Rolling latest
ghcr.io/<owner>/smarthostel-backend:main          ← Branch tag
ghcr.io/<owner>/smarthostel-backend:sha-a1b2c3d   ← Immutable commit SHA
```

---

## &#128202; Observability

### Kubernetes Health Probes

```yaml
livenessProbe:                         # Restart unhealthy pods
  httpGet:
    path: /healthz
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:                        # Remove from Service until ready
  httpGet:
    path: /readyz                      # Checks PostgreSQL connectivity
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 5
```

### Application Health Endpoints

| Endpoint | Purpose | Checks |
|---|---|---|
| `GET /healthz` | Liveness probe | Process is alive |
| `GET /readyz` | Readiness probe | PostgreSQL `SELECT 1` |
| `GET /health/ai` | Composite health | DB + AI engine + Scheduler |
| `GET /metrics` | Prometheus scrape | Node.js + HTTP histogram metrics |

### Prometheus Metrics

Native `prom-client` integration:

```
# HELP http_request_duration_seconds Duration of HTTP requests in seconds
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",route="/api/residents",status_code="200",le="0.1"} 127
http_request_duration_seconds_bucket{method="GET",route="/api/residents",status_code="200",le="0.5"} 142
```

Plus default Node.js runtime metrics: event loop lag, heap usage, active handles, GC pauses.

### Structured Logging (Pino)

```json
{"level":30,"time":1720000000,"msg":"[Startup] Database connection verified."}
{"level":30,"time":1720000001,"msg":"[Startup] Server listening on port 3000","nodeEnv":"production","port":3000}
```

Machine-parseable JSON &mdash; ready for **Fluentd**, **Loki**, **CloudWatch**, or **ELK**.

---

## &#128640; Production Startup Lifecycle

```
boot()
  │
  ├─ 1. Validate configuration (fail-fast on missing env vars)
  │
  ├─ 2. Register SIGTERM/SIGINT handlers (before anything else)
  │
  ├─ 3. Verify database connectivity
  │     └─ 5 retries × 2s backoff → fatal exit if unreachable
  │
  ├─ 4. Start background scheduler (cron-based intelligence checks)
  │
  ├─ 5. AI subsystem diagnostics (non-blocking)
  │
  └─ 6. Express server starts accepting traffic
```

**Separation of concerns:** Schema migrations, admin creation, and data seeding are handled by dedicated operational scripts and Kubernetes Jobs &mdash; never by the application startup.

### Graceful Shutdown

```
SIGTERM received
  ├─ Guard against double-shutdown
  ├─ server.close() — stop accepting new connections
  ├─ 10-second drain timeout for in-flight requests
  ├─ Stop background scheduler
  ├─ prisma.$disconnect() — close database pool
  └─ process.exit(0)
```

---

## &#128274; Security Posture

| Layer | Measure | Implementation |
|---|---|---|
| **Container** | Non-root execution | `USER node` in Dockerfile |
| **Container** | Read-only root filesystem | K8s `readOnlyRootFilesystem: true` |
| **Container** | Capability dropping | `capabilities: drop: [ALL]` |
| **Container** | Seccomp profiles | `seccompProfile: RuntimeDefault` |
| **Network** | Zero-trust segmentation | Default deny + explicit NetworkPolicies |
| **Network** | Server tokens hidden | `server_tokens off` in Nginx |
| **Application** | HTTP security headers | Helmet.js middleware |
| **Application** | Rate limiting | `express-rate-limit` on all endpoints |
| **Application** | Input validation | Zod schemas on mutation endpoints |
| **Application** | Authentication | Signed JWT tokens with role-based access |
| **Application** | Password security | bcrypt hashing with salt |
| **Application** | AI prompt injection guard | Custom sanitization + injection detection |
| **Secrets** | Kubernetes Secrets | Mounted via `secretRef`, never hardcoded |
| **CI/CD** | GHCR authentication | `GITHUB_TOKEN` &mdash; no long-lived credentials |

---

## &#128736;&#65039; Nginx Reverse Proxy

Production-optimized `nginx.conf`:

```nginx
server_tokens off;                                    # Hide version

gzip on;                                              # Compression
gzip_comp_level 6;
gzip_types text/css application/json application/javascript image/svg+xml;

location ~* \.(js|css|woff2?|png|jpg)$ {              # Immutable asset cache
    expires 1y;
    add_header Cache-Control "public, immutable";
}

location / {                                          # SPA client-side routing
    try_files $uri $uri/ /index.html;
}

location /api {                                       # API reverse proxy
    proxy_pass http://backend:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
}

location = /index.html {                              # Never cache entry point
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}
```

---

## &#128193; Repository Structure

```
SmartHostel/
│
├── .github/workflows/
│   ├── ci.yml                    ← Quality gate: lint + typecheck + build + Docker
│   └── docker-publish.yml        ← Build → Push to GHCR → Auto-deploy to AWS
│
├── k8s/                          ← 22 Kubernetes manifests
│   ├── namespace/                    Dedicated namespace isolation
│   ├── config/                       ConfigMap + Secret management
│   ├── backend/                      Deployment + Service (2 replicas)
│   ├── frontend/                     Deployment + Service (2 replicas)
│   ├── postgres/                     Deployment + PVC + Service
│   ├── ingress/                      Path-based routing (/ and /api)
│   ├── autoscaling/                  HPA: 2→10 pods @ 70% CPU
│   ├── networkpolicy/                Zero-trust network segmentation
│   ├── rbac/                         Service accounts + least-privilege roles
│   └── migrate-job.yaml             One-shot database migration Job
│
├── backend/
│   ├── Dockerfile                ← 3-stage optimized build
│   ├── prisma/schema.prisma      ← 16 data models
│   └── src/
│       ├── startup.ts            ← Production lifecycle (retry + graceful shutdown)
│       ├── routes/health.routes  ← K8s probes + Prometheus metrics
│       ├── middleware/           ← Auth, validation, rate limiting, error handling
│       └── ...                   ← Controllers, services, utils
│
├── frontend/
│   ├── Dockerfile                ← 2-stage build (Vite → Nginx)
│   ├── nginx.conf                ← Reverse proxy + gzip + cache control
│   └── src/                      ← React SPA
│
├── docker-compose.yml            ← Health-gated service orchestration
└── setup-aws.sh                  ← One-command AWS EC2 provisioning
```

---

## &#9889; Quick Start

### Option 1: Docker Compose (Recommended)

```bash
git clone https://github.com/Piyushkhobragade/SmartHostel.git
cd SmartHostel

# Start all services
docker compose up -d

# Verify health
curl http://localhost/healthz          # {"status":"ok"}
curl http://localhost/readyz           # {"status":"ok","db":"connected"}
```

### Option 2: Kubernetes (Kind)

```bash
# Create cluster
kind create cluster --name smarthostel

# Build images
docker compose build

# Load into Kind
kind load docker-image smarthostel-backend:local smarthostel-frontend:local \
  --name smarthostel

# Deploy
kubectl apply -k k8s/

# Verify
kubectl -n smart-hostel get pods
kubectl -n smart-hostel get hpa
kubectl -n smart-hostel get networkpolicy
```

### Option 3: AWS EC2 (One-Command)

```bash
# SSH into your EC2 instance, then:
git clone https://github.com/Piyushkhobragade/SmartHostel.git
cd SmartHostel
sudo bash setup-aws.sh
# App available at http://<EC2-PUBLIC-IP>
```

---

## &#128200; Scaling Strategy

| Dimension | Approach |
|---|---|
| **Horizontal** | HPA auto-scales backend pods from 2 to 10 based on CPU utilization |
| **Database** | PVC-backed PostgreSQL with connection pooling via Prisma |
| **Frontend** | Nginx serves static assets &mdash; horizontally scalable, CDN-ready |
| **Build** | CI matrix strategy builds backend + frontend in parallel |

---

## &#128506;&#65039; Roadmap

- [ ] Helm chart for parameterized multi-environment deployments
- [ ] ArgoCD GitOps for declarative continuous delivery
- [ ] Grafana dashboards consuming Prometheus metrics
- [ ] Trivy container image scanning in CI pipeline
- [ ] PostgreSQL HA with PgBouncer connection pooling
- [ ] Terraform IaC for AWS infrastructure provisioning
- [ ] Istio service mesh for mTLS inter-service communication

---

<p align="center">
  <b>Built by <a href="https://github.com/Piyushkhobragade">Piyush Khobragade</a></b>
</p>
