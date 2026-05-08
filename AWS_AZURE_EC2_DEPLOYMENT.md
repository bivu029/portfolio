# AWS / Azure EC2 Deployment Guide

This document explains how to deploy the portfolio app on a Linux VM such as AWS EC2 or Azure Virtual Machine.

## Overview

This app has two parts:
- `frontend` — React/Vite static site
- `backend` — FastAPI API plus runtime data storage

On an EC2/Azure VM, you can host both parts on the same instance.
Use a reverse proxy such as Nginx to serve the frontend and forward API requests to the backend.

## 1. Provision the VM

### AWS EC2
1. Create an EC2 instance (Ubuntu 22.04 or Amazon Linux 2023 recommended).
2. Choose a machine size appropriate for your app (t2.micro/t3.micro is enough for a small portfolio).
3. Attach an EBS volume large enough for your repo and runtime files.
4. Open ports in the security group:
   - `22` for SSH
   - `80` for HTTP
   - `443` for HTTPS
   - optionally `8000` for direct backend testing (not recommended for production)

### Azure VM
1. Create a Linux virtual machine (Ubuntu 22.04 recommended).
2. Use a managed disk or standard SSD for persistent storage.
3. Open inbound ports:
   - `22` SSH
   - `80` HTTP
   - `443` HTTPS

## 2. Install system dependencies

SSH into the VM and run:

```bash
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nodejs npm nginx git
```

If `node` is not installed by default, install Node 20+ from NodeSource or the distro package.

## 3. Clone your repository

```bash
cd /opt
sudo git clone <your-repo-url> portfolio-app
sudo chown -R $USER:$USER portfolio-app
cd portfolio-app
```

If you do not want to use GitHub, you can copy files manually or use `scp`/`rsync`.

## 4. Backend setup

### 4.1 Create a Python virtual environment

```bash
cd /opt/portfolio-app/backend
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install fastapi uvicorn
```

If your backend needs other packages, install them too.

### 4.2 Configure environment variables

Create a `backend/.env` file and do not commit it:

```bash
cd /opt/portfolio-app/backend
cat > .env <<'EOF'
ADMIN_USERNAME=myadmin
ADMIN_PASSWORD=StrongProductionPassword123!
ALLOWED_ORIGINS=https://example.com
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
EOF
```

If you serve frontend from the same VM on port 80, set `ALLOWED_ORIGINS` to the frontend origin:
- `http://<public-ip>`
- `https://www.example.com`

### 4.3 Protect `.env`

```bash
chmod 600 backend/.env
```

### 4.4 Start backend for testing

```bash
cd /opt/portfolio-app/backend
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

Open `http://<your-vm-ip>:8000/docs` to verify the API is running.

## 5. Frontend setup

### 5.1 Create frontend env file

In `frontend/.env.production`:

```bash
cd /opt/portfolio-app/frontend
cat > .env.production <<'EOF'
VITE_API_URL=http://<your-vm-ip>:8000
EOF
```

If you use a domain with HTTPS, set the backend URL to the full secure API URL instead:

```bash
VITE_API_URL=https://api.example.com
```

### 5.2 Build the frontend

```bash
cd /opt/portfolio-app/frontend
npm install
npm run build
```

The build output will be in `frontend/dist`.

## 6. Configure Nginx

### 6.1 Basic Nginx setup

Create an Nginx site config, for example `/etc/nginx/sites-available/portfolio`:

```nginx
server {
    listen 80;
    server_name example.com;

    root /opt/portfolio-app/frontend/dist;
    index index.html index.htm;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        try_files $uri $uri/ /index.html;
    }

    location /static/ {
        try_files $uri $uri/ =404;
    }
}
```

### 6.2 Enable the site

```bash
sudo ln -s /etc/nginx/sites-available/portfolio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6.3 HTTPS setup

On AWS, use ACM and a load balancer, or use Certbot for a standalone VM.
On Azure, use the same DNS/SSL process for your VM.

To install Certbot on Ubuntu:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com
```

## 7. Backend process management

Use `systemd` so the backend keeps running.

Create `/etc/systemd/system/portfolio-backend.service`:

```ini
[Unit]
Description=Portfolio backend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/portfolio-app/backend
EnvironmentFile=/opt/portfolio-app/backend/.env
ExecStart=/opt/portfolio-app/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Enable and start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable portfolio-backend
sudo systemctl start portfolio-backend
sudo systemctl status portfolio-backend
```

## 8. Persistent storage

For AWS EC2 or Azure VM, the attached disk is persistent by default.
That means `backend/data.json` and `backend/static/` remain available after reboot.

### Important
- If you recreate the VM or replace the disk, runtime changes can be lost.
- Keep backups of `backend/data.json` and uploaded files.
- For stronger production durability, move runtime data to a database or cloud object storage.

## 9. DNS and final test

1. Point your domain to the VM public IP.
2. Ensure `ALLOWED_ORIGINS` contains the frontend origin.
3. Ensure `VITE_API_URL` matches the backend URL.
4. Visit the site in a browser.
5. Use admin login and confirm content updates appear on the frontend.

## 10. Security checklist for EC2 / Azure VM

- Use HTTPS in production.
- Keep `backend/.env` out of source control.
- Use strong admin credentials and change defaults.
- Limit SSH access with key pairs and firewall rules.
- Keep the VM and packages updated.
- Use Nginx to protect the backend and expose only necessary ports.

## 11. Notes

- If you want to use a separate frontend host later, you can deploy the built `frontend/dist` to a static host and keep the backend on EC2.
- If the backend and frontend share the same origin behind Nginx, CORS is easier to manage.
- If you use the backend directly from the browser, make sure `ALLOWED_ORIGINS` includes the exact frontend origin.
