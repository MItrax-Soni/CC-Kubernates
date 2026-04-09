# Task Manager (Node.js + Express + Kubernetes)

A lightweight task management app with:
- Express REST API
- Static frontend served from `public/`
- File-based persistence in `data/tasks.json`
- Docker and Kubernetes deployment manifests

## Project Structure

- `server.js` - Express app entrypoint
- `routes/tasks.js` - Task API routes
- `controllers/taskController.js` - Task CRUD logic
- `utils/fileHelper.js` - Read/write task data
- `public/` - Frontend assets
- `scripts/smokeCrud.js` - API smoke test script
- `k8s/` and `cloud-k8s-project/k8s/` - Kubernetes manifests

## Tech Stack

- Node.js
- Express
- CORS
- UUID

## Run Locally

### 1) Install dependencies

```bash
npm install
```

### 2) Start the server

```bash
npm start
```

The app runs on:
- `http://localhost:3000`

## Development Mode

```bash
npm run dev
```

## API Endpoints

Base URL: `http://localhost:3000`

### Get all tasks

```http
GET /tasks
```

### Create a task

```http
POST /tasks
Content-Type: application/json
```

Example body:

```json
{
	"title": "Finish README",
	"description": "Add project docs",
	"priority": "medium",
	"dueDate": null
}
```

### Update a task

```http
PUT /tasks/:id
Content-Type: application/json
```

Example body:

```json
{
	"status": "done"
}
```

### Delete a task

```http
DELETE /tasks/:id
```

## Smoke Test the CRUD API

With the server running:

```bash
node scripts/smokeCrud.js
```

Optional custom base URL:

```bash
BASE_URL=http://localhost:3000 node scripts/smokeCrud.js
```

## Docker

Build image:

```bash
docker build -t task-manager .
```

Run container:

```bash
docker run -p 3000:3000 task-manager
```

## Kubernetes

Apply manifests (example):

```bash
kubectl apply -f k8s/
```

If you are using the cloud folder manifests:

```bash
kubectl apply -f cloud-k8s-project/k8s/
```

## Notes

- Data is currently persisted to `data/tasks.json`.
- For production, use a database instead of a local JSON file.