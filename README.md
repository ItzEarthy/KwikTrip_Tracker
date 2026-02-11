# 🚗 KwikTrip Tracker

[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-Personal%20Use-blue.svg)](#license)
[![Node.js](https://img.shields.io/badge/Node.js-18-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.1-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)

A personal web app for tracking visits to Kwik Trip gas station locations. Designed for use with friends, it features user authentication, map visualization, visit history, and an admin dashboard. Fully containerized with Docker for seamless deployment.

---

## 📑 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Docker Deployment](#docker-deployment)
  - [Development Mode](#development-mode)
  - [Production Mode](#production-mode)
  - [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Development](#development)
- [Security](#security)
- [Troubleshooting](#troubleshooting)
- [Performance & Scaling](#performance--scaling)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Features

- **Authentication System**: Secure user registration & login with bcrypt password hashing
- **Interactive Map**: Leaflet.js-powered map showing all Kwik Trip locations
- **Smart Filtering**: Filter locations by state, city, or visit status
- **Analytics Dashboard**: Comprehensive visit statistics and progress tracking
- **Social Features**: Friends dashboard to view and compare progress
- **Visit Management**: Complete visit history with deletion capabilities
- **Profile Controls**: Update nickname, username, and password
- **Admin Portal**: Full user management (promote/demote, edit, delete)
- **PWA Support**: Installable progressive web app for mobile devices
- **Version Checking**: Automatic GitHub version update notifications
- **Docker Native**: Fully containerized with multi-stage builds and optimized images

---

## 🏗️ Architecture

This application follows a modern microservices architecture with separate frontend and backend containers:

```
┌─────────────────┐
│   Nginx (80)    │  ← Frontend (React SPA)
│   Frontend      │
└────────┬────────┘
         │
         ↓ API Proxy
┌────────────────────┐
│  Express (3001)    │  ← Backend API
│  Backend + SQLite  │
└────────────────────┘
         │
         ↓
┌────────────────────┐
│  SQLite Database   │  ← Persistent Volume
│  (./backend/data)  │
└────────────────────┘
```

**Key Components:**
- **Frontend**: React 19.1 with Vite, served by Nginx in production
- **Backend**: Node.js 18 with Express 5, Better-SQLite3 for database
- **Database**: SQLite with volume persistence
- **Reverse Proxy**: Nginx handles API routing and static file serving

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed:

- **Docker**: Version 20.10 or higher ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: Version 2.0 or higher ([Install Docker Compose](https://docs.docker.com/compose/install/))
- **Git**: For cloning the repository ([Install Git](https://git-scm.com/downloads))

**System Requirements:**
- **RAM**: Minimum 2GB, recommended 4GB
- **Disk Space**: ~500MB for images and volumes
- **OS**: Linux, macOS, or Windows with WSL2

**Verify Installation:**
```bash
docker --version
docker compose version
git --version
```

---

## 🚀 Quick Start

Get up and running in under 2 minutes:

```bash
# 1. Clone the repository
git clone https://github.com/ItzEarthy/KwikTrip_Tracker.git
cd KwikTrip_Tracker

# 2. Start the application
docker compose up -d

# 3. Access the application
# Frontend: http://localhost:5173
# Backend API: http://localhost:3001/api
```

**Default Admin Credentials:**
```
Username: admin
Password: admin
```

⚠️ **IMPORTANT**: Change these credentials immediately after first login via the Admin Portal.

---

## 🐳 Docker Deployment

### Development Mode

For local development with hot-reload and debugging:

```bash
# Build and start in development mode
docker compose up --build

# View logs
docker compose logs -f

# Stop services
docker compose down
```

**Development Features:**
- Volume mounts for live code reloading
- Source maps enabled for debugging
- Verbose logging
- Auto-restart on file changes

### Production Mode

For production deployment with optimized builds:

```bash
# Build optimized production images
docker compose build --no-cache

# Start in detached mode
docker compose up -d

# Verify services are running
docker compose ps

# View logs
docker compose logs -f

# Health check
curl http://localhost:3001/api
curl http://localhost:5173
```

**Production Optimizations:**
- Multi-stage builds for minimal image size
- Nginx for efficient static file serving
- Automatic restarts with `unless-stopped` policy
- Optimized SQLite for better performance

### Environment Variables

#### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Server Configuration
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database
DATABASE_PATH=/app/data/data.db

# Security (optional - defaults are used if not set)
BCRYPT_ROUNDS=10

# CORS Settings
CORS_ORIGIN=http://localhost:5173
```

#### Frontend Environment Variables

The frontend uses a `.env` file in the `frontend/` directory:

```bash
# API Configuration
VITE_API_URL=/api
```

#### Docker Compose Environment

You can also set environment variables in `docker-compose.yml`:

```yaml
services:
  backend:
    environment:
      - NODE_ENV=production
      - PORT=3001
```

### Docker Commands Reference

```bash
# Build images without cache
docker compose build --no-cache

# Start services in background
docker compose up -d

# Stop services
docker compose down

# Stop and remove volumes (⚠️ deletes data)
docker compose down -v

# View running containers
docker compose ps

# View logs
docker compose logs -f [service_name]

# Execute commands in containers
docker compose exec backend sh
docker compose exec frontend sh

# Restart a specific service
docker compose restart backend

# Scale services (if needed)
docker compose up -d --scale backend=3

# View resource usage
docker stats
```

### Volume Management

The application uses Docker volumes for data persistence:

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect kwiktrip_tracker_backend_data

# Backup database
docker compose exec backend sqlite3 /app/data/data.db .dump > backup.sql

# Restore database
cat backup.sql | docker compose exec -T backend sqlite3 /app/data/data.db

# Clean up unused volumes
docker volume prune
```

---

## 📂 Project Structure

```
KwikTrip_Tracker/
├── backend/                      # Backend service
│   ├── Dockerfile               # Multi-stage backend image
│   ├── package.json             # Node.js dependencies
│   ├── index.js                 # Express server entry point
│   ├── routes.js                # API route handlers
│   ├── db.js                    # SQLite database connection
│   ├── seed.js                  # Database seeding script
│   ├── locations.json           # Kwik Trip location data
│   └── data/                    # SQLite database (volume mount)
│       └── data.db
│
├── frontend/                     # Frontend service
│   ├── Dockerfile               # Multi-stage build (Vite → Nginx)
│   ├── nginx.conf               # Nginx configuration
│   ├── package.json             # React dependencies
│   ├── vite.config.js           # Vite build configuration
│   ├── index.html               # SPA entry point
│   ├── public/                  # Static assets
│   │   ├── manifest.json        # PWA manifest
│   │   └── icons/
│   └── src/                     # React source code
│       ├── App.jsx              # Main application component
│       ├── main.jsx             # React entry point
│       ├── components/          # React components
│       └── styles/
│
├── docker-compose.yml           # Docker Compose orchestration
├── .gitignore                   # Git ignore rules
└── README.md                    # This file
```

**Key Files:**
- **docker-compose.yml**: Defines services, networks, and volumes
- **backend/Dockerfile**: Node.js backend with SQLite
- **frontend/Dockerfile**: Multi-stage build (Vite build + Nginx serve)
- **frontend/nginx.conf**: API proxy and SPA routing configuration

---

## 📦 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/register
Content-Type: application/json

{
  "username": "string",
  "password": "string",
  "nickname": "string"
}

Response: 201 Created
{
  "id": "number",
  "username": "string",
  "nickname": "string",
  "isAdmin": "boolean"
}
```

#### Login
```http
POST /api/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}

Response: 200 OK
{
  "id": "number",
  "username": "string",
  "nickname": "string",
  "isAdmin": "boolean"
}
```

### Visit Endpoints

#### Get User Visits
```http
GET /api/visits/:userId

Response: 200 OK
[
  {
    "storeNumber": "string",
    "visitedAt": "timestamp"
  }
]
```

#### Add Visit
```http
POST /api/visits
Content-Type: application/json

{
  "userId": "number",
  "storeNumber": "string"
}

Response: 201 Created
```

#### Delete Visit
```http
DELETE /api/visits/:userId/:storeNumber

Response: 200 OK
```

### User Management Endpoints

#### Get All Users
```http
GET /api/users

Response: 200 OK
[
  {
    "id": "number",
    "username": "string",
    "nickname": "string",
    "isAdmin": "boolean"
  }
]
```

#### Update Nickname
```http
PUT /api/users/:id/nickname
Content-Type: application/json

{
  "nickname": "string"
}

Response: 200 OK
```

#### Reset Password
```http
POST /api/users/:id/reset-password
Content-Type: application/json

{
  "currentPassword": "string",
  "newPassword": "string"
}

Response: 200 OK
```

### Admin Endpoints

All admin endpoints require `userId` query parameter for authorization.

#### Get All Users (Admin)
```http
GET /api/admin/users?userId=<adminId>

Response: 200 OK
```

#### Update User Role
```http
PUT /api/admin/users/:id/role?userId=<adminId>
Content-Type: application/json

{
  "isAdmin": "boolean"
}

Response: 200 OK
```

#### Delete User
```http
DELETE /api/admin/users/:id?userId=<adminId>

Response: 200 OK
```

---

## 💻 Development

### Local Development (without Docker)

If you prefer to develop without Docker:

#### Backend
```bash
cd backend
npm install
node seed.js    # Initialize database
node index.js   # Start server on port 3001
```

#### Frontend
```bash
cd frontend
npm install
npm run dev     # Start dev server on port 5173
```

### Hot Reload Development

For the best development experience with hot reload:

```bash
# Terminal 1: Backend (auto-restart on changes)
cd backend
npm install -g nodemon
nodemon index.js

# Terminal 2: Frontend (Vite HMR)
cd frontend
npm run dev
```

### Running Tests

```bash
# Backend tests (if available)
cd backend
npm test

# Frontend tests (if available)
cd frontend
npm test

# Linting
cd frontend
npm run lint
```

### Building for Production

```bash
# Build frontend only
cd frontend
npm run build
# Output: ./dist

# Build Docker images
docker compose build

# Test production build locally
docker compose -f docker-compose.yml up
```

### Debugging

#### Backend Debugging
```bash
# Start backend with debugger
docker compose exec backend node --inspect=0.0.0.0:9229 index.js

# Connect with Chrome DevTools at chrome://inspect
```

#### Frontend Debugging
- Use React DevTools browser extension
- Enable source maps in Vite config (already enabled)
- Use browser developer tools

---

## 🔒 Security

### Best Practices Implemented

✅ **Password Security**
- Passwords hashed with bcryptjs (10 rounds)
- Never stored in plain text
- Secure password reset flow

✅ **Input Validation**
- All user input validated before database insertion
- SQL injection prevention via parameterized queries
- XSS protection through React's built-in escaping

✅ **Authentication & Authorization**
- Session-based authentication
- Admin routes protected server-side
- User permissions validated on every request

✅ **Docker Security**
- Non-root user in containers
- Minimal base images (Alpine Linux)
- Multi-stage builds reduce attack surface
- No secrets in images or environment variables

### Security Recommendations

⚠️ **For Production Deployment:**

1. **Change Default Credentials**
   - Update admin password immediately after deployment

2. **Use HTTPS**
   - Deploy behind reverse proxy (Nginx, Traefik, Caddy)
   - Obtain SSL certificates (Let's Encrypt)

3. **Environment Variables**
   - Never commit `.env` files to git
   - Use Docker secrets or secret management tools
   - Rotate sensitive credentials regularly

4. **Database Backups**
   ```bash
   # Schedule regular backups
   docker compose exec backend sqlite3 /app/data/data.db .backup backup.db
   ```

5. **Network Security**
   - Use Docker networks to isolate services
   - Implement rate limiting
   - Add firewall rules

6. **Monitoring**
   - Enable container logging
   - Monitor for suspicious activity
   - Set up alerts for admin actions

---

## 🔧 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Error: bind: address already in use
# Solution: Stop the service using the port or change the port
docker compose down
# Or change ports in docker-compose.yml
```

#### Database Locked
```bash
# Error: database is locked
# Solution: Restart the backend service
docker compose restart backend
```

#### Cannot Connect to Backend
```bash
# Check if backend is running
docker compose ps

# Check backend logs
docker compose logs backend

# Verify backend is accessible
curl http://localhost:3001/api/users
```

#### Frontend Shows Blank Page
```bash
# Check frontend logs
docker compose logs frontend

# Check Nginx configuration
docker compose exec frontend cat /etc/nginx/conf.d/default.conf

# Rebuild frontend
docker compose build --no-cache frontend
docker compose up -d frontend
```

#### Volume Permission Issues
```bash
# Fix ownership
sudo chown -R $USER:$USER ./backend/data

# Or use Docker to fix
docker compose exec backend chown -R node:node /app/data
```

### Health Checks

```bash
# Check backend health
curl http://localhost:3001/api/users

# Check frontend health
curl -I http://localhost:5173

# Check container status
docker compose ps

# View container resource usage
docker stats

# Inspect a container
docker compose exec backend ps aux
```

### Logs and Debugging

```bash
# View all logs
docker compose logs

# Follow logs in real-time
docker compose logs -f

# View logs for specific service
docker compose logs backend
docker compose logs frontend

# View last 100 lines
docker compose logs --tail=100

# Save logs to file
docker compose logs > app-logs.txt
```

### Reset Everything

```bash
# Stop and remove all containers, networks, volumes
docker compose down -v

# Remove all images
docker compose down --rmi all

# Clean Docker system
docker system prune -a --volumes

# Start fresh
docker compose up --build
```

---

## 📊 Performance & Scaling

### Performance Optimization

**Frontend Optimizations:**
- ✅ Multi-stage Docker build for minimal image size
- ✅ Nginx with gzip compression enabled
- ✅ React lazy loading for code splitting
- ✅ Vite for optimized production builds
- ✅ Static asset caching headers

**Backend Optimizations:**
- ✅ Better-SQLite3 for synchronous, fast queries
- ✅ Express compression middleware (can be added)
- ✅ Database indexing on user IDs and store numbers
- ✅ Efficient API endpoint design

### Scaling Strategies

#### Horizontal Scaling

```bash
# Scale backend instances (requires load balancer)
docker compose up -d --scale backend=3
```

**Note**: SQLite doesn't support concurrent writes from multiple processes. For true horizontal scaling:
1. Migrate to PostgreSQL or MySQL
2. Implement session store (Redis)
3. Use load balancer (Nginx, HAProxy)

#### Vertical Scaling

```yaml
# docker-compose.yml - set resource limits
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### Monitoring

#### Container Monitoring
```bash
# Real-time stats
docker stats

# Prometheus + Grafana (recommended for production)
# Add monitoring stack to docker-compose.yml
```

#### Application Logging
```bash
# Configure structured logging
# Use log aggregation: ELK stack, Loki, or cloud logging
```

#### Metrics to Monitor
- Container CPU/Memory usage
- API response times
- Database query performance
- Error rates
- Active user sessions

---

## 🤝 Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. **Fork the repository**
   ```bash
   # Click "Fork" on GitHub
   git clone https://github.com/YOUR_USERNAME/KwikTrip_Tracker.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow existing code style
   - Add tests if applicable
   - Update documentation

4. **Test your changes**
   ```bash
   # Run locally with Docker
   docker compose up --build
   
   # Verify functionality
   # Check logs for errors
   ```

5. **Commit and push**
   ```bash
   git add .
   git commit -m "Add: your feature description"
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to GitHub and create a PR
   - Describe your changes
   - Link any related issues

### Code Style Guidelines

- **JavaScript/React**: Follow existing ESLint configuration
- **Docker**: Use multi-stage builds and Alpine images
- **Git Commits**: Use conventional commits (feat:, fix:, docs:, etc.)
- **Documentation**: Update README for significant changes

### Reporting Issues

Found a bug? Have a suggestion?

1. Check existing issues first
2. Create a new issue with:
   - Clear title
   - Steps to reproduce (for bugs)
   - Expected vs actual behavior
   - Environment details (OS, Docker version)

---

## 🚧 Roadmap

### Planned Features

- [ ] 🔄 Friend requests & following system
- [ ] 📱 Enhanced mobile PWA layout and offline support
- [ ] 🗃️ Export visit data (CSV, JSON, GPX)
- [ ] 🧩 Custom achievements and badge system
- [ ] 🔔 Push notifications for friend activity
- [ ] 📈 Advanced analytics and statistics
- [ ] 🌐 Social media integration
- [ ] 🗺️ Route planning between unvisited locations
- [ ] 📸 Photo uploads for visits
- [ ] 🏆 Leaderboard system

### Infrastructure Improvements

- [ ] 🐳 Kubernetes deployment manifests
- [ ] 🔄 CI/CD pipeline (GitHub Actions)
- [ ] 📊 Prometheus metrics export
- [ ] 🔍 Health check endpoints
- [ ] 🔐 OAuth2 authentication support
- [ ] 💾 PostgreSQL migration option
- [ ] 🌍 Multi-region deployment guide
- [ ] 📦 Helm chart for Kubernetes

---

## 📝 License

This project is for **personal use only** and is not affiliated with Kwik Trip, Inc.

**Terms:**
- Free to use for personal, non-commercial purposes
- Not licensed for commercial use
- No warranty provided
- Location data sourced from public Kwik Trip store listings

For commercial use or partnerships, please contact the maintainers.

---

## 🙌 Acknowledgments

- **Location Data**: [Kwik Trip Official Store List](https://www.kwiktrip.com/)
- **Mapping**: [Leaflet.js](https://leafletjs.com/) - Open-source JavaScript library
- **Icons**: [React Icons](https://react-icons.github.io/react-icons/)
- **Docker**: Built with love for the Docker community
- **Contributors**: Thanks to all who have contributed to this project

---

## 📞 Support

Need help?

- 📚 **Documentation**: Read this README thoroughly
- 🐛 **Issues**: [GitHub Issues](https://github.com/ItzEarthy/KwikTrip_Tracker/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/ItzEarthy/KwikTrip_Tracker/discussions)

---

<div align="center">

**Built with ❤️ and curiosity**

⭐ Star this repo if you find it useful!

[Report Bug](https://github.com/ItzEarthy/KwikTrip_Tracker/issues) · [Request Feature](https://github.com/ItzEarthy/KwikTrip_Tracker/issues) · [Documentation](#table-of-contents)

</div>
