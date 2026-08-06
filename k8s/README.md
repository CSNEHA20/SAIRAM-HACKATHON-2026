# Kubernetes Deployment

Reference: docs/architecture-repository/22_DockerArchitecture.md

This directory contains Kubernetes manifests for deploying DataFlow AI.

## Quick Start

```bash
# Build images (or use your registry)
docker-compose -f ../docker-compose.yml build

# Load images into kind (optional example)
kind load docker-image dataflow-backend:latest --name dataflow
kind load docker-image dataflow-frontend:latest --name dataflow

# Apply manifests
kubectl apply -k .

# Access locally
kubectl port-forward -n dataflow svc/dataflow-frontend 3000:80
kubectl port-forward -n dataflow svc/dataflow-backend 8000:8000
```

## Configuration

Edit `configmap.yaml` and `secret.yaml` before deploying to production:

- `ANTHROPIC_API_KEY` / `NVIDIA_API_KEY` in `secret.yaml`
- `DB_TYPE` in `configmap.yaml`: `sqlite` (default), `postgresql`, `mysql`, `mongodb`
- `DATABASE_URL` in `secret.yaml` when using PostgreSQL/MySQL/MongoDB
- `SESSION_BACKEND` in `configmap.yaml`: `memory` (default) or `sqlite`
- `AUTH_ENABLED` in `configmap.yaml`: set to `true` and configure `API_KEY` or basic auth credentials in `secret.yaml`
- `RATE_LIMIT_RPM` in `configmap.yaml`: requests-per-minute limit per user/session

## Scaling Notes

- The backend uses a PVC for SQLite; use PostgreSQL/MySQL and Redis (or the included Redis deployment with a Redis session backend) before scaling replicas beyond 1.
- HPA is configured for both frontend and backend.
- The ingress routes `/api/*` to the backend and all other paths to the frontend.
