<div align="center">

# 🍽️ MyRestaurant

**A mobile restaurant app for ordering, table reservations and a virtual assistant, with separate client and admin experiences.**

![React Native](https://img.shields.io/badge/React%20Native-Expo%20SDK%2057-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)
![Ollama](https://img.shields.io/badge/AI-Ollama%20(optional)-1F1F1F)
![n8n](https://img.shields.io/badge/Automation-n8n%20(optional)-EA4B71)

Academic project, class DSI3 · Author: **Adem Berrabia**

</div>

---

## Table of contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [REST API overview](#rest-api-overview)
- [Security](#security)
- [Virtual assistant](#virtual-assistant)
- [Order alerts with n8n](#order-alerts-with-n8n-optional)
- [Roadmap](#roadmap)
- [Author](#author)

---

## Features

### Client
- Register, log in and manage a profile (name, password, photo from camera or gallery)
- Browse the menu, search dishes and filter by category
- Dish details with price, description, allergens and vegetarian label
- Favorites
- Cart with quantities, delete and live total, saved on the device (AsyncStorage)
- Place an order for dine-in (with table number) or takeaway
- Order history, with cancellation while the order is still pending
- Table reservation with date, time slot and party size, checked against opening hours and capacity
- Virtual assistant for dish advice, allergens and food safety

### Admin
- Dashboard with orders, revenue, reservations and users
- Create, edit and delete dishes, upload photos, mark a dish as sold out
- Process orders and update their status
- View and delete reservations
- Manage users and promote or demote their role
- Role enforced by the server on every admin route, not only hidden in the UI

---

## Screenshots

| Login | Menu | Dish details | Cart |
|---|---|---|---|
| ![Login](docs/screenshots/login.png) | ![Menu](docs/screenshots/menu.png) | ![Details](docs/screenshots/detail.png) | ![Cart](docs/screenshots/cart.png) |

| Assistant | Reservation | Admin dashboard | Admin orders |
|---|---|---|---|
| ![Assistant](docs/screenshots/assistant.png) | ![Reservation](docs/screenshots/reservation.png) | ![Dashboard](docs/screenshots/admin-dashboard.png) | ![Orders](docs/screenshots/admin-orders.png) |

---

## Tech stack

| Layer | Technology |
|---|---|
| Mobile app | React Native, Expo SDK 57, React Navigation (tabs and stack) |
| State | Context API (auth, cart, favorites), AsyncStorage |
| Native feature | `expo-image-picker` (camera and gallery) |
| Backend | Node.js, Express |
| Database | MongoDB with Mongoose |
| Auth | JWT, bcryptjs |
| Security | helmet, express-rate-limit, input sanitizing |
| Optional | Ollama (local AI), n8n (workflow automation), Telegram |

---

## Architecture

```
Mobile app (Expo Go)
   |  HTTP + JSON (JWT in the Authorization header)
   v
Express API  --  auth, roles, validation, rate limits
   |                       |
   v                       v
MongoDB                 uploads/ (dish photos)
(users, meals, orders, reservations)
```

The app never talks to MongoDB directly. The server checks the token, the role and the data before reading or writing, and recalculates prices and totals itself.

---

## Project structure

```
myrestaurant/
├── backend/
│   ├── server.js
│   ├── config.js              # opening hours, capacity, limits
│   ├── createAdmin.js         # creates an admin account
│   ├── models/                # User, Meal, Order, Reservation
│   ├── routes/                # auth, meals, orders, reservations, admin, chat
│   ├── middleware/            # auth, sanitize, rate limiters
│   ├── utils/                 # n8n notification
│   └── .env.example
├── mobile/
│   ├── App.js
│   ├── navigation/            # role-based navigation
│   ├── screens/
│   │   ├── auth/
│   │   ├── client/
│   │   ├── shared/
│   │   └── admin/
│   ├── components/
│   ├── context/               # Auth, Cart, Favorites
│   ├── services/              # API client
│   └── utils/                 # chatbot, allergens, dates, images
└── docs/
```

---

## Getting started

### Prerequisites
- Node.js 18 or newer
- MongoDB running locally
- The **Expo Go** app on your phone (SDK 57 version)
- Phone and computer on the same Wi-Fi network

### 1. Clone

```bash
git clone https://github.com/Adem-Berrabia/MyRestaurant-.git
cd MyRestaurant-
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env      # on Windows: copy .env.example .env
```

Edit `.env` (see [Environment variables](#environment-variables)), then create an admin account and start the server:

```bash
node createAdmin.js "Administrator" admin@myrestaurant.tn "<a strong password>"
npm start
```

You should see `MongoDB connected` and `Server on port 5000`.

### 3. Mobile app

```bash
cd mobile
npm install
```

Open `mobile/config.js` and set the API address to your computer's local IP address:

```js
export const API_URL = 'http://192.168.1.12:5000';
```

Find it with `ipconfig` on Windows or `ifconfig` on macOS and Linux. Then start Expo and scan the QR code with Expo Go:

```bash
npx expo start -c
```

If the phone cannot reach the server, allow ports 5000 and 8081 through your firewall on private networks.

---

## Environment variables

`backend/.env`:

| Variable | Description |
|---|---|
| `PORT` | API port, for example `5000` |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Long random secret used to sign tokens |
| `N8N_WEBHOOK_URL` | Optional. n8n webhook called when an order is created |
| `OLLAMA_URL` | Optional. Defaults to `http://127.0.0.1:11434` |
| `OLLAMA_MODEL` | Optional. Defaults to `qwen2.5:3b` |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Never commit `.env`. Only `.env.example` is tracked.

---

## REST API overview

Base path: `/api`. Routes marked **admin** require an admin token.

| Area | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `PATCH /auth/me`, `PATCH /auth/password` |
| Meals | `GET /meals`, `GET /meals/categories`, `GET /meals/:id`, `POST /meals` (admin), `PUT /meals/:id` (admin), `PATCH /meals/:id/availability` (admin), `DELETE /meals/:id` (admin) |
| Orders | `POST /orders`, `GET /orders`, `PATCH /orders/:id/cancel` |
| Reservations | `GET /reservations/availability`, `POST /reservations`, `GET /reservations`, `PATCH /reservations/:id/cancel` |
| Admin | `GET /admin/stats`, `GET /admin/orders`, `PATCH /admin/orders/:id/status`, `GET /admin/reservations`, `DELETE /admin/reservations/:id`, `GET /admin/users`, `PATCH /admin/users/:id/role` |
| Chat | `POST /chat` (optional local AI) |

Common status codes: `400` invalid input, `401` not logged in, `403` access denied, `404` not found, `409` conflict (for example a full time slot), `413` request too large, `429` too many requests, `500` server error, `503` assistant unavailable.

---

## Security

- Passwords hashed with bcrypt; JWT tokens expire after 30 days
- Role checks on the server for every admin route
- Prices and totals recalculated from the database on every order
- Sold-out dishes and reservation capacity checked on the server
- NoSQL injection protection: `$` and `.` keys removed from request bodies
- Search input is regex-escaped
- Rate limits on the whole API, login, registration, password change and chat
- Secure HTTP headers with `helmet`
- Request size limited, with a larger limit only on photo upload
- Secrets kept in `.env`, which is excluded from Git

For a public deployment, also use HTTPS and a service such as Cloudflare in front of the server.

---

## Virtual assistant

The assistant helps clients choose a dish and answers questions about allergens and food safety.

1. **Fixed rules come first.** Emergencies, food-poisoning symptoms, allergens, hygiene and risk groups are answered by deterministic rules in the app, with a medical disclaimer. No AI is involved.
2. **Dish advice** from the rules uses the available dishes (vegetarian, budget, category, recommendations).
3. **Optional local AI.** When the rules do not understand a question, the app calls `POST /api/chat`. The server sends only the available dishes to a local model through [Ollama](https://ollama.com) and shows only dishes that really exist.
4. **Fallback.** If Ollama is stopped or too slow, the app keeps the rule-based answer.

To enable the optional AI layer:

```bash
ollama pull qwen2.5:3b
```

The assistant gives general information only and has no medical value.

---

## Order alerts with n8n (optional)

When an order is created, the backend sends a small JSON event to an [n8n](https://n8n.io) webhook, which can notify the manager on Telegram.

1. Start n8n with `npx n8n`, then open http://localhost:5678.
2. Create a workflow with a **Webhook** node (`POST`, path `new-order`) followed by a **Telegram** node (send a text message).
3. Publish the workflow and set `N8N_WEBHOOK_URL=http://127.0.0.1:5678/webhook/new-order` in `backend/.env`.

If n8n is off, orders still work: the alert is fire-and-forget.

---

## Roadmap

- [ ] Live order status refresh
- [ ] Dashboard charts (revenue per day, top dishes)
- [ ] Dish ratings and reviews
- [ ] Dark mode
- [ ] Arabic and English translations
- [ ] Online deployment with HTTPS

---

## Author

**Adem Berrabia**, DSI3
GitHub: [@Adem-Berrabia](https://github.com/Adem-Berrabia)
