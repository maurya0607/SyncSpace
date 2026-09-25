# SyncSpace Production Deployment Guide

This guide provides end-to-end instructions for deploying the **SyncSpace** platform to production using **Render** (for the Node.js/Express/Socket.io backend) and **Vercel** (for the React/Vite frontend), with **MongoDB Atlas** as the database.

---

## Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [MongoDB Atlas Setup](#2-mongodb-atlas-setup)
3. [Backend Deployment (Render)](#3-backend-deployment-render)
4. [Frontend Deployment (Vercel)](#4-frontend-deployment-vercel)
5. [CORS & Security Best Practices](#5-cors--security-best-practices)
6. [Post-Deployment Verification](#6-post-deployment-verification)
7. [Troubleshooting & FAQs](#7-troubleshooting--faqs)

---

## 1. Prerequisites

Before starting, ensure you have:
- A [GitHub](https://github.com/) account with the SyncSpace repository pushed.
- A free account on [MongoDB Atlas](https://www.mongodb.com/atlas).
- A free account on [Render](https://render.com/).
- A free account on [Vercel](https://vercel.com/).

---

## 2. MongoDB Atlas Setup

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com).
2. Create a new cluster (Shared / Free tier M0).
3. **Database Access**:
   - Go to **Security** -> **Database Access**.
   - Create a database user (e.g., `syncspace_admin`) with a secure password.
   - Grant `Read and write to any database` privileges.
4. **Network Access**:
   - Go to **Security** -> **Network Access**.
   - Click **Add IP Address**.
   - Select **Allow Access from Anywhere** (`0.0.0.0/0`) so cloud hosts like Render can connect.
5. **Get Connection String**:
   - Go to **Database** -> **Connect** -> **Drivers** (Node.js).
   - Copy your connection string:
     ```text
     mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/syncspace?retryWrites=true&w=majority
     ```

---

## 3. Backend Deployment (Render)

1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository (`SyncSpace`).
4. Configure the Web Service settings:
   - **Name**: `syncspace-backend` (or custom name)
   - **Region**: Select the region closest to your users (e.g., Singapore, Frankfurt, Oregon).
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
5. Configure **Environment Variables** in Render:
   | Key | Value Example | Description |
   |---|---|---|
   | `PORT` | `5000` | Port for Express & Socket.io |
   | `MONGO_URI` | `mongodb+srv://...` | Your MongoDB Atlas connection URI |
   | `JWT_SECRET` | `your_ultra_secure_jwt_secret_key` | Secret key used for signing user tokens |
   | `CLIENT_URL` | `https://sync-space-smoky.vercel.app,http://localhost:5173` | Allowed frontend origins (comma-separated) |

6. Click **Create Web Service**.
7. Note down your backend URL (e.g. `https://syncspace-dzvu.onrender.com`).

---

## 4. Frontend Deployment (Vercel)

1. Log in to [Vercel Dashboard](https://vercel.com/).
2. Click **Add New...** -> **Project**.
3. Select your `SyncSpace` GitHub repository.
4. In the configuration screen:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click *Edit* and select `frontend`.
5. Expand **Environment Variables** and add:
   | Key | Value | Description |
   |---|---|---|
   | `VITE_API_URL` | `https://syncspace-dzvu.onrender.com/api` | Render backend API endpoint |
   | `VITE_SOCKET_URL` | `https://syncspace-dzvu.onrender.com` | Render WebSocket server endpoint |

   > [!IMPORTANT]
   > Do **NOT** remove the `VITE_` prefix. Vite requires variables to start with `VITE_` to bundle them safely into client-side code.

6. Click **Deploy**.
7. Once deployed, copy your assigned Vercel domain: `https://sync-space-smoky.vercel.app`.

---

## 5. CORS & Security Best Practices

### Updating Backend Allowed Origins
After obtaining your Vercel frontend URL:
1. Return to the **Render Dashboard**.
2. Navigate to your backend service -> **Environment**.
3. Update `CLIENT_URL` with your new Vercel domain:
   ```env
   CLIENT_URL=https://sync-space-smoky.vercel.app,http://localhost:5173
   ```
4. Click **Save Changes**.

SyncSpace's server includes resilient CORS parsing:
- It strips trailing slashes (`/`) automatically.
- It dynamically permits all `.vercel.app`, `.netlify.app`, and `.onrender.com` domains.
- It permits localhost for seamless hybrid development.

---

## 6. Post-Deployment Verification

Verify all components are operational:

1. **Backend Health Check**:
   Open in browser: `https://syncspace-dzvu.onrender.com/`  
   Expected Output: `{"message":"SyncSpace API is running"}`

2. **Frontend Loading**:
   Open your Vercel URL: `https://sync-space-smoky.vercel.app`  
   Ensure the landing page loads with all icons and themes.

3. **User Authentication Flow**:
   - Go to **Sign Up** (`/register`) and register a new test account.
   - Confirm successful redirection to the **Dashboard** (`/dashboard`).
   - Log out and log back in from the **Login** (`/login`) page.

4. **Real-Time Collaboration**:
   - Create a new room from the Dashboard.
   - Copy the invite code and open the room in an Incognito window.
   - Draw on the Whiteboard: verify instant synchronization.
   - Type in the Code Editor: verify concurrent Yjs CRDT synchronization.
   - Run code in the terminal console: verify execution output.

---

## 7. Troubleshooting & FAQs

### Q: Login fails with "Network Error" or "CORS Error"
- **Cause**: The backend does not permit requests from the frontend origin.
- **Solution**: Confirm that `CLIENT_URL` on Render includes your exact Vercel frontend URL, and that the backend has finished redeploying.

### Q: First login takes 40-50 seconds
- **Cause**: Render Free Tier spins down web services after 15 minutes of inactivity (Cold Start).
- **Solution**: The first request wakes up the service. Subsequent requests will be fast. For zero cold-start delay, upgrade to Render's Starter tier or use an external uptime monitor (e.g. UptimeRobot or Cron-job.org) to ping `https://your-service.onrender.com/` every 10 minutes.

### Q: Whiteboard drawings or code do not persist after reload
- **Cause**: MongoDB Atlas connection is misconfigured or network access is blocked.
- **Solution**: Check Render deployment logs. Ensure `0.0.0.0/0` is allowed in MongoDB Atlas Network Access.
