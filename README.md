# Hotel Management System (Full Stack)

This repo contains a full-stack **Hotel / Restaurant Management System** built with:

- **Backend:** Node.js + Express + MongoDB (Mongoose)
- **Frontend:** React + Vite + MUI

Main app folder: `hotel-management-system/`

## Features

- Authentication (email/password + Google sign-in)
- User profile management
- Menu & categories management (admin)
- Cart + checkout flow
- Promotions/discounts
- Loyalty points + tier discounts (points per menu item)
- Admin dashboard (customers, orders, loyalty, etc.)

## Project Structure

- `hotel-management-system/backend/` – REST API server
- `hotel-management-system/frontend/` – React web app
- `hotel-management-system/docs/` – API/architecture notes

## Prerequisites

- Node.js (LTS recommended)
- MongoDB Atlas/Server connection string

## Setup

### 1) Backend

From `hotel-management-system/backend/`:

1. Create `.env` from `.env.example`
2. Fill at least:
   - `PORT=5000`
   - `CLIENT_ORIGIN=http://localhost:5173`
   - `JWT_SECRET=...`
   - `ADMIN_EMAIL=...`
   - `ADMIN_PASSWORD=...`
   - `MONGODB_URI=...`
   - `MONGODB_DB_NAME=...` (only needed if DB name is not in the URI)

Install + run:

```bash
npm install
npm run dev
```

Optional scripts:

```bash
npm run seed:admin
npm run seed:menu
npm run seed:menu-categories
npm run mongo:status
npm run mongo:collections
```

Backend runs at `http://localhost:5000` (API base: `http://localhost:5000/api`).

### 2) Frontend

From `hotel-management-system/frontend/`:

1. Create `.env` from `.env.example`
2. Set:
   - `VITE_API_BASE_URL=http://localhost:5000/api`
   - `VITE_GOOGLE_CLIENT_ID=...` (optional, only for Google sign-in)
   - `VITE_ADMIN_EMAIL=...` (optional, used by UI)

Install + run:

```bash
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## Notes

- **Loyalty points** are calculated server-side from order `items[]` using each menu item’s `loyaltyPoints` and only count for completed statuses (`Delivered` / `Completed` / `Paid`).
- If you see duplicate Mongo collections like `menuitems` vs `menu_items`, keep the underscore versions (used by the backend) and migrate/drop the legacy ones.

