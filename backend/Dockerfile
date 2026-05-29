FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev
COPY backend/dist ./dist
EXPOSE 3000
CMD ["node", "dist/backend/index.js"]
