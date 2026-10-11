<div align="center">

# 🍽️ MyRestaurant

**A full-stack restaurant management solution: a mobile app backed by a REST API.**

![Status](https://img.shields.io/badge/status-in%20development-blue)
![Platform](https://img.shields.io/badge/platform-mobile-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen)

[Features](#-features) • [Tech Stack](#-tech-stack) • [Getting Started](#-getting-started) • [API](#-api-overview) • [Roadmap](#-roadmap) • [Contributing](#-contributing)

</div>

---

## 📖 About

**MyRestaurant** is a mobile application that lets customers browse a restaurant's menu, place orders, and interact with the restaurant from their phone. It is powered by a dedicated backend that handles data storage, authentication, and business logic.

The repository is organized as a monorepo:

| Folder      | Description                               |
|-------------|-------------------------------------------|
| `backend/`  | Server-side application and REST API      |
| `mobile/`   | Mobile client application                 |

## ✨ Features

- 📋 Browse the restaurant menu by category
- 🔎 View dish details (description, price, image)
- 🛒 Create and manage orders
- 🔐 User registration and authentication
- 🛠️ Menu and order management through the API
- 📱 Clean, mobile-first user interface

## 📸 Screenshots

| Home | Menu | Cart |
|:----:|:----:|:----:|
| ![Home](docs/screenshots/home.png) | ![Menu](docs/screenshots/menu.png) | ![Cart](docs/screenshots/cart.png) |

## 🧰 Tech Stack

| Layer      | Technology                                  |
|------------|---------------------------------------------|
| Mobile     | [React Native / Flutter / Kotlin / Swift]   |
| Backend    | [Node.js + Express / Spring Boot / Laravel] |
| Database   | [MongoDB / MySQL / PostgreSQL]              |
| Auth       | [JWT]                                       |
| Tooling    | Git, GitHub                                 |

## 🏗️ Architecture

`````
┌──────────────┐      HTTP / JSON      ┌──────────────┐      ┌────────────┐
│  Mobile App  │ ───────────────────▶  │   Backend    │ ───▶ │  Database  │
│   (mobile/)  │ ◀───────────────────  │  (backend/)  │ ◀─── │            │
└──────────────┘                       └──────────────┘      └────────────┘
`````

## 📁 Project Structure

`````
MyRestaurant/
├── backend/          # REST API, models, routes, business logic
├── mobile/           # Mobile application source code
├── .gitignore
└── README.md
`````

## 🚀 Getting Started

### Prerequisites

Make sure you have installed:

- [Git](https://git-scm.com/)
- [Node.js](https://nodejs.org/) (v18 or later)
- A running database instance (MongoDB / MySQL / PostgreSQL)
- Android Studio or Xcode, or the Expo Go app, to run the mobile client

### 1. Clone the repository

`````bash
git clone https://github.com/Adem-Berrabia/MyRestaurant.git
cd MyRestaurant
`````

### 2. Set up the backend

`````bash
cd backend
npm install
cp .env.example .env     # then fill in your values
npm start
`````

The API will be available at `http://localhost:5000`.

### 3. Set up the mobile app

`````bash
cd mobile
npm install
npm start
`````

Then run the app on an emulator or a physical device.

> ⚠️ Make sure the mobile app points to your backend URL. When using an Android emulator, use `http://10.0.2.2:<port>` instead of `localhost`.

## ⚙️ Environment Variables

Create a `.env` file inside `backend/`:

| Variable       | Description                          | Example                             |
|----------------|--------------------------------------|-------------------------------------|
| `PORT`         | Port the server listens on           | `5000`                              |
| `DB_URI`       | Database connection string           | `mongodb://localhost:27017/myresto` |
| `JWT_SECRET`   | Secret used to sign auth tokens      | `your_secret_key`                   |

> Never commit your `.env` file. It is already excluded by `.gitignore`.

## 🔌 API Overview

| Method | Endpoint              | Description                | Auth |
|--------|-----------------------|----------------------------|:----:|
| POST   | `/api/auth/register`  | Create a new account       |  ❌  |
| POST   | `/api/auth/login`     | Log in and receive a token |  ❌  |
| GET    | `/api/menu`           | List all menu items        |  ❌  |
| GET    | `/api/menu/:id`       | Get a single menu item     |  ❌  |
| POST   | `/api/orders`         | Create an order            |  ✅  |
| GET    | `/api/orders`         | List the user's orders     |  ✅  |

## 🗺️ Roadmap

- [x] Project setup (backend + mobile)
- [ ] User authentication
- [ ] Menu browsing
- [ ] Order management
- [ ] Table reservations
- [ ] Online payment integration
- [ ] Push notifications
- [ ] Admin dashboard

## 🤝 Contributing

Contributions, issues, and feature requests are welcome.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m "Add amazing feature"`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

## 👤 Author

**Adem Berrabia**

- GitHub: [@Adem-Berrabia](https://github.com/Adem-Berrabia)

---

<div align="center">

⭐ If you like this project, give it a star!

</div>
`````
`````

**To add it on GitHub:**
1. Open your repo and click **Add file → Create new file**.
2. Name it `README.md`.
3. Paste the content and click **Commit changes**.

Before committing, replace the `[React Native / Flutter...]` placeholders in the Tech Stack table with your real stack, and check the API routes match yours.
