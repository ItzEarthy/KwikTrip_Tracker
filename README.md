# 🛣️ KwikTrip Tracker

A privacy-friendly Progressive Web App (PWA) to track your visits to **Kwik Trip** locations. Easily see which stores you've visited, share progress with friends, and explore locations on an interactive map.

---

## 🚀 Features

- ✅ Track visits to any official Kwik Trip location  
- 🗺️ Map with filters for city/state/visited/unvisited  
- 📊 Landing page dashboard showing visit stats  
- 👥 Friends Dashboard to compare progress  
- 📱 Mobile-first responsive UI  
- 🔒 Local-only with no analytics or tracking  
- 🧠 Search bar with auto-suggestions (case-insensitive)  
- 🧩 Works offline as a PWA  
- 🔄 Ability to remove a visit  
- 📦 Docker-based deployment  

---

## 📁 Project Structure

```
kwiktrip-tracker/
├── backend/              # Express server + SQLite
├── frontend/             # Vite + React PWA frontend
├── docker-compose.yml    # Local container orchestration
└── README.md             # This file
```

---

## 🛠️ Local Development

### 1. Clone the repo

```bash
git clone https://github.com/yourname/kwiktrip-tracker.git
cd kwiktrip-tracker
```

### 2. Start the stack with Docker

```bash
docker compose up --build
```

- Frontend: http://localhost:5173  
- Backend API: http://localhost:3001/api

### 3. Visit the app

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔧 Tech Stack

| Layer      | Tech                       |
|------------|----------------------------|
| Frontend   | React + Vite               |
| Backend    | Node.js + Express          |
| Database   | SQLite (via better-sqlite3)|
| Deployment | Docker & Docker Compose    |
| Maps       | Leaflet + Jawg Tiles       |

---

## 🔐 Privacy First

- No login system (invite-code or nickname only)  
- No analytics, cookies, or tracking  
- All data stays on your local server  
- No cloud sync – designed for **local use only**  

---

## 🌐 Custom Domain + HTTPS (Optional)

You can expose your app securely with [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/).  
This app is HTTPS-ready and can be served at a custom domain like:

```
https://ktt.example.com
```

---

## 🧑‍💻 Developers

### Modify Styling

Theme styles are located in:

```
frontend/styles/theme.css
```

### Add or edit routes

See:

```
backend/routes.js
```

---

## 🧹 TODO

- [ ] Invite-based friend system  
- [ ] CSV import/export  
- [ ] Location visit notes  
- [ ] Dark mode toggle  
- [ ] Admin dashboard  

---

## 🧾 License

MIT License  
Created with ❤️ by [Your Name]

---

## 🐄 Kwik Trip ≠ Endorsed

> This is a **fan project** and is not affiliated with or endorsed by Kwik Trip, Inc.
