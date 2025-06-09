
# 🚗 KwikTrip Tracker

A personal web app for tracking visits to Kwik Trip gas station locations. Designed for use with friends, it features user authentication, map visualization, visit history, and an admin dashboard.

---

## 🌟 Features

- 🔐 User registration & login (with secure password hashing)
- 🗺️ Map of all Kwik Trip locations (visited/unvisited markers)
- 🧭 Filter by state, city, or visit status
- 📊 Dashboard with visit stats and progress
- 🧑‍🤝‍🧑 Friends dashboard to view others' progress
- 📋 Visit history view and deletion
- ⚙️ Profile controls (nickname & password update)
- 🛠️ Admin portal to:
  - Promote/demote users
  - Change nicknames, usernames, and passwords
  - Delete users
- 🧭 PWA support (installable on mobile)
- 🔔 Update checker (checks GitHub for latest version)

---

## 💾 Local Deployment (Docker)

### 1. Clone the repo

```bash
git clone https://github.com/your-username/kwiktrip-tracker.git
cd kwiktrip-tracker
```

### 2. Build & Run with Docker Compose

```bash
docker compose up --build
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:3001/api](http://localhost:3001/api)

---

## 🧪 Default Admin Credentials

| Username | Password |
|----------|----------|
| `admin`  | `admin`  |

Change this via the Admin Portal once logged in.

---

## 📂 Project Structure

```
.
├── backend/             # Node.js + SQLite backend
│   ├── db.js
│   ├── routes.js
│   └── seed.js
├── frontend/            # React + Vite frontend
│   ├── components/
│   ├── App.jsx
│   ├── main.jsx
│   └── styles/theme.css
├── data/                # SQLite data (persisted)
├── locations.json       # Static location list
├── docker-compose.yml
└── README.md
```

---

## 📦 API Endpoints

**Auth**
- `POST /api/register` – Create account
- `POST /api/login` – Login

**Visits**
- `GET /api/visits/:userId`
- `POST /api/visits`
- `DELETE /api/visits/:userId/:storeNumber`

**Users**
- `GET /api/users`
- `PUT /api/users/:id/nickname`
- `POST /api/users/:id/reset-password`

**Admin**
- `GET /api/admin/users?userId=...`
- `PUT /api/admin/users/:id/role?userId=...`
- `DELETE /api/admin/users/:id?userId=...`

---

## 🧠 Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Express + SQLite (via Better-SQLite3)
- **Maps:** Leaflet.js
- **Auth:** Local (no external auth)
- **Deployment:** Docker Compose

---

## 🔒 Security Notes

- Passwords are hashed with `bcryptjs`.
- Admin routes are protected via server-side checks.
- All user input is validated before storage.

---

## 🚧 Roadmap

- 🔄 Friend requests & following
- 📱 Improved mobile PWA layout
- 🗃️ Export visit data
- 🧩 Custom achievements or badges

---

## 📝 License

This project is for **personal use only** and not affiliated with Kwik Trip.

---

## 🙌 Acknowledgments

- Locations from [Kwik Trip’s official store list](https://www.kwiktrip.com/)
- Built with love and curiosity ❤️
