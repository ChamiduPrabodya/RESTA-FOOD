# Resta Fast Food Hotel Management System

Full-stack hotel and restaurant management system built with React, Vite, Node.js, Express, and MongoDB.

Live frontend: https://resta-food-ci45.vercel.app

Main application folder: `hotel-management-system/`

## Overview

This project combines customer ordering flows with admin operations in one app. Customers can browse the menu, place orders, check out, sign in with email or Google, leave feedback, and reserve VIP rooms. Admins can manage live orders, menu items, promotions, QR dining tables, bookings, and customer activity from the dashboard.

## Tech Stack

- Frontend: React 19, Vite, Material UI, Framer Motion, React Router
- Backend: Node.js, Express
- Database: MongoDB with Mongoose
- Auth: JWT and Google Sign-In
- Payments: PayHere integration

## Main Features

- Email/password authentication and Google sign-in
- Public menu browsing and checkout flow
- Delivery and dine-in ordering support
- QR-based table access for in-restaurant ordering
- VIP room booking management
- Promotions and discount handling
- Loyalty points and tier-based rewards
- Customer feedback and reviews
- Admin dashboard for live kitchen queue, bookings, customers, promotions, and menu management

## Project Structure

- `hotel-management-system/frontend/` - React web application
- `hotel-management-system/backend/` - Express API and MongoDB logic
- `render.yaml` - Render deployment config for the Node service

## Local Setup

### 1. Install dependencies

From `hotel-management-system/`:

```bash
npm install
```

The root `postinstall` script installs both backend and frontend dependencies.

### 2. Configure the backend

Create `hotel-management-system/backend/.env` and add the required values:

```env
PORT=5000
HOST=0.0.0.0
CLIENT_ORIGIN=http://localhost:5173
JWT_SECRET=your_jwt_secret
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_admin_password
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB_NAME=hotel_management_system
```

Optional backend variables:

- `CLIENT_ORIGINS`
- `PUBLIC_FRONTEND_ORIGIN`
- `GOOGLE_CLIENT_ID`
- `PAYHERE_MERCHANT_ID`
- `PAYHERE_MERCHANT_SECRET`
- `PAYHERE_CURRENCY`
- `PAYHERE_SANDBOX`
- `PAYHERE_RETURN_URL`
- `PAYHERE_CANCEL_URL`
- `PAYHERE_NOTIFY_URL`

### 3. Configure the frontend

Create `hotel-management-system/frontend/.env` from `hotel-management-system/frontend/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=
VITE_ADMIN_EMAIL=
```

### 4. Run the app locally

Backend:

```bash
cd backend
npm run dev
```

Frontend:

```bash
cd frontend
npm run dev
```

Local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- API health check: `http://localhost:5000/api/health`

## Useful Scripts

From `hotel-management-system/`:

```bash
npm run build
npm start
npm test
```

From `hotel-management-system/backend/`:

```bash
npm run dev
npm run seed:admin
npm run seed:menu
npm run seed:menu-categories
npm run mongo:status
npm run mongo:collections
npm run test
```

From `hotel-management-system/frontend/`:

```bash
npm run dev
npm run build
npm run preview
npm run lint
```

## Deployment

- Frontend live app: https://resta-food-ci45.vercel.app
- Backend service is prepared for Render deployment with `render.yaml`

## Notes

- Loyalty points are calculated on the backend from ordered items.
- QR dining tables depend on `PUBLIC_FRONTEND_ORIGIN` for shareable table links outside localhost.
- The root project expects Node.js `20.x`.
