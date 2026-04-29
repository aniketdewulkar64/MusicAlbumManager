# 🎵 Melodia — Inspired By Spotify

[![Vite](https://img.shields.io/badge/Vite-7.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)

**Melodia** is a high-fidelity, production-ready music management and streaming platform built on the **MERN Stack**. It features a stunning **Obsidian Glass** design system, real-time audio playback, and a sophisticated creator ecosystem.

---

## 📸 Showcase

| | | |
| :---: | :---: | :---: |
| ![Screen 1](https://via.placeholder.com/800x450?text=Home+Dashboard) | ![Screen 2](https://via.placeholder.com/800x450?text=Music+Player) | ![Screen 3](https://via.placeholder.com/800x450?text=Creator+Studio) |
| ![Screen 4](https://via.placeholder.com/800x450?text=Fullscreen+Player) | ![Screen 5](https://via.placeholder.com/800x450?text=Album+Details) | ![Screen 6](https://via.placeholder.com/800x450?text=Admin+Dashboard) |
| | ![Screen 7](https://via.placeholder.com/800x450?text=Mobile+Experience) | |

---

## ✨ Key Features

### 🎨 Obsidian Glass UI
*   **Modern Aesthetics**: Premium glassmorphism with ambient mesh gradients and vibrant teals.
*   **High Contrast**: Bold, bright-white typography optimized for maximum readability.
*   **Dynamic Banner**: A high-precision trending banner that shifts its ambient glow based on the top song's artwork.

### 🎧 Seamless Audio Experience
*   **Spotify-Style Player**: A persistent, real-time playback engine with progress tracking, volume control, and shuffle/repeat modes.
*   **Fullscreen Mode**: A cinematic "Now Playing" experience with rotating vinyl-style art and dynamic background blurring.
*   **Like System**: Interactive heart buttons across the app that feed into the global trending algorithm.

### 🚀 Creator & Admin Ecosystem
*   **Creator Dashboard**: A dedicated workspace for artists to upload songs, manage albums, and track their popularity.
*   **Admin Control**: A powerful dashboard for managing users, approving creators, and auditing system activity.
*   **Approvals Flow**: Secure registration process with administrative verification for new creators.

### 📱 Fully Responsive
*   **Mobile First**: A custom-engineered mobile layout with horizontal trending banners and streamlined navigation.
*   **Fluid Layouts**: Seamlessly adapts from 4K monitors to handheld mobile devices.

---

## 🛠️ Tech Stack

**Frontend:**
- **React 18** (Vite-powered)
- **Redux Toolkit & RTK Query** (State management & Caching)
- **Framer Motion** (Micro-animations)
- **Lucide Icons** (Premium Iconography)
- **CSS Grid & Flexbox** (Custom layout engine)

**Backend:**
- **Node.js & Express**
- **MongoDB & Mongoose** (Database)
- **JWT** (Secure Authentication)
- **Cloudinary** (Media Hosting)
- **Redis** (Optional Cache Layer)

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (for image/audio uploads)

### 2. Environment Setup
Create a `.env` file in the **backend** directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_name
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
```

### 3. Installation

**Install Backend Dependencies:**
```bash
cd backend
npm install
```

**Install Frontend Dependencies:**
```bash
cd frontend
npm install
```

### 4. Running the App

**Start Backend Server:**
```bash
cd backend
npm run dev
```

**Start Frontend (Development):**
```bash
cd frontend
npm run dev
```

The app will be live at `http://localhost:5173`.

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.

---

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

---

*Designed & Developed with ❤️ by Melodia Team*
