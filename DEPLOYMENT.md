# Cloud Deployment Guide

This document explains what to create and what to change when deploying this portfolio app to the cloud.

## 1. What to create first

1. Cloud account/project
   - AWS, Azure, GCP, Render, Vercel, Netlify, DigitalOcean, or similar.
2. Domain and SSL
   - Register a domain (example: `example.com`).
   - Configure HTTPS for both frontend and backend.
3. Backend environment
   - Create an app service, container service, or VM for the FastAPI backend.
   - Ensure the backend can run Python and expose port `8000` internally.
4. Frontend hosting
   - Create a static web host for the Vite-built React app.
   - Example: Netlify, Vercel, S3+CloudFront, Azure Static Web Apps.
5. Persistent storage
   - Backend currently stores data in `backend/data.json` and uploads in `backend/static/`.
   - Use a persistent disk or cloud volume for the backend if you keep file-based storage.
   - Prefer migrating to a database or object storage for production.
6. Environment variables
   - Create secure environment variables for backend auth and allowed origins.

## 2. Backend changes and setup

### What to change

- Use environment variables instead of hard-coded defaults for production.
- Configure a backend `.env` file for deployment in `backend/.env`.
- Example backend environment variables:
  - `ADMIN_USERNAME` — production admin username
  - `ADMIN_PASSWORD` — production admin password
  - `ALLOWED_ORIGINS` — production frontend URL(s)
  - `BACKEND_HOST` — host address for the server (`0.0.0.0` by default)
  - `BACKEND_PORT` — port for the backend server (`8000` by default)

### Backend `.env` usage

- Create `backend/.env` on the server or in your cloud app settings.
- Do not commit `backend/.env` to source control.
- Example values:
  ```env
  ADMIN_USERNAME=myadmin
  ADMIN_PASSWORD=strongpassword123
  ALLOWED_ORIGINS=https://www.example.com
  BACKEND_HOST=0.0.0.0
  BACKEND_PORT=8000
  ```
- `ALLOWED_ORIGINS` can include multiple origins separated by commas:
  ```env
  ALLOWED_ORIGINS=https://www.example.com,https://admin.example.com
  ```

### Important backend settings

- `ADMIN_USERNAME` and `ADMIN_PASSWORD` must be set for production.
- Do not rely on defaults in production.
- `ALLOWED_ORIGINS` must include your deployed frontend origin.
  - Example: `https://www.example.com`.
- `BACKEND_HOST` and `BACKEND_PORT` are just startup settings.
  - Cloud services usually set binding host and port from their own environment.
- If you keep `backend/data.json` and `backend/static`, use persistent storage.

### Deployment

- Install Python dependencies:
  - `pip install fastapi uvicorn`
- Use a production server startup command:
  - `uvicorn backend.main:app --host $BACKEND_HOST --port $BACKEND_PORT`
- If your cloud provider supplies the port automatically, use their recommended startup command instead.
- If using Docker, build and deploy a container with env vars set in the service configuration.

## 3. Frontend changes and setup

### What to change

- Remove any hard-coded backend API URL.
- Use Vite env variables in `frontend/src/App.jsx`.
- Example replacement:
  ```js
  const API = import.meta.env.VITE_API_URL
  ```
- Create a frontend production env file:
  - `frontend/.env.production`
  - `VITE_API_URL=https://api.example.com`
- Do not commit production env values to source control.

### Build and deploy

- Install frontend dependencies:
  - `cd frontend`
  - `npm install`
- Build the static site:
  - `npm run build`
- Deploy the generated `dist` folder to your static host.

## 4. URL and endpoint mapping

### Example production URLs

- Frontend site: `https://www.example.com`
- Backend API: `https://api.example.com`
- Admin login endpoint: `https://api.example.com/admin/login`
- Public data endpoints:
  - `https://api.example.com/api/hero`
  - `https://api.example.com/api/about`
  - `https://api.example.com/api/skills`
  - `https://api.example.com/api/projects`
  - `https://api.example.com/api/contact`
  - `https://api.example.com/api/analytics`
- Admin settings endpoints:
  - `https://api.example.com/admin/credentials`
  - `https://api.example.com/admin/analytics/reset`

## 5. Security checklist

1. Use HTTPS for both frontend and backend.
2. Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in production and avoid defaults.
3. Lock down CORS with `ALLOWED_ORIGINS` to the production frontend URL.
4. Store backend secrets in environment variables, not in source code.
5. Prefer a database or object storage over `data.json` in production.
6. Protect file uploads with validation and storage limits.
7. Run backend with a production server, not the development server.
8. Do not upload `.env` files to source control.

## 6. Recommended cloud deployment flow

1. Create your backend app or container.
2. Add the backend `.env` file or configure env vars in the cloud dashboard.
3. Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `ALLOWED_ORIGINS`.
4. Deploy backend code and verify the API endpoint.
5. Build the frontend and set `VITE_API_URL` to the backend URL.
6. Deploy frontend to static hosting.
7. Test the full site and admin login.
8. Confirm analytics tracking, uploads, and credential changes work.

## 7. Notes for production readiness

- The current backend uses in-memory session tokens.
  - In production, a more robust auth/session system is better.
- File storage is currently local.
  - For real cloud deployment, use S3, Azure Blob Storage, or equivalent.
- `data.json` is not ideal for multi-instance scaling.
  - Use a database when scaling beyond one backend instance.

---

This file is meant to be a deployment checklist and starting point for moving the portfolio app from local development to a secure cloud environment.