# Run server with Docker Compose

This file explains how to run the `server` service standalone using Docker Compose (includes a MongoDB service).

Files added
- `docker-compose.yml` — defines `mongodb` and `server` services (in this folder).
- `.env.docker` — example environment variables used by the `server` service. This file is ignored by the repo's `.gitignore` (rename/copy as needed).

Quick start (PowerShell)

```powershell
cd server
docker compose up -d --build

# View logs
docker compose logs -f server
```

Notes
- The compose file exposes MongoDB on `27017` and the server on `5000` (host). Change ports if needed.
- `.env.docker` contains a sample `MONGODB_URI` that points to the internal `mongodb` service. Update secrets before using in production.
- `uploads/` is mounted into the container so uploaded files persist on the host.
- To stop and remove containers:

```powershell
docker compose down -v
```

Security
- Rotate the example `JWT_SECRET` and database passwords before exposing this to the internet.
- Consider using Docker secrets or a secret manager for production deployments.
