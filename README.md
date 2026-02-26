# 🚀 OrbitBoard - Modern Work OS

OrbitBoard is a premium, high-performance work management platform inspired by Monday.com, featuring a sleek glassmorphism UI, robust collaboration tools, and enterprise-grade permission controls.

## ✨ Features

- **💎 Premium UI/UX:** Stunning interface with glassmorphism effects, dynamic gradients, and smooth micro-animations.
- **📁 Advanced Work Management:** Draggable tasks, resizable columns, and infinite sub-item nesting.
- **💬 Real-time Activity & Updates:** High-fidelity update cards with nested replies and multi-emoji reactions.
- **🔐 Secure RBAC:** Comprehensive Role-Based Access Control and granular ownership permissions (OWNER, ADMIN, MEMBER, VIEWER).
- **📱 Responsive Design:** Fully adaptive layouts for seamless work across all devices.
- **🏗️ Resizable Infrastructure:** Integrated resizable sidebar with persistence and dynamic layouts.

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS, Framer Motion, @vibe/core.
- **Backend:** Next.js API Routes, Prisma CRM.
- **Database:** SQLite (dev) / PostgreSQL (prod ready).
- **Infrastructure:** Docker, ngrok for live tunnels.

## 🚀 Getting Started

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Setup Database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```
3. **Run the server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the board.

### Docker Deployment

To run the entire stack (Web + ngrok) in a containerized environment:

```bash
docker-compose up --build -d
```

### Live Tunneling (ngrok)

Expose your local instance to the world:
1. Set your `NGROK_AUTHTOKEN` in the `.env` file.
2. Run the Docker stack or use the local ngrok command.
3. Access the public URL generated in the dashboard.

## 📐 Architecture

- **`src/app`**: Next.js App Router for pages and API endpoints.
- **`src/components`**: Modular UI components (Vibe-based).
- **`src/lib`**: Core utilities including Auth, DB, and middleware.
- **`prisma`**: Database schemas and migration history.

## 🤝 Contributing

We welcome contributions! Whether it's fixing bugs, adding new features, or improving documentation, your help is appreciated.

1. **Fork** the repository.
2. **Create a branch** for your feature (`git checkout -b feature/amazing-feature`).
3. **Commit** your changes (`git commit -m 'Add amazing feature'`).
4. **Push** to the branch (`git push origin feature/amazing-feature`).
5. **Open a Pull Request**.

---
*Built with ❤️ for High-Performance Teams.*
