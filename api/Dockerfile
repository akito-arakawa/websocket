# syntax=docker/dockerfile:1

FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY api/package.json ./api/
RUN npm install --workspace=api
COPY api/ ./api/
RUN npm run build --workspace=api

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
COPY api/package.json ./api/
RUN npm install --workspace=api --omit=dev
COPY --from=builder /app/api/dist ./api/dist
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=api"]
