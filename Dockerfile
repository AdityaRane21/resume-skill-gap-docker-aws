# ---------- Stage 1: Build Frontend ----------
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

COPY Frontend/package*.json ./
RUN npm ci

ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY Frontend/ ./
RUN npm run build


# ---------- Stage 2: Backend ----------
FROM node:20-alpine

WORKDIR /app/backend

# Install backend deps
COPY Backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend code
COPY Backend/ ./

# Copy frontend build into backend/public
COPY --from=frontend-build /app/frontend/dist ./public

EXPOSE 5000

CMD ["node", "server.js"]