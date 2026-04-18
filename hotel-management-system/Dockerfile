FROM node:20-alpine AS deps

WORKDIR /app

# Install dependencies (cached by lockfiles)
COPY backend/package.json backend/package-lock.json ./backend/
COPY frontend/package.json frontend/package-lock.json ./frontend/

RUN npm ci --prefix backend
RUN npm ci --prefix frontend


FROM node:20-alpine AS build

WORKDIR /app
COPY --from=deps /app/backend/node_modules ./backend/node_modules
COPY --from=deps /app/frontend/node_modules ./frontend/node_modules
COPY . .

RUN npm run build --prefix frontend


FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0

# Backend runtime deps only
COPY backend/package.json backend/package-lock.json ./backend/
RUN npm ci --prefix backend --omit=dev

COPY --from=build /app/backend ./backend
COPY --from=build /app/frontend/dist ./frontend/dist

CMD ["node", "backend/src/server.js"]

