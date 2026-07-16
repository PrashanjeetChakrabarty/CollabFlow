# CollabFlow - Real-Time Collaborative Workspace

<div align="center">
  
  <img src="public/screenshots/3_dashboard.png" width="800" alt="Global Dashboard" />
  <img src="public/screenshots/2_projects.png" width="800" alt="Project Selector" />
  <img src="public/screenshots/1_settings.png" width="800" alt="Profile Settings" />
</div>
CollabFlow is a modern, high-performance web application designed to help teams manage their workflows, track tasks, and communicate in real-time. Built entirely as a Single Page Application (SPA), it provides a seamless, app-like experience right in the browser. 

I built this project to solve the common issue of fragmented team communication merging the visual organization of a Kanban board with the immediacy of live chat, all within dedicated, secure project workspaces.

---

## 🚀 Live Demo

Experience the live application here: **[CollabFlow Web App](https://collabflowweb-7158f.web.app)**

*To test the real-time features, try opening the link in two different browsers (or an incognito window) and join the same project workspace using the 6-character invite code!*

---

## ✨ Core Features

### 1. Isolated Project Workspaces
- Create unlimited distinct project environments.
- Generate secure **6-character Invite Codes** to easily onboard teammates.
- Workspaces contain exclusively scoped task boards and chat logs so discussions never bleed into other projects.

### 2. Real-Time Kanban Board
- Fully interactive Drag & Drop interface powered by `@dnd-kit/core`.
- Real-time synchronization: Move a card on your screen, and watch it instantly update on your team's screens via Firebase Firestore listeners.
- Assigned tasks are tied heavily to authentication, allowing users to filter the board to only see their specific responsibilities.

### 3. Live Activity Feed (Chat)
- Sub-100ms message synchronization for immediate communication.
- **Privacy First:** The chat feed features an automated self cleaning mechanism. Any message older than 3 days (72 hours) is permanently wiped from the database to reduce clutter and maintain operational security.

### 4. Global Dashboard
- A unified view of your entire workload. The dashboard pulls in every task assigned to you across *all* active projects.
- Features a "Quick Add" utility to dispatch new tasks to any project without leaving the dashboard.
- Live tracking of your total tasks, in-progress items, and completed objectives.

### 5. Seamless Authentication & Profiles
- Secure Email/Password or 1-Click Google Sign-In.
- Profile management with custom avatar uploads powered by Supabase Storage.

---

## 🛠️ Technology Stack

I manually constructed this application using a modern, scalable architecture designed for high-throughput collaborative environments:

**Frontend Ecosystem:**
- **React 18 & Vite:** For lightning-fast Hot Module Replacement (HMR) during development and highly optimized production builds.
- **TypeScript:** Enforcing strict type safety across all database models (Projects, Tasks, Users) to eliminate runtime errors.
- **Zustand:** A lightweight, un-opinionated state management solution used to maintain the active user session and UI layout states globally without prop-drilling.
- **Tailwind CSS (v4):** Utilizing a custom "Orbit UI" design system composed of deep obsidian backgrounds, Electric Violet accents, and heavy use of CSS glassmorphism.
- **Framer Motion:** Powering the cinematic 3D entry animations on the authentication screens and the fluid physics of the Kanban cards.

**Backend Services:**
- **Firebase Authentication:** Handling secure JWT token generation and user session management.
- **Firebase Firestore (NoSQL):** Reactively syncing the Kanban board state and Project metadata across connected clients.
- **Firebase Realtime Database (RTDB):** Dedicated to the low-latency Live Chat and maintaining the "Online Users" presence system.
- **Supabase Storage:** Providing a generous, fast CDN bucket for user-uploaded profile avatars to avoid Firebase region-locking issues.

---

## 🔮 Future Scope & Roadmap

While the core collaborative engine is complete, I plan to expand CollabFlow in several directions:

1. **Role-Based Access Control (RBAC):** Implementing intricate permission levels (Viewer, Editor, Admin) within workspaces so project owners can lock specific columns or restrict task deletion.
2. **File Attachments:** Allowing users to drag and drop PDFs or images directly onto Kanban cards, utilizing Supabase Storage to handle the file blobs.
3. **Rich Text Editing:** Upgrading the task description fields to support Markdown, code blocks, and inline image pasting for better technical documentation.
4. **Third-Party Integrations:** Building webhooks to automatically sync task movements with GitHub Issues or send summarized daily updates to Slack/Discord channels.

---

## 💻 Local Development Setup & Copy Guide

If you want to clone this repository or copy this codebase to adapt it to your own backend, follow these detailed steps to set up your environment:

### 1. Project Installation
Clone this repository and install the project dependencies:
```bash
git clone https://github.com/yourusername/CollabFlow.git
cd CollabFlow
npm install --legacy-peer-deps
```

### 2. Environment Variables Configuration
Copy the `.env.example` file to create a new `.env` file in the root directory:
```bash
cp .env.example .env
```
Open `.env` and fill in the configuration details from your Firebase and Supabase projects:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain_here
VITE_FIREBASE_DATABASE_URL=your_firebase_database_url_here
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id_here
VITE_FIREBASE_APP_ID=your_firebase_app_id_here
VITE_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id_here # Optional

# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

---

## ⚙️ Backend Services Setup Guide

CollabFlow relies on a multi-cloud backend architecture using **Firebase** and **Supabase**. If you want to use this codebase with your own account, configure the following services:

### A. Firebase Setup
1. **Create a Project:** Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. **Add a Web App:** Register a new Web App under your project to retrieve the configuration values (API Key, Project ID, App ID, etc.) and paste them into your `.env` file.
3. **Configure Authentication:**
   - Go to **Build > Authentication > Sign-in method**.
   - Enable **Email/Password**.
   - Enable **Google** sign-in (if using Google Auth).
4. **Configure Cloud Firestore (NoSQL):**
   - Go to **Build > Firestore Database** and click **Create Database**.
   - Start in Test Mode or use the provided security rules in [firestore.rules](file:///Users/prashanjeetchakrabarty/Documents/Repository/CollabFlow/firestore.rules).
   - *Indexes:* If your queries require composite indexing, deploy them using the indexes defined in [firestore.indexes.json](file:///Users/prashanjeetchakrabarty/Documents/Repository/CollabFlow/firestore.indexes.json).
5. **Configure Realtime Database (RTDB):**
   - Go to **Build > Realtime Database** and click **Create Database** (required for real-time chat and presence tracking).
   - Use the rules provided in [database.rules.json](file:///Users/prashanjeetchakrabarty/Documents/Repository/CollabFlow/database.rules.json).
   - Copy the Database URL and paste it as `VITE_FIREBASE_DATABASE_URL` in `.env`.

### B. Supabase Setup (Profile Avatars Storage)
1. **Create a Project:** Go to the [Supabase Console](https://supabase.com/) and create a new project.
2. **Retrieve API Keys:** Under **Settings > API**, copy the Project URL and Anon public key, then paste them as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env`.
3. **Create a Storage Bucket:**
   - Go to the **Storage** section in your Supabase Dashboard.
   - Click **New Bucket** and name it `avatars`.
   - Set the bucket to **Public** (so profile pictures can be viewed by other users via URL).
   - Set up standard access rules allowing users to upload and edit files in the `avatars` bucket.

### C. Deploying Database Rules & Config
You can deploy your Firestore rules, Firestore indexes, and Realtime Database rules directly from your terminal using the Firebase CLI:
```bash
# Log in to your Firebase account
npx firebase login

# Select your active Firebase project
npx firebase use --add

# Deploy database configurations, rules, and indexes
npx firebase deploy --only firestore,database
```

---

### 3. Run the Development Server
Once all configurations are complete, launch the local development server:
```bash
npm run dev
```
The app will run at `http://localhost:5173`. Open it in your browser and start collaborating!
